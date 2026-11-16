const express = require('express');
const Merchant = require('../Model/Merchant');
const authMiddleware = require('../Middlware/Auth');

const router = express.Router();
router.use(authMiddleware);

// PATCH /api/test/set-page-id
// FOR LOCAL TESTING ONLY — saves facebookPageId/token directly,
// skipping the real Meta subscribe call. Remove before production.
router.patch('/set-page-id', async (req, res) => {
  try {
    const { pageId, pageAccessToken } = req.body;
    if (!pageId) return res.status(400).json({ error: 'pageId is required' });

    const merchant = await Merchant.findByIdAndUpdate(
      req.merchantId,
      {
        facebookPageId: pageId,
        facebookPageAccessToken: pageAccessToken || 'test_placeholder_token',
      },
      { new: true }
    );

    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
    res.json({ message: 'Page ID set for testing', merchant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;