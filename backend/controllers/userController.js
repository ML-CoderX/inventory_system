const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getAllStaff = async (req, res) => {
  try {
    const [users] = await req.db.query(
      'SELECT id, username, role, can_manage_products, can_manage_suppliers, can_manage_stock, can_view_reports, can_delete_items, created_at FROM users WHERE role = "staff" ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving staff list' });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { username, password, can_manage_products, can_manage_suppliers, can_manage_stock, can_view_reports, can_delete_items } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (username.toLowerCase() === 'admin') {
      return res.status(400).json({ message: 'Cannot create another user named admin' });
    }

    // 1. Check if username already exists in central users registry
    const [existingCentralUser] = await db.query(
      'SELECT * FROM users_central WHERE username = ?',
      [username.trim()]
    );
    if (existingCentralUser.length > 0) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Get current tenant DB name
    const [dbRow] = await req.db.query('SELECT DATABASE() as dbName');
    const tenantDbName = dbRow[0].dbName;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await req.db.query(
      'INSERT INTO users (username, password, role, can_manage_products, can_manage_suppliers, can_manage_stock, can_view_reports, can_delete_items) VALUES (?, ?, "staff", ?, ?, ?, ?, ?)',
      [
        username.trim(),
        hashedPassword,
        can_manage_products ? 1 : 0,
        can_manage_suppliers ? 1 : 0,
        can_manage_stock ? 1 : 0,
        can_view_reports ? 1 : 0,
        can_delete_items ? 1 : 0
      ]
    );

    // Register user in central registry
    await db.query(
      'INSERT INTO users_central (username, db_name) VALUES (?, ?)',
      [username.trim(), tenantDbName]
    );

    res.status(201).json({
      message: 'Staff account created successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Error creating staff account' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { can_manage_products, can_manage_suppliers, can_manage_stock, can_view_reports, can_delete_items } = req.body;
    const { id } = req.params;

    // Check if user exists and is staff
    const [users] = await req.db.query('SELECT role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (users[0].role === 'admin') {
      return res.status(403).json({ message: 'Admin account permissions cannot be modified via staff page' });
    }

    await req.db.query(
      'UPDATE users SET can_manage_products = ?, can_manage_suppliers = ?, can_manage_stock = ?, can_view_reports = ?, can_delete_items = ? WHERE id = ?',
      [
        can_manage_products ? 1 : 0,
        can_manage_suppliers ? 1 : 0,
        can_manage_stock ? 1 : 0,
        can_view_reports ? 1 : 0,
        can_delete_items ? 1 : 0,
        id
      ]
    );

    res.json({ message: 'Staff permissions updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating staff permissions' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is staff
    const [users] = await req.db.query('SELECT username, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { username, role } = users[0];
    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin account cannot be deleted' });
    }

    await req.db.query('DELETE FROM users WHERE id = ?', [id]);
    
    // Delete from central registry
    await db.query('DELETE FROM users_central WHERE username = ?', [username]);

    res.json({ message: 'Staff account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting staff account' });
  }
};

exports.changeStaffPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.params;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user exists and is staff
    const [users] = await req.db.query('SELECT role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (users[0].role === 'admin') {
      return res.status(403).json({ message: 'Admin account password cannot be modified here' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await req.db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({ message: 'Staff password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating staff password' });
  }
};
