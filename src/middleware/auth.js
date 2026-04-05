const jwt  = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * authenticate — verifies the Bearer JWT in the Authorization header.
 * Attaches `req.user` with { id, name, email, role, status }.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication token missing.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch fresh user data on every request (catches deactivated users)
    const { rows } = await query(
      'SELECT id, name, email, role, status FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    const user = rows[0];
    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

module.exports = { authenticate };