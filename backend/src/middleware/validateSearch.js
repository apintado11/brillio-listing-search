const { validateSearchQuery } = require('../validators/searchQuery');

function validateSearch(req, res, next) {
  const parsed = validateSearchQuery(req.query);
  if (!parsed.ok) {
    return res.status(400).json({
      error: parsed.error,
      details: parsed.details,
    });
  }
  req.validatedQuery = parsed.value;
  return next();
}

module.exports = validateSearch;
