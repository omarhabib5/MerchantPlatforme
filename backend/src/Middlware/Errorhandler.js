// Centralized error handler — mount this LAST in app.js, after all routes.
// Catches anything passed to next(err), plus Express's own thrown errors.
function errorHandler(err, req, res, next) {
  console.error('❌ Unhandled error:', err.stack || err.message);

  // Mongoose validation errors get a clean 400 instead of a raw 500
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message });
  }

  // Invalid MongoDB ObjectId format (e.g. malformed :id in a route param)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = errorHandler;