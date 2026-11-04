-- Initialize Database Schema
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') DEFAULT 'staff',
  can_manage_products TINYINT(1) DEFAULT 0,
  can_manage_suppliers TINYINT(1) DEFAULT 0,
  can_manage_stock TINYINT(1) DEFAULT 0,
  can_view_reports TINYINT(1) DEFAULT 0,
  can_delete_items TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sku VARCHAR(50) UNIQUE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  supplier_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- 4. Inventory Logs Table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  action ENUM('added', 'removed', 'adjusted') NOT NULL,
  quantity INT NOT NULL,
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Dummy Data for Users (Password is 'password123' hashed using bcrypt 10 rounds)
INSERT INTO users (username, password, role, can_manage_products, can_manage_suppliers, can_manage_stock, can_view_reports, can_delete_items) VALUES 
('admin', '$2b$10$aG/R6CijA/RMMLxapW9NeOfJTXaUJZD5tIeJOlinLFNTzJAqvpCn.', 'admin', 1, 1, 1, 1, 1),
('staff', '$2b$10$aG/R6CijA/RMMLxapW9NeOfJTXaUJZD5tIeJOlinLFNTzJAqvpCn.', 'staff', 0, 0, 0, 0, 0)
ON DUPLICATE KEY UPDATE username=username;
