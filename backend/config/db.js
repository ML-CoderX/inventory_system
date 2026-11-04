const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'inventory_db';

const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

async function initializeDatabase() {
  try {
    // 1. Connect without database parameter to create it if it doesn't exist
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.end();
    console.log(`Database "${dbName}" checked/created successfully.`);

    // 1.5 Create shops central registration table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        db_name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Default Shop if empty
    const [existingShops] = await pool.query('SELECT * FROM shops WHERE db_name = ?', [dbName]);
    if (existingShops.length === 0) {
      await pool.query('INSERT INTO shops (name, db_name) VALUES (?, ?)', ['Default Shop', dbName]);
      console.log('Seeded Default Shop into central database.');
    }

    // 1.6 Create central users table mapping usernames to tenant databases
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users_central (
        username VARCHAR(50) PRIMARY KEY,
        db_name VARCHAR(100) NOT NULL
      )
    `);

    // Seed Default admin and staff if not present in users_central
    const [existingDefaultAdmin] = await pool.query('SELECT * FROM users_central WHERE username = ?', ['admin']);
    if (existingDefaultAdmin.length === 0) {
      await pool.query('INSERT INTO users_central (username, db_name) VALUES (?, ?)', ['admin', dbName]);
      console.log('Seeded default admin into users_central.');
    }
    const [existingDefaultStaff] = await pool.query('SELECT * FROM users_central WHERE username = ?', ['staff']);
    if (existingDefaultStaff.length === 0) {
      await pool.query('INSERT INTO users_central (username, db_name) VALUES (?, ?)', ['staff', dbName]);
      console.log('Seeded default staff into users_central.');
    }

    // 2. Check if the 'users' table exists using the pool
    const [tables] = await pool.query(`SHOW TABLES LIKE 'users'`);
    if (tables.length === 0) {
      console.log('Database tables not found. Initializing database schema from init.sql...');
      const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');
      
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log('Database schema and dummy data initialized successfully.');
      } else {
        console.warn(`init.sql file not found at ${sqlPath}. Please initialize manually.`);
      }
    } else {
      console.log('Database tables already exist. Skipping schema initialization.');
    }

    // 3. Migrate database to add permission columns to the 'users' table if they are missing
    console.log('Checking database table schemas for permission columns...');
    const [columns] = await pool.query(`SHOW COLUMNS FROM users`);
    const columnNames = columns.map(c => c.Field);
    
    if (!columnNames.includes('can_manage_products')) {
      console.log('Adding column "can_manage_products" to "users" table...');
      await pool.query(`ALTER TABLE users ADD COLUMN can_manage_products TINYINT(1) DEFAULT 0`);
    }
    if (!columnNames.includes('can_manage_suppliers')) {
      console.log('Adding column "can_manage_suppliers" to "users" table...');
      await pool.query(`ALTER TABLE users ADD COLUMN can_manage_suppliers TINYINT(1) DEFAULT 0`);
    }
    if (!columnNames.includes('can_manage_stock')) {
      console.log('Adding column "can_manage_stock" to "users" table...');
      await pool.query(`ALTER TABLE users ADD COLUMN can_manage_stock TINYINT(1) DEFAULT 0`);
    }
    if (!columnNames.includes('can_view_reports')) {
      console.log('Adding column "can_view_reports" to "users" table...');
      await pool.query(`ALTER TABLE users ADD COLUMN can_view_reports TINYINT(1) DEFAULT 0`);
    }
    if (!columnNames.includes('can_delete_items')) {
      console.log('Adding column "can_delete_items" to "users" table...');
      await pool.query(`ALTER TABLE users ADD COLUMN can_delete_items TINYINT(1) DEFAULT 0`);
    }

    // Automatically grant all permissions to the admin user
    await pool.query(`
      UPDATE users 
      SET can_manage_products = 1, can_manage_suppliers = 1, can_manage_stock = 1, can_view_reports = 1, can_delete_items = 1 
      WHERE role = 'admin'
    `);
    console.log('Admin account permissions verified and granted successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Tenant Pool cache
const tenantPools = {};

// Default pool acts as central pool
tenantPools[dbName] = pool;

function getTenantPool(tenantDbName) {
  if (!tenantDbName) return pool;
  
  if (!tenantPools[tenantDbName]) {
    console.log(`Creating dynamic database pool for tenant: "${tenantDbName}"`);
    tenantPools[tenantDbName] = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: tenantDbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });
  }
  return tenantPools[tenantDbName];
}

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
module.exports.getTenantPool = getTenantPool;

