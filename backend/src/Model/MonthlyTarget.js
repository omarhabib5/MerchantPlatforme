const mongoose = require('mongoose');

const monthlyTargetSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    revenueGoal: { type: Number, required: true, min: 0 },
    orderGoal: { type: Number, required: true, min: 0 },
    profitGoal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

monthlyTargetSchema.index({ merchantId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyTarget', monthlyTargetSchema);
