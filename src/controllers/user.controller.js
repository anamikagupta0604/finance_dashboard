const userService = require('../services/user.service');

async function listUsers(req, res, next) {
  try {
    const result = await userService.listUsers({
      role:   req.query.role,
      status: req.query.status,
      page:   parseInt(req.query.page)  || 1,
      limit:  parseInt(req.query.limit) || 20,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User updated.', data: user });
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const deleted = await userService.deleteUser(req.params.id, req.user);
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
}

module.exports = { listUsers, getUser, updateUser, deleteUser };