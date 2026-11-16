const express = require('express');
const axios = require('axios');
const authMiddleware = require('../Middlware/Auth');
const Merchant = require('../Model/Merchant');

const router = express.Router();
const MONTHLY_AMOUNT_MILLIMES = 29000;
const KONNECT_API_URL = process.env.KONNECT_API_URL || 'https://api.konnect.network/api/v2';

function getPublicUrl(path) {
    const baseUrl = process.env.APP_URL || 'http://localhost:4200';
    return `${baseUrl.replace(/\/$/, '')}${path}`;
}

function getApiPublicUrl(path) {
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    return `${baseUrl.replace(/\/$/, '')}${path}`;
}

function getKonnectConfig() {
    if (!process.env.KONNECT_API_KEY || !process.env.KONNECT_WALLET_ID) {
        throw new Error('Konnect is not configured. Set KONNECT_API_KEY and KONNECT_WALLET_ID.');
    }

    return {
        headers: { 'x-api-key': process.env.KONNECT_API_KEY },
    };
}

async function getPayment(paymentRef) {
    const config = getKonnectConfig();
    const response = await axios.get(`${KONNECT_API_URL}/payments/${paymentRef}`, config);
    return response.data;
}

function isSuccessfulPayment(payment) {
    const status = String(payment.status || payment.paymentStatus || '').toLowerCase();
    return ['completed', 'paid', 'success', 'succeeded'].includes(status);
}

async function activateSubscription(paymentRef) {
    const merchant = await Merchant.findOne({ konnectPaymentRef: paymentRef });
    if (!merchant) return false;

    const payment = await getPayment(paymentRef);
    if (!isSuccessfulPayment(payment)) return false;

    const paymentAmount = Number(payment.amount);
    if (Number.isFinite(paymentAmount) && paymentAmount !== MONTHLY_AMOUNT_MILLIMES) {
        return false;
    }

    const periodStart = merchant.currentPeriodEndsAt && merchant.currentPeriodEndsAt > new Date()
        ? merchant.currentPeriodEndsAt
        : new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    merchant.subscriptionStatus = 'active';
    merchant.currentPeriodEndsAt = periodEnd;
    await merchant.save();
    return true;
}

router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const merchant = await Merchant.findById(req.merchantId);
        if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

        const config = getKonnectConfig();
        const response = await axios.post(
            `${KONNECT_API_URL}/payments/init-payment`,
            {
                receiverWalletId: process.env.KONNECT_WALLET_ID,
                token: 'TND',
                amount: MONTHLY_AMOUNT_MILLIMES,
                type: 'immediate',
                description: 'TijaraAI monthly subscription',
                acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
                lifespan: 30,
                checkoutForm: true,
                successUrl: getPublicUrl('/dashboard?payment=success'),
                failUrl: getPublicUrl('/dashboard?payment=failed'),
                webhook: getApiPublicUrl('/api/billing/webhook'),
            },
            config
        );

        const paymentRef = response.data.paymentRef || response.data.payment_ref;
        if (!paymentRef || !response.data.payUrl) {
            return res.status(502).json({ error: 'Konnect returned an invalid checkout response' });
        }

        merchant.konnectPaymentRef = paymentRef;
        merchant.konnectPaymentCreatedAt = new Date();
        merchant.subscriptionStatus = 'pending';
        await merchant.save();

        res.json({ payUrl: response.data.payUrl, amount: MONTHLY_AMOUNT_MILLIMES / 1000 });
    } catch (err) {
        console.error('Konnect checkout error:', err.response?.data || err.message);
        res.status(502).json({ error: 'Unable to start Konnect checkout' });
    }
});

router.get('/webhook', async (req, res) => {
    const paymentRef = req.query.payment_ref;
    if (!paymentRef) return res.status(400).send('payment_ref is required');

    try {
        await activateSubscription(paymentRef);
        res.sendStatus(200);
    } catch (err) {
        console.error('Konnect webhook error:', err.response?.data || err.message);
        res.sendStatus(500);
    }
});

router.get('/status', authMiddleware, async (req, res) => {
    const merchant = await Merchant.findById(req.merchantId).select(
        'trialEndsAt subscriptionStatus currentPeriodEndsAt'
    );
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    let subscriptionStatus = merchant.subscriptionStatus;
    const now = new Date();
    if (subscriptionStatus === 'trial' && merchant.trialEndsAt <= now) subscriptionStatus = 'expired';
    if (subscriptionStatus === 'active' && merchant.currentPeriodEndsAt <= now) subscriptionStatus = 'expired';

    res.json({
        trialEndsAt: merchant.trialEndsAt,
        subscriptionStatus,
        currentPeriodEndsAt: merchant.currentPeriodEndsAt,
    });
});

module.exports = router;