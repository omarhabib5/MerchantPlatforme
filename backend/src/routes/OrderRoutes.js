const express = require('express');
const Order = require('../Model/Order');
const authMiddleware = require('../Middlware/Auth');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
router.use(authMiddleware);

const fieldAliases = {
  customerName: ['customername', 'customer_name', 'name', 'customer', 'اسم العميل', 'الاسم'],
  customerPhone: ['customerphone', 'customer_phone', 'phone', 'telephone', 'الهاتف', 'رقم الهاتف'],
  address: ['address', 'location', 'العنوان', 'المكان'],
  quantity: ['quantity', 'qty', 'الكمية'],
  status: ['status', 'الحالة'],
  deliveryCompany: ['deliverycompany', 'delivery_company', 'company', 'شركة التوصيل'],
  trackingId: ['trackingid', 'tracking_id', 'tracking', 'رقم التتبع'],
};

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function splitLine(line) {
  const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : line.includes('|') ? '|' : line.includes(',') ? ',' : null;
  const values = delimiter ? line.split(delimiter) : line.split(/\s{2,}/);
  return values.map((value) => value.trim().replace(/^['"]|['"]$/g, ''));
}

function rowsFromText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const headers = splitLine(lines[0]).map(normalizeKey);
  const knownHeaderCount = headers.filter((header) =>
    Object.values(fieldAliases).some((aliases) => aliases.includes(header))
  ).length;

  if (knownHeaderCount >= 2) {
    return lines.slice(1).map((line) => {
      const values = splitLine(line);
      return headers.reduce((row, header, index) => ({ ...row, [header]: values[index] || '' }), {});
    });
  }

  return lines.map((line) => {
    const values = splitLine(line);
    return {
      customerName: values[0],
      customerPhone: values[1],
      address: values[2],
      quantity: values[3],
      status: values[4],
    };
  });
}

function valueFor(row, field) {
  const normalized = Object.entries(row).reduce((result, [key, value]) => {
    result[normalizeKey(key)] = value;
    return result;
  }, {});
  return fieldAliases[field].map(normalizeKey).map((key) => normalized[key]).find((value) => value !== undefined);
}

function normalizeImportedOrder(row) {
  const status = String(valueFor(row, 'status') || 'pending').trim().toLowerCase();
  const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'rejected'];
  const quantity = Number(valueFor(row, 'quantity') || 1);
  const order = {
    customerName: String(valueFor(row, 'customerName') || '').trim(),
    customerPhone: String(valueFor(row, 'customerPhone') || '').trim(),
    address: String(valueFor(row, 'address') || '').trim(),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    status: allowedStatuses.includes(status) ? status : 'pending',
    source: 'manual',
  };

  const deliveryCompany = valueFor(row, 'deliveryCompany');
  const trackingId = valueFor(row, 'trackingId');
  if (deliveryCompany) order.deliveryCompany = String(deliveryCompany).trim();
  if (trackingId) order.trackingId = String(trackingId).trim();
  return order;
}

async function extractRows(file) {
  const extension = file.originalname.toLowerCase().split('.').pop();
  if (extension === 'json' || file.mimetype === 'application/json') {
    const parsed = JSON.parse(file.buffer.toString('utf8'));
    return Array.isArray(parsed) ? parsed : parsed.orders || [];
  }
  if (extension === 'pdf' || file.mimetype === 'application/pdf') {
    const parsed = await pdfParse(file.buffer);
    return rowsFromText(parsed.text);
  }
  if (['csv', 'txt', 'tsv'].includes(extension) || file.mimetype.startsWith('text/')) {
    return rowsFromText(file.buffer.toString('utf8'));
  }
  const error = new Error('Unsupported file type. Use PDF, CSV, TXT, TSV, or JSON.');
  error.status = 415;
  throw error;
}

// GET /api/orders  (optional ?status=pending filter)
router.get('/', async (req, res) => {
  const filter = { merchantId: req.merchantId };
  if (req.query.status) filter.status = req.query.status;

  const orders = await Order.find(filter).populate('productId').sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, merchantId: req.merchantId }).populate('productId');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// POST /api/orders  (manual order creation from the dashboard)
router.post('/', async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, merchantId: req.merchantId, source: 'manual' });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: 'Invalid order data', details: err.message });
  }
});

// POST /api/orders/import (PDF, CSV, TXT, TSV, or JSON)
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a file to import.' });

    const rows = await extractRows(req.file);
    if (!rows.length) return res.status(400).json({ error: 'No order rows were found in the file.' });
    if (rows.length > 500) return res.status(400).json({ error: 'A single import cannot contain more than 500 orders.' });

    const imported = [];
    const skipped = [];
    for (const [index, row] of rows.entries()) {
      const orderData = normalizeImportedOrder(row);
      if (!orderData.customerName || !orderData.customerPhone || !orderData.address) {
        skipped.push({ row: index + 2, reason: 'Customer name, phone, and address are required.' });
        continue;
      }
      try {
        imported.push(await Order.create({ ...orderData, merchantId: req.merchantId }));
      } catch (err) {
        skipped.push({ row: index + 2, reason: err.message });
      }
    }

    res.status(201).json({ imported: imported.length, skipped, orders: imported });
  } catch (err) {
    res.status(err.status || 400).json({ error: 'Could not import orders.', details: err.message });
  }
});

// PUT /api/orders/:id  (update status, delivery company, etc.)
// Stock decrement on delivery is handled automatically by a hook on the Order model.
router.put('/:id', async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, merchantId: req.merchantId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// DELETE /api/orders/:id
router.delete('/:id', async (req, res) => {
  const order = await Order.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ message: 'Order deleted' });
});

module.exports = router;