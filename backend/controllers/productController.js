const db = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT p.*, s.name as supplier_name FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id';
    let params = [];

    if (search) {
      query += ' WHERE p.name LIKE ? OR p.sku LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await req.db.query(query, params);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving products' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const [products] = await req.db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(products[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving product' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, sku, price, stock_quantity, supplier_id } = req.body;
    
    // Basic validation
    if (!name || !sku || !price) {
      return res.status(400).json({ message: 'Name, SKU, and Price are required' });
    }

    if (parseFloat(price) < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    if (supplier_id && parseInt(supplier_id, 10) < 0) {
      return res.status(400).json({ message: 'Supplier ID cannot be negative' });
    }

    if (stock_quantity && parseInt(stock_quantity, 10) < 0) {
      return res.status(400).json({ message: 'Stock quantity cannot be negative' });
    }

    const [result] = await req.db.query(
      'INSERT INTO products (name, description, sku, price, stock_quantity, supplier_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || '', sku, price, stock_quantity || 0, supplier_id || null]
    );

    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    res.status(500).json({ message: 'Error creating product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, sku, price, supplier_id } = req.body;
    
    if (!name || !sku || !price) {
      return res.status(400).json({ message: 'Name, SKU, and Price are required' });
    }

    if (parseFloat(price) < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    if (supplier_id && parseInt(supplier_id, 10) < 0) {
      return res.status(400).json({ message: 'Supplier ID cannot be negative' });
    }

    const [result] = await req.db.query(
      'UPDATE products SET name = ?, description = ?, sku = ?, price = ?, supplier_id = ? WHERE id = ?',
      [name, description, sku, price, supplier_id || null, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    res.status(500).json({ message: 'Error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const [result] = await req.db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};
