const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    customerPsid: { type: String, required: true }, // Meta's per-page sender ID
    platform: { type: String, enum: ['facebook', 'instagram'], required: true },

    customerText: { type: String, required: true },
    aiReply: { type: String },

    extractedOrderData: {
      product: { type: String },
      quantity: { type: Number },
      address: { type: String },
      phone: { type: String },
    },
    orderComplete: { type: Boolean, default: false },

    // set once a Message leads to a created Order
    resultingOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);