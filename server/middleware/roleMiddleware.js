/**
 * Role Authorization Middleware
 * 
 * Restricts access to endpoints based on user roles:
 * - 'citizen': General public
 * - 'officer': Department personnel
 * - 'admin': System administrator
 * 
 * Usage:
 * router.get('/admin/complaints', protect, restrictTo('admin', 'officer'), controllerFn);
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to access this resource.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Your role (${req.user.role}) does not have permission to perform this action.`,
      });
    }

    next();
  };
};

module.exports = { restrictTo };
