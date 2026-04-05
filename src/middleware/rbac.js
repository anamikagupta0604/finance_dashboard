/**
 * Role-Based Access Control middleware factory.
 *
 * Role hierarchy:
 *   admin   → full access (create, update, delete, manage users)
 *   analyst → read + dashboard summaries; cannot mutate records or manage users
 *   viewer  → read-only dashboard + own profile
 *
 * Usage:
 *   router.post('/transactions', authenticate, authorize('admin', 'analyst'), handler)
 */

const ROLE_HIERARCHY = { admin: 3, analyst: 2, viewer: 1 };

/**
 * authorize(...roles) — allows only the listed roles.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
}

/**
 * authorizeMinRole(minRole) — allows the role and any higher role.
 * e.g. authorizeMinRole('analyst') → analyst + admin
 */
function authorizeMinRole(minRole) {
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0;
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
    if (userLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Minimum required role: ${minRole}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
}

module.exports = { authorize, authorizeMinRole };