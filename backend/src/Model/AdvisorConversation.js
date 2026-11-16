const mongoose = require('mongoose');

const advisorMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['merchant', 'advisor'], required: true },
    content: { type: String, required: true, maxlength: 12000 },
  },
  { timestamps: true, _id: true }
);

const advisorConversationSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true, unique: true },
    messages: { type: [advisorMessageSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdvisorConversation', advisorConversationSchema);