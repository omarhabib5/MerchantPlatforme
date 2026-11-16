const express = require('express');
const mongoose = require('mongoose');
const Order = require('../Model/Order');
const Expense = require('../Model/Expense');
const Product = require('../Model/Product');
const MonthlyTarget = require('../Model/MonthlyTarget');
const authMiddleware = require('../Middlware/Auth');

const router = express.Router();
router.use(authMiddleware);

function monthRange(month) {
  const value = month || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const start = new Date(`${value}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

function isValidMonth(month) {
  return typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

function isCurrentMonth(month) {
  return month === new Date().toISOString().slice(0, 7);
}

router.get('/targets', async (req, res) => {
  const month = req.query.month;
  if (!isValidMonth(month)) return res.status(400).json({ error: 'month must use YYYY-MM format' });

  try {
    const target = await MonthlyTarget.findOne({ merchantId: req.merchantId, month }).lean();
    res.json(target || { month, revenueGoal: 0, orderGoal: 0, profitGoal: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load monthly targets', details: err.message });
  }
});

router.put('/targets', async (req, res) => {
  const { month, revenueGoal, orderGoal, profitGoal } = req.body || {};
  if (!isCurrentMonth(month)) {
    return res.status(400).json({ error: 'Only the current month goals can be edited' });
  }
  const goals = [revenueGoal, orderGoal, profitGoal];
  if (!isValidMonth(month) || goals.some((goal) => typeof goal !== 'number' || !Number.isFinite(goal) || goal < 0)) {
    return res.status(400).json({ error: 'month and non-negative numeric goals are required' });
  }

  try {
    const target = await MonthlyTarget.findOneAndUpdate(
      { merchantId: req.merchantId, month },
      { merchantId: req.merchantId, month, revenueGoal, orderGoal, profitGoal },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    res.json(target);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save monthly targets', details: err.message });
  }
});

router.get('/months', async (req, res) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.merchantId);
    const [orderMonths, expenseMonths] = await Promise.all([
      Order.aggregate([
        { $match: { merchantId } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } } },
      ]),
      Expense.aggregate([
        { $match: { merchantId } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$expenseDate' } } } },
      ]),
    ]);
    const months = [...new Set([...orderMonths, ...expenseMonths].map((item) => item._id))]
      .sort()
      .reverse();
    res.json(months);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load analytics months', details: err.message });
  }
});

// GET /api/analytics/summary
// Returns the core numbers for the Analytics dashboard screen:
// revenue, expense total, net profit this month, order count, rejection rate.
router.get('/summary', async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const range = monthRange(req.query.month);
    if (!range) return res.status(400).json({ error: 'month must use YYYY-MM format' });

    const [orders, expenses] = await Promise.all([
      Order.find({ merchantId, createdAt: { $gte: range.start, $lt: range.end } }).populate('productId'),
      Expense.find({ merchantId, expenseDate: { $gte: range.start, $lt: range.end } }),
    ]);

    const totalOrders = orders.length;
    const rejectedOrders = orders.filter((o) => o.status === 'rejected').length;
    const rejectionRate = totalOrders ? Math.round((rejectedOrders / totalOrders) * 100) : 0;

    // Revenue = sum of (sellingPrice - buyingPrice) * quantity for delivered orders only
    const revenue = orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => {
        const selling = o.productId?.sellingPrice || 0;
        const buying = o.productId?.buyingPrice || 0;
        const qty = o.quantity || 1;
        return sum + (selling - buying) * qty;
      }, 0);

    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const netProfit = revenue - totalExpenses;

    res.json({ revenue, totalExpenses, netProfit, totalOrders, rejectedOrders, rejectionRate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute analytics summary', details: err.message });
  }
});

// GET /api/analytics/orders-per-product
// Returns order count and revenue grouped by product, for the "top products" view.
router.get('/orders-per-product', async (req, res) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.merchantId);
    const range = monthRange(req.query.month);
    if (!range) return res.status(400).json({ error: 'month must use YYYY-MM format' });

    // Aggregate per-product stats including revenue calculated as (selling - buying) * quantity
    const results = await Order.aggregate([
      { $match: { merchantId, createdAt: { $gte: range.start, $lt: range.end } } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product._id',
          product: { $first: '$product' },
          orderCount: { $sum: 1 },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                { $multiply: [{ $subtract: ['$product.sellingPrice', '$product.buyingPrice'] }, { $ifNull: ['$quantity', 1] }] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { orderCount: -1 } },
    ]);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute per-product analytics', details: err.message });
  }
});

module.exports = router;