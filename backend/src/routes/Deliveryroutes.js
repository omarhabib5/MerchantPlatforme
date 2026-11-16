const express = require('express');
const Order = require('../Model/Order');
const authMiddleware = require('../Middlware/Auth'); // Adjusted import path to match your project structure

const router = express.Router();
router.use(authMiddleware);

// GET /api/delivery/tracked
// Returns every order that's out for delivery or beyond, grouped by delivery company —
// feeds the unified "Delivery" screen from the dashboard mockup.
router.get('/tracked', async (req, res) => {
  try {
    const orders = await Order.find({
      merchantId: req.merchantId,
      status: { $in: ['shipped', 'delivered', 'rejected'] },
    })
      .populate('productId')
      .sort({ updatedAt: -1 });

    const grouped = orders.reduce((acc, order) => {
      const company = order.deliveryCompany || 'Unassigned';
      if (!acc[company]) acc[company] = [];
      acc[company].push(order);
      return acc;
    }, {});

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delivery data', details: err.message });
  }
});

// PATCH /api/delivery/:orderId
// Update delivery company / tracking ID / status for one order.
router.patch('/:orderId', async (req, res) => {
  try {
    const { deliveryCompany, trackingId, status } = req.body;
    const update = {};
    if (deliveryCompany !== undefined) update.deliveryCompany = deliveryCompany;
    if (trackingId !== undefined) update.trackingId = trackingId;
    if (status !== undefined) update.status = status;

    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, merchantId: req.merchantId },
      update,
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update delivery info', details: err.message });
  }
});

module.exports = router;