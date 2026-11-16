const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true },
    description: { type: String },
   
    buyingPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    imageUrl: { type: String },
    lowStockThreshold: { type: Number, default: 3 },
  },
  { timestamps: true }
);

// Virtual flag used by the dashboard to show low-stock / out-of-stock badges
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);