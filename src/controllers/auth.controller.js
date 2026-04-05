const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, message: 'User created successfully.', data: user });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, message: 'Login successful.', data: result });
  } catch (err) { next(err); }
}

async function getProfile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

module.exports = { register, login, getProfile };