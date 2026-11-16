const express = require('express');
const Message = require('../Model/Message');
const authMiddleware = require('../Middlware/Auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/messages  (optional ?platform=facebook|instagram filter)
router.get('/', async (req, res) => {
  const filter = { merchantId: req.merchantId };
  if (req.query.platform) filter.platform = req.query.platform;

  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json(messages);
});

module.exports = router;