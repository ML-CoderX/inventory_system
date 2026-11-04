const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const db = require('../config/db'); // Default pool / Central DB
const { getTenantPool } = require('../config/db');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Query on tenant DB (req.db is attached by tenantMiddleware)
    const [rows] = await req.db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get currently connected tenant DB name dynamically
    const [dbRow] = await req.db.query('SELECT DATABASE() as dbName');
    const tenantDbName = dbRow[0].dbName;

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, db_name: tenantDbName },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, role: user.role, db_name: tenantDbName }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [rows] = await req.db.query(
      'SELECT id, username, role, can_manage_products, can_manage_suppliers, can_manage_stock, can_view_reports, can_delete_items FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Server error retrieving profile details' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Retrieve user from tenant database
    const [rows] = await req.db.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare with current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update in tenant database
    await req.db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ message: 'Server error during password update' });
  }
};

exports.registerShop = async (req, res) => {
  try {
    const { shopName, adminUsername, adminPassword } = req.body;

    if (!shopName || !adminUsername || !adminPassword) {
      return res.status(400).json({ message: 'Shop name, admin username, and admin password are required' });
    }

    if (adminPassword.length < 6) {
      return res.status(400).json({ message: 'Admin password must be at least 6 characters long' });
    }

    // 1. Check if username already exists in central users directory
    const [existingCentralUser] = await db.query(
      'SELECT * FROM users_central WHERE username = ?',
      [adminUsername.trim()]
    );
    if (existingCentralUser.length > 0) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // 2. Sanitize shop name to create a valid safe database name
    const sanitizedShopName = shopName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
    const tenantDbName = `shop_${sanitizedShopName}`;

    // 3. Check if shop or database name is already registered in central database
    const [existingShop] = await db.query(
      'SELECT * FROM shops WHERE name = ? OR db_name = ?',
      [shopName.trim(), tenantDbName]
    );

    if (existingShop.length > 0) {
      return res.status(400).json({ message: 'A shop with this name or database is already registered' });
    }

    console.log(`Creating dynamic tenant database: "${tenantDbName}"...`);

    // 4. Create the tenant database dynamically
    await db.query(`CREATE DATABASE \`${tenantDbName}\``);

    // 5. Initialize schema from init.sql in the new tenant database
    const tenantPool = getTenantPool(tenantDbName);
    const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');
    
    if (fs.existsSync(sqlPath)) {
      let sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Strip base CREATE DATABASE/USE statements or adapt them dynamically to tenantDbName
      sql = sql.replace(/CREATE DATABASE IF NOT EXISTS\s+\w+;/gi, '');
      sql = sql.replace(/USE\s+\w+;/gi, `USE \`${tenantDbName}\`;`);
      
      await tenantPool.query(sql);
      console.log(`Schema successfully loaded into tenant database "${tenantDbName}".`);
    } else {
      console.warn(`Schema initialization init.sql not found at ${sqlPath}. Schema skipped.`);
    }

    // 6. Clean default dummy accounts from new users table
    await tenantPool.query('DELETE FROM users');

    // 7. Create custom admin account inside tenant database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    await tenantPool.query(
      'INSERT INTO users (username, password, role, can_manage_products, can_manage_suppliers, can_manage_stock, can_view_reports, can_delete_items) VALUES (?, ?, "admin", 1, 1, 1, 1, 1)',
      [adminUsername.trim(), hashedPassword]
    );
    console.log(`Admin account "${adminUsername}" seeded successfully inside "${tenantDbName}".`);

    // 8. Register shop in central shops list
    await db.query(
      'INSERT INTO shops (name, db_name) VALUES (?, ?)',
      [shopName.trim(), tenantDbName]
    );
    
    // 9. Register shop admin in users_central central registry
    await db.query(
      'INSERT INTO users_central (username, db_name) VALUES (?, ?)',
      [adminUsername.trim(), tenantDbName]
    );
    console.log(`Shop "${shopName}" and admin username "${adminUsername}" successfully registered inside central database.`);

    res.status(201).json({
      message: `Shop "${shopName}" successfully registered! You can now log in.`
    });
  } catch (error) {
    console.error('registerShop error:', error);
    res.status(500).json({ message: 'Error registering new shop database' });
  }
};
