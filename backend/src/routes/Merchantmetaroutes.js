const express = require('express');
const axios = require('axios');
const Merchant = require('../Model/Merchant');
const authMiddleware = require('../Middlware/Auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/merchant/connect-facebook
// Body: { pageId, pageName, pageAccessToken } — sent by the frontend after FB.login()
router.post('/connect-facebook', async (req, res) => {
  try {
    const { pageId, pageName, pageAccessToken } = req.body;
    if (!pageId || !pageAccessToken) {
      return res.status(400).json({ error: 'pageId and pageAccessToken are required' });
    }

    // 1. Look up if this Page has a linked Instagram professional account
    let instagramAccountId = null;
    let instagramUsername = null;
    try {
      const igLookup = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
        params: {
          fields: 'instagram_business_account{id,username}',
          access_token: pageAccessToken,
        },
      });
      if (igLookup.data.instagram_business_account) {
        instagramAccountId = igLookup.data.instagram_business_account.id;
        instagramUsername = igLookup.data.instagram_business_account.username;
      }
    } catch (igErr) {
      console.warn('No Instagram account linked to this page, continuing with Facebook only.');
    }

    // 2. Save the page (and Instagram, if found) connection on the merchant
    const merchant = await Merchant.findByIdAndUpdate(
      req.merchantId,
      {
        facebookPageId: pageId,
        facebookPageName: pageName,
        facebookPageAccessToken: pageAccessToken,
        instagramAccountId,
        instagramUsername,
      },
      { new: true }
    );
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    // 3. Subscribe this page to our app's webhook for both Facebook and Instagram messaging.
    // Instagram DMs arrive through the same webhook once the linked page is subscribed.
    const subscribedFields = instagramAccountId
      ? 'messages,messaging_postbacks'
      : 'messages';

    await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
      null,
      {
        params: {
          subscribed_fields: subscribedFields,
          access_token: pageAccessToken,
        },
      }
    );

    res.json({
      message: instagramAccountId
        ? 'Facebook page and linked Instagram account connected successfully'
        : 'Facebook page connected successfully (no Instagram account linked)',
      merchant,
    });
  } catch (err) {
    console.error('Facebook connect error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to connect Facebook page' });
  }
});

module.exports = router;