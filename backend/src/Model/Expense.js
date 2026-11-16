const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    title: { type: String, required: true },
    category: { type: String, default: 'other' },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String },
    expenseDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);