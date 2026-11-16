const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const Groq = require('groq-sdk');

const Merchant = require('../Model/Merchant');
const Message = require('../Model/Message');

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// GET /webhook/meta  — one-time verification handshake with Meta
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// POST /webhook/meta — receives real message events from Facebook/Instagram
router.post('/meta', async (req, res) => {
  // 1. Verify the request really came from Meta
  // Skipped automatically in development so Postman testing still works;
  // ALWAYS enforced in production — do not remove this check.
  if (process.env.NODE_ENV === 'production') {
    const signature = req.headers['x-hub-signature-256'];
    if (!isValidSignature(req.rawBody, signature)) {
      return res.sendStatus(403);
    }
  }

  console.log('✅ Webhook hit! Payload:', JSON.stringify(req.body, null, 2));

  // 2. Acknowledge immediately — Meta requires a fast response
  res.sendStatus(200);

  // 3. Process the event asynchronously
  try {
    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging?.message?.text) return; // ignore non-text events (read receipts, etc.)

    const pageOrIgId = entry.id;
    const customerPsid = messaging.sender.id;
    const customerText = messaging.message.text;

    // The same entry.id is used for both Facebook Page events and linked Instagram events,
    // so we check both fields to find the right merchant.
    const merchant = await Merchant.findOne({
      $or: [{ facebookPageId: pageOrIgId }, { instagramAccountId: pageOrIgId }],
    });
    if (!merchant) {
      console.log('⚠️ No merchant found for id:', pageOrIgId);
      return;
    }

    const platform = merchant.instagramAccountId === pageOrIgId ? 'instagram' : 'facebook';

    const aiResult = await getAIReply(customerText);
    console.log('🤖 Groq reply:', aiResult.reply);
    console.log('🤖 Extracted order data:', aiResult.order_data);

    await Message.create({
      merchantId: merchant._id,
      customerPsid,
      platform,
      customerText,
      aiReply: aiResult.reply,
      extractedOrderData: aiResult.order_data,
      orderComplete: aiResult.complete,
    });

    // Both Facebook and Instagram replies go through the same Send API using the page token
    await sendMetaReply(merchant.facebookPageAccessToken, customerPsid, aiResult.reply);
  } catch (err) {
    console.error('❌ Webhook processing error:', err.message);
  }
});

function isValidSignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', process.env.META_APP_SECRET).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
}

async function getAIReply(customerMessage) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a customer service assistant for a Tunisian online shop.
Reply in Tunisian Arabic dialect (Derja). Extract order details when possible.
Always respond with valid JSON in this exact format:
{"reply": "...", "order_data": {"product": "", "quantity": null, "address": "", "phone": ""}, "complete": false}`,
      },
      { role: 'user', content: customerMessage },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content);
}

async function sendMetaReply(pageAccessToken, recipientPsid, replyText) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages`,
    { recipient: { id: recipientPsid }, message: { text: replyText } },
    { params: { access_token: pageAccessToken } }
  );
}

module.exports = router;