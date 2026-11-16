require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./src/routes/AuthRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const expenseRoutes = require('./src/routes/ExpensesRoutes');

const analyticsRoutes = require('./src/routes/Analyticsroutes ');
const deliveryRoutes = require('./src/routes/deliveryRoutes');
const advisorRoutes = require('./src/routes/AdvisorRoutes');
const billingRoutes = require('./src/routes/BillingRoutes');
const errorHandler = require('./src/Middlware/Errorhandler');

const app = express();

app.use(cors());

// IMPORTANT: the webhook route needs the raw body to verify Meta's signature,
// so we capture it here before the normal JSON parser runs.
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/expenses', expenseRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/api/delivery', deliveryRoutes);

app.use('/api/messages', require('./src/routes/MessageRoutes'));
app.use('/api/customers', require('./src/routes/ConstumerRoutes'));
app.use('/api/advisor', advisorRoutes);
app.use('/api/billing', billingRoutes);

// Only mount test-only routes outside production — never reachable once deployed live
if (process.env.NODE_ENV !== 'production') {
  const testRoutes = require('./src/routes/testRoute');
  app.use('/api/test', testRoutes);
  console.log('⚠️  Test routes mounted at /api/test (development only)');
}

app.get('/', (req, res) => res.json({ status: 'API running' }));

// Must be mounted LAST — after all routes
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');

    try {
      const merchantCollection = mongoose.connection.db.collection('merchants');
      const indexes = await merchantCollection.indexes();
      const hasLegacyIndex = indexes.some((index) => index.name === 'facebookUserId_1');

      if (hasLegacyIndex) {
        await merchantCollection.dropIndex('facebookUserId_1');
        console.log('Dropped legacy unique facebookUserId index');
      }

      await merchantCollection.createIndex({ facebookUserId: 1 }, { unique: true, sparse: true });
      console.log('Ensured merchant facebookUserId index is sparse/unique');
    } catch (indexErr) {
      console.error('Merchant index repair failed:', indexErr.message);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err.message));