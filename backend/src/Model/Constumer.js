const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },

    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },

    // Running totals, kept in sync automatically whenever an order is created/updated
    totalOrders: { type: Number, default: 0 },
    deliveredOrders: { type: Number, default: 0 },
    rejectedOrders: { type: Number, default: 0 },

    source: { type: String, enum: ['facebook', 'instagram', 'manual'], default: 'manual' },
  },
  { timestamps: true }
);

// One customer per phone number, per merchant — this is how we detect repeat customers
customerSchema.index({ merchantId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);