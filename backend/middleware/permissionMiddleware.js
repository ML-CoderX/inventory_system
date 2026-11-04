const db = require('../config/db');

module.exports = (permissionName) => {
  return async (req, res, next) => {
    try {
      // 1. Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // 2. Admin role automatically bypasses all permission checks
      if (req.user.role === 'admin') {
        return next();
      }

      // 3. Fetch latest user permissions from DB to handle real-time changes
      const [rows] = await req.db.query(
        'SELECT * FROM users WHERE id = ?',
        [req.user.id]
      );
      const user = rows[0];

      if (!user) {
        return res.status(404).json({ message: 'User account not found' });
      }

      // 4. Double check if role became admin in DB, or if the granular permission is granted
      if (user.role === 'admin' || user[permissionName] === 1) {
        return next();
      }

      // 5. Permission denied
      return res.status(403).json({ message: `Access denied: Requires permission to manage this task` });
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ message: 'Internal authorization server error' });
    }
  };
};
