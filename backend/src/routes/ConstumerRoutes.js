const express = require('express');
const Customer = require('../Model/Constumer');
const authMiddleware = require('../Middlware/Auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/customers  (sorted by most recent activity)
router.get('/', async (req, res) => {
  const customers = await Customer.find({ merchantId: req.merchantId }).sort({ updatedAt: -1 });
  res.json(customers);
});

// GET /api/customers/lookup?phone=...  - find a customer by phone for the current merchant
router.get('/lookup', async (req, res) => {
  try {
    const phone = (req.query.phone || '').toString().trim();
    if (!phone) return res.status(400).json({ error: 'phone query parameter is required' });

    const customer = await Customer.findOne({ merchantId: req.merchantId, phone });
    // return null if not found so frontend can handle autofill appropriately
    if (!customer) return res.json(null);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Lookup failed', details: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, merchantId: req.merchantId });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer', details: err.message });
  }
});

module.exports = router;