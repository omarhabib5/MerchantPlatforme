const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    password: { type: String, default: null },
    facebookUserId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      trim: true,
    },
    facebookPageId: { type: String, default: null },
    facebookPageName: { type: String, default: null },
    facebookPageAccessToken: { type: String, default: null },
    instagramAccountId: { type: String, default: null },
    instagramUsername: { type: String, default: null },
    trialEndsAt: { type: Date, default: null },
    subscriptionStatus: { type: String, default: 'expired' },
    currentPeriodEndsAt: { type: Date, default: null },
    konnectPaymentRef: { type: String, default: null },
    konnectPaymentCreatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Merchant', merchantSchema);