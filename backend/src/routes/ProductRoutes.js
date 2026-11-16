const express = require('express');
const Product = require('../Model/Product');
const authMiddleware = require('../Middlware/Auth'); // Adjusted import path to match your project structure

const router = express.Router();
router.use(authMiddleware); // every route below requires a logged-in merchant

// GET /api/products
router.get('/', async (req, res) => {
  const products = await Product.find({ merchantId: req.merchantId }).sort({ createdAt: -1 });
  res.json(products);
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, merchantId: req.merchantId });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { name, description, buyingPrice, sellingPrice, stock, imageUrl, lowStockThreshold } = req.body;
    const resolvedSellingPrice = sellingPrice ?? 0;
    const resolvedBuyingPrice = buyingPrice ?? 0;
    const product = await Product.create({
      merchantId: req.merchantId,
      name,
      description,
    
      buyingPrice: resolvedBuyingPrice,
      sellingPrice: resolvedSellingPrice,
      stock,
      imageUrl,
      lowStockThreshold,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: 'Invalid product data', details: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  const payload = { ...req.body };
  const resolvedSellingPrice = payload.sellingPrice ?? 0;
  const resolvedBuyingPrice = payload.buyingPrice ?? 0;

  if (resolvedSellingPrice !== undefined) {
    payload.sellingPrice = resolvedSellingPrice;
  }

  if (resolvedBuyingPrice !== undefined) {
    payload.buyingPrice = resolvedBuyingPrice;
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, merchantId: req.merchantId },
    payload,
    { new: true, runValidators: true }
  );
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deleted' });
});

module.exports = router;