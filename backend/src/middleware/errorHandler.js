function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
