const ALLOWED_METHODS = 'GET, OPTIONS';

function methodNotAllowed(req, res) {
  res.setHeader('Allow', ALLOWED_METHODS);
  return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = methodNotAllowed;
