const jwt = require('jsonwebtoken');
const { getTenantPool } = require('../config/db');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token format is invalid' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    
    // Attach tenant connection pool dynamically
    req.db = getTenantPool(decoded.db_name);
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
