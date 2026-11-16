const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Merchant = require('../Model/Merchant');
const authMiddleware = require('../Middlware/Auth');

const router = express.Router();

function getSubscriptionStatus(merchant) {
  const now = new Date();
  if (merchant.subscriptionStatus === 'active' && merchant.currentPeriodEndsAt <= now) {
    return 'expired';
  }
  if (merchant.subscriptionStatus === 'trial' && merchant.trialEndsAt <= now) {
    return 'expired';
  }
  return merchant.subscriptionStatus;
}

// POST /api/auth/register
// Simple email/password signup — name, email, password.
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { name, email, password } = req.body;

      const existing = await Merchant.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const merchant = await Merchant.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        trialEndsAt: null,
        subscriptionStatus: 'expired',
      });

      const token = jwt.sign({ merchantId: merchant._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.status(201).json({
        token,
        merchant: {
          id: merchant._id,
          name: merchant.name,
          email: merchant.email,
          facebookPageId: merchant.facebookPageId,
          instagramAccountId: merchant.instagramAccountId,
          trialEndsAt: merchant.trialEndsAt,
          subscriptionStatus: merchant.subscriptionStatus,
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Registration failed', details: err.message });
    }
  }
);

// POST /api/auth/login
// Email/password sign-in for merchants who registered that way.
router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const { email, password } = req.body;

      const merchant = await Merchant.findOne({ email: email.toLowerCase() });
      if (!merchant || !merchant.password) {
        // Either no account, or this account was created via Facebook (no password set)
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, merchant.password);
      if (!match) return res.status(401).json({ error: 'Invalid email or password' });

      const token = jwt.sign({ merchantId: merchant._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({
        token,
        merchant: {
          id: merchant._id,
          name: merchant.name,
          email: merchant.email,
          facebookPageId: merchant.facebookPageId,
          instagramAccountId: merchant.instagramAccountId,
          trialEndsAt: merchant.trialEndsAt,
          subscriptionStatus: merchant.subscriptionStatus,
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Login failed', details: err.message });
    }
  }
);

// POST /api/auth/change-password
// Lets the signed-in merchant change their password, or set one if none exists yet.
router.post(
  '/change-password',
  authMiddleware,
  [body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { currentPassword, newPassword } = req.body;

      const merchant = await Merchant.findById(req.merchantId);
      if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

      if (merchant.password) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required' });
        }

        const match = await bcrypt.compare(currentPassword, merchant.password);
        if (!match) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
      }

      merchant.password = await bcrypt.hash(newPassword, 10);
      await merchant.save();

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update password', details: err.message });
    }
  }
);

// POST /api/auth/facebook
// Body: { accessToken } — the User Access Token from FB.login() on the frontend
// Handles BOTH login and registration: creates the merchant on first login,
// just signs them in on every login after that. No password involved.
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });

    // 1. Verify the token and get the person's identity directly from Facebook
    const profileRes = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: { fields: 'id,name,email', access_token: accessToken },
    });
    const { id: facebookUserId, name, email } = profileRes.data;

    // 2. Find or create the merchant based on their Facebook user ID
    let merchant = await Merchant.findOne({ facebookUserId });
    if (!merchant) {
      merchant = await Merchant.create({
        facebookUserId,
        name,
        email,
        trialEndsAt: null,
        subscriptionStatus: 'expired',
      });
    }

    // 3. Issue our own JWT for subsequent API calls, same as before
    const token = jwt.sign({ merchantId: merchant._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      merchant: {
        id: merchant._id,
        name: merchant.name,
        email: merchant.email,
        facebookPageId: merchant.facebookPageId,
        instagramAccountId: merchant.instagramAccountId,
        trialEndsAt: merchant.trialEndsAt,
        subscriptionStatus: getSubscriptionStatus(merchant),
      },
    });
  } catch (err) {
    console.error('Facebook auth error:', err.response?.data || err.message);
    res.status(401).json({ error: 'Facebook authentication failed' });
  }
});

// GET /api/auth/me
// Returns the current logged-in merchant's fresh data — used by the frontend
// to refresh facebookPageId/instagramAccountId after connecting a Page.
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.merchantId);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    res.json({
      merchant: {
        id: merchant._id,
        name: merchant.name,
        email: merchant.email,
        facebookPageId: merchant.facebookPageId,
        facebookPageName: merchant.facebookPageName,
        instagramAccountId: merchant.instagramAccountId,
        instagramUsername: merchant.instagramUsername,
        subscriptionStatus: merchant.subscriptionStatus,
        trialEndsAt: merchant.trialEndsAt,
        currentPeriodEndsAt: merchant.currentPeriodEndsAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch merchant data' });
  }
});

module.exports = router;