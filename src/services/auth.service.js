const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Sign a JWT for the given user.
 */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Register a new user. Only admins call this endpoint (enforced in route).
 */
async function register({ name, email, password, role = 'viewer' }) {
  // Check duplicate email
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) {
    const err = new Error('Email already registered.');
    err.statusCode = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, status, created_at`,
    [name, email, hash, role]
  );
  return rows[0];
}

/**
 * Authenticate with email + password. Returns { user, token }.
 */
async function login({ email, password }) {
  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];

  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }
  if (user.status === 'inactive') {
    const err = new Error('Account is deactivated. Contact an administrator.');
    err.statusCode = 403;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user);
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * Return the public profile of the logged-in user.
 */
async function getProfile(userId) {
  const { rows } = await query(
    'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  return rows[0] || null;
}

module.exports = { register, login, getProfile };