const db = require('../config/db');

exports.getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await req.db.query('SELECT * FROM suppliers ORDER BY created_at DESC');
    res.json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving suppliers' });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const [suppliers] = await req.db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (suppliers.length === 0) return res.status(404).json({ message: 'Supplier not found' });
    res.json(suppliers[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving supplier' });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { name, contact_email, contact_phone, address } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const [result] = await req.db.query(
      'INSERT INTO suppliers (name, contact_email, contact_phone, address) VALUES (?, ?, ?, ?)',
      [name, contact_email || '', contact_phone || '', address || '']
    );

    res.status(201).json({ message: 'Supplier created', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating supplier' });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { name, contact_email, contact_phone, address } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const [result] = await req.db.query(
      'UPDATE suppliers SET name = ?, contact_email = ?, contact_phone = ?, address = ? WHERE id = ?',
      [name, contact_email, contact_phone, address, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating supplier' });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const [result] = await req.db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error(error);
    // Might fail if products are referencing it and ON DELETE SET NULL is not set or restrict is on
    res.status(500).json({ message: 'Error deleting supplier' });
  }
};
