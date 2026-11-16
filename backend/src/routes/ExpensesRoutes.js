const express = require('express');
const Expense = require('../Model/Expense');
const authMiddleware = require('../Middlware/Auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const expenses = await Expense.find({ merchantId: req.merchantId }).sort({ expenseDate: -1, createdAt: -1 });
  res.json(expenses);
});

router.get('/:id', async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, merchantId: req.merchantId });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
});

router.post('/', async (req, res) => {
  try {
    const { title, category, amount, notes, expenseDate } = req.body;
    const expense = await Expense.create({
      merchantId: req.merchantId,
      title,
      category: category || 'other',
      amount,
      notes,
      expenseDate: expenseDate || Date.now(),
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: 'Invalid expense data', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const payload = { ...req.body };
  if (payload.category === undefined) {
    delete payload.category;
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, merchantId: req.merchantId },
    payload,
    { new: true, runValidators: true }
  );

  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
});

router.delete('/:id', async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
});

module.exports = router;