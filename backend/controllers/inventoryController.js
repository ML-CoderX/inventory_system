const db = require('../config/db');

exports.updateStock = async (req, res) => {
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();
    const { product_id, action, quantity } = req.body;
    const user_id = req.user.id; // from auth middleware

    if (!product_id || !action || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid product_id, action (added/removed/adjusted), and quantity > 0 are required' });
    }

    // Get current product stock
    const [products] = await connection.query('SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE', [product_id]);
    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    let newStock = products[0].stock_quantity;
    if (action === 'added') {
      newStock += quantity;
    } else if (action === 'removed') {
      if (newStock < quantity) {
        await connection.rollback();
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      newStock -= quantity;
    } else if (action === 'adjusted') {
      // quantity acts as the new absolute value
      newStock = quantity;
    } else {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid action' });
    }

    // Update product stock
    await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, product_id]);

    // Insert log
    await connection.query(
      'INSERT INTO inventory_logs (product_id, action, quantity, user_id) VALUES (?, ?, ?, ?)',
      [product_id, action, quantity, user_id]
    );

    await connection.commit();
    res.json({ message: 'Stock updated successfully', newStock });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error updating stock' });
  } finally {
    connection.release();
  }
};

exports.getLogs = async (req, res) => {
  try {
    const query = `
      SELECT il.*, p.name as product_name, p.sku as product_sku, u.username 
      FROM inventory_logs il
      JOIN products p ON il.product_id = p.id
      LEFT JOIN users u ON il.user_id = u.id
      ORDER BY il.created_at DESC
      LIMIT 100
    `;
    const [logs] = await req.db.query(query);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving inventory logs' });
  }
};
