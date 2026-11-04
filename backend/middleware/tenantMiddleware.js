const { getTenantPool } = require('../config/db');
const db = require('../config/db'); // Default central database pool

module.exports = async (req, res, next) => {
  try {
    // 1. If user is authenticated, retrieve tenant database from decoded JWT
    if (req.user && req.user.db_name) {
      req.db = getTenantPool(req.user.db_name);
      return next();
    }

    // 2. For unauthenticated requests (like login), look up the tenant by username
    const username = req.body.username || req.query.username;
    if (username) {
      const [rows] = await db.query('SELECT db_name FROM users_central WHERE username = ?', [username.trim()]);
      if (rows.length > 0) {
        req.db = getTenantPool(rows[0].db_name);
        return next();
      }
    }

    // 3. Fallback to central default database
    req.db = db;
    next();
  } catch (err) {
    console.error('Tenant middleware error:', err);
    res.status(500).json({ message: 'Internal server error resolving tenant database' });
  }
};
