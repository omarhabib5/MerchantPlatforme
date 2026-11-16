const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    address: { type: String, required: true },
    quantity: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'rejected'],
      default: 'pending',
    },
    source: { type: String, enum: ['facebook', 'instagram', 'manual'], required: true },

    deliveryCompany: { type: String },
    trackingId: { type: String },

    // used later for the rejection-risk feature (problem #5)
    rejectionRiskScore: { type: Number, default: null },
  },
  { timestamps: true }
);

// --- Auto-create/update the Customer record whenever an order is created ---
// Runs on Order.create() (used by both manual creation and, later, AI-created orders).
// Matches customers by phone number per merchant — same phone = same customer.

orderSchema.post('save', async function (order) {
  if (!this.wasNew) return; // only run this on brand-new orders, not every re-save
  const Customer = mongoose.model('Customer');

  await Customer.findOneAndUpdate(
    { merchantId: order.merchantId, phone: order.customerPhone },
    {
      $set: { name: order.customerName, address: order.address, source: order.source },
      $inc: { totalOrders: 1 },
      $setOnInsert: { merchantId: order.merchantId, phone: order.customerPhone },
    },
    { upsert: true, new: true }
  );
});

// Track whether this save is a new document (needed by the hook above,
// since post('save') doesn't tell us this directly)
orderSchema.pre('save', function () {
  this.wasNew = this.isNew;
});

// --- Auto-decrement stock when an order becomes 'delivered' ---
// Runs on any findOneAndUpdate (used by both orderRoutes.js and deliveryRoutes.js),
// so this logic lives in one place instead of being duplicated per route.

orderSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() || {};
  if (update.status === 'delivered' || update.status === 'rejected') {
    const existing = await this.model.findOne(this.getQuery());
    if (existing && existing.status !== update.status) {
      this._statusChange = {
        newStatus: update.status,
        productId: existing.productId,
        quantity: existing.quantity || 1,
        merchantId: existing.merchantId,
        phone: existing.customerPhone,
      };
    }
  }
});

orderSchema.post('findOneAndUpdate', async function () {
  if (!this._statusChange) return;
  const { newStatus, productId, quantity, merchantId, phone } = this._statusChange;

  if (newStatus === 'delivered' && productId) {
    const Product = mongoose.model('Product');
    await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
  }

  // Keep the customer's delivered/rejected counters in sync too
  const Customer = mongoose.model('Customer');
  const field = newStatus === 'delivered' ? 'deliveredOrders' : 'rejectedOrders';
  await Customer.findOneAndUpdate({ merchantId, phone }, { $inc: { [field]: 1 } });
});

module.exports = mongoose.model('Order', orderSchema);