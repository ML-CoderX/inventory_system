const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    // Total Products
    const [productsCount] = await req.db.query('SELECT COUNT(*) as count FROM products');
    
    // Total Suppliers
    const [suppliersCount] = await req.db.query('SELECT COUNT(*) as count FROM suppliers');
    
    // Total Stock Value
    const [stockValue] = await req.db.query('SELECT SUM(price * stock_quantity) as totalValue FROM products');
    
    // Low Stock Alerts (threshold: 10)
    const [lowStockProducts] = await req.db.query('SELECT id, name, stock_quantity FROM products WHERE stock_quantity <= 10');

    res.json({
      totalProducts: productsCount[0].count,
      totalSuppliers: suppliersCount[0].count,
      totalStockValue: stockValue[0].totalValue || 0,
      lowStockAlertsCount: lowStockProducts.length,
      lowStockProducts
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error retrieving dashboard stats' });
  }
};
