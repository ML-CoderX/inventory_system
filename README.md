# Inventory Control System

A complete, full-stack, multi-tenant Inventory Control System designed for small shops and retail businesses. This application allows multiple shop owners to register their businesses, isolates their data dynamically into separate tenant databases, tracks products and suppliers, manages stock levels, logs inventory changes automatically, and features granular Role-Based Access Control (RBAC) for staff members.

Built strictly with vanilla technologies (HTML, CSS, JavaScript, Node.js, Express, and MySQL) without the use of heavy frontend frameworks.

## Features

- **Multi-Tenant Shop Isolation:** Shop owners can register new shops dynamically. The backend creates a separate dedicated database (`shop_<name>`) for each registered tenant to ensure complete data security and isolation.
- **Dynamic Routing & Tenant Resolution:** Requests are dynamically routed to the correct database context based on the logged-in user or shop lookup.
- **Granular Role-Based Access Control (RBAC):** Define custom permissions for staff members. Administrators have full access and can manage staff accounts, while staff users are restricted based on permissions assigned to them.
- **Staff Management Panel:** Dedicated administration panel (`staff.html`) to create staff accounts, update granular permissions, reset passwords, and delete accounts.
- **Interactive Dashboard:** Real-time summary statistics including total products, supplier count, total stock value, and instant alerts for low-stock items.
- **Product Management:** Full CRUD (Create, Read, Update, Delete) operations with search and filter functionality.
- **Supplier Management:** Track and manage product supplier details.
- **Inventory Stock Tracking:** Adjust stock levels directly (Add, Remove, or Adjust) with validation preventing negative stock counts.
- **Automated Logging:** Every inventory change is automatically logged with the user ID, action type, quantity, and timestamps for accountability.
- **Responsive UI:** Premium dark-themed UI built using a strict 8px grid system, modern CSS variables, and accessibility in mind (reduced-motion friendly).

---

## Database Schema & Tables

The system uses a central database to orchestrate tenants and routing, alongside isolated tenant-specific databases to host individual shop data.

### Central Tables (Global Orchestration)
These tables reside in the central database (configured via `DB_NAME`, default: `inventory_db`) and manage shop registrations and login lookups.

#### 1. `shops`
Tracks all registered shops and their corresponding database names.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique identifier for each shop. |
| `name` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` | The readable name of the shop. |
| `db_name` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` | The dynamically generated database name for the tenant. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | The timestamp when the shop was registered. |

#### 2. `users_central`
Maps usernames globally to their respective tenant databases to handle routing during authentication.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `username` | `VARCHAR(50)` | `PRIMARY KEY` | Globally unique username used for logging in. |
| `db_name` | `VARCHAR(100)` | `NOT NULL` | The target tenant database where the user's detailed profile is stored. |

---

### Tenant-Specific Tables (Isolated per Shop)
Each shop has a dedicated database named `shop_<sanitized_name>` which contains the following tables:

#### 1. `users`
Contains admin and staff accounts with granular permission flags.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique user ID. |
| `username` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | Local login username. |
| `password` | `VARCHAR(255)` | `NOT NULL` | Bcrypt-hashed password. |
| `role` | `ENUM('admin', 'staff')` | `DEFAULT 'staff'` | User role defining access level. |
| `can_manage_products` | `TINYINT(1)` / `BOOLEAN` | `DEFAULT 0` | Permission to Create, Read, and Update products. |
| `can_manage_suppliers` | `TINYINT(1)` / `BOOLEAN` | `DEFAULT 0` | Permission to Create, Read, and Update suppliers. |
| `can_manage_stock` | `TINYINT(1)` / `BOOLEAN` | `DEFAULT 0` | Permission to adjust inventory stock levels. |
| `can_view_reports` | `TINYINT(1)` / `BOOLEAN` | `DEFAULT 0` | Permission to view system-wide inventory audit logs. |
| `can_delete_items` | `TINYINT(1)` / `BOOLEAN` | `DEFAULT 0` | Permission to delete products and suppliers. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Date and time when user was created. |

#### 2. `suppliers`
Stores details of vendors supplying inventory products.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique supplier ID. |
| `name` | `VARCHAR(100)` | `NOT NULL` | Name of the supplier. |
| `contact_email` | `VARCHAR(100)` | - | Email address for contact. |
| `contact_phone` | `VARCHAR(20)` | - | Phone number for contact. |
| `address` | `TEXT` | - | Physical address of the supplier. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of registration. |

#### 3. `products`
Stores inventory products, including pricing and stock levels.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique product ID. |
| `name` | `VARCHAR(100)` | `NOT NULL` | Product name. |
| `description` | `TEXT` | - | Detailed description of the product. |
| `sku` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | Stock Keeping Unit (Unique identifier code). |
| `price` | `DECIMAL(10, 2)` | `NOT NULL` | Price per unit (cannot be negative). |
| `stock_quantity` | `INT` | `DEFAULT 0`, `NOT NULL` | Current stock count on hand. |
| `supplier_id` | `INT` | `FOREIGN KEY`, `ON DELETE SET NULL` | Reference to `suppliers.id`. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Date and time added to database. |

#### 4. `inventory_logs`
Automated ledger tracking stock adjustments for audit trails.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique transaction ID. |
| `product_id` | `INT` | `FOREIGN KEY`, `ON DELETE CASCADE` | Reference to `products.id`. |
| `action` | `ENUM('added', 'removed', 'adjusted')` | `NOT NULL` | Type of stock transaction. |
| `quantity` | `INT` | `NOT NULL` | Quantity added, removed, or absolute stock set. |
| `user_id` | `INT` | `FOREIGN KEY`, `ON DELETE SET NULL` | Reference to `users.id` tracking who performed it. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of the action. |

---

## Technology Stack

- **Frontend:** HTML5 (Semantic elements), CSS3 (Vanilla, HSL CSS variables, transitions), JavaScript (Vanilla ES6+)
- **Backend:** Node.js, Express.js, JWT (JsonWebTokens), Bcrypt
- **Database:** MySQL (Supports dynamic multi-connection pools)

---

## Project Structure

```
/
├── backend/                  # Express API Server
│   ├── config/               # Database connection and pool config
│   ├── controllers/          # Business logic controllers (auth, user/staff, products, etc.)
│   ├── db/                   # Database schemas (init.sql)
│   ├── middleware/           # JWT authentication, role check, and dynamic tenant context middlewares
│   ├── routes/               # API Router endpoints definitions
│   ├── .env                  # Environment configuration variables
│   ├── package.json          # Node dependencies and scripts
│   └── server.js             # Main server bootstrap
│
├── frontend/                 # Static Frontend UI
│   ├── css/
│   │   └── style.css         # Styling system (variables, custom components, 8px grid)
│   ├── js/
│   │   ├── api.js            # Unified API fetch interface wrappers
│   │   └── main.js           # Shared view controllers, auth validation, dynamic UI elements
│   ├── index.html            # Sign-In screen & Shop Database registration modal
│   ├── dashboard.html        # Central metrics dashboard & stock alerts
│   ├── products.html         # Product CRUD and search panel
│   ├── suppliers.html        # Vendor/Supplier management interface
│   ├── staff.html            # Staff permissions control panel (Admin-only)
│   └── reports.html          # Dynamic transaction log table & search filter
└── README.md                 # System documentation
```

---

## Setup & Installation

### 1. Database Setup
1. Open XAMPP and start the **MySQL** module (or launch MySQL Workbench).
2. Open your preferred database manager (e.g. phpMyAdmin at `http://localhost/phpmyadmin`).
3. Import the database initialization script to build the central schemas and seed the default database structure:
   - File location: `backend/db/init.sql`
   - This creates the `inventory_db` database and seeds default users.
   - Any new shops registered on the front page will create their own tables automatically.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environmental credentials:
   - Check the `backend/.env` file.
   - Adjust `DB_USER`, `DB_PASSWORD`, and `DB_HOST` to match your local database settings.
4. Launch the application:
   ```bash
   npm start
   ```
   *The server runs locally at `http://localhost:3000` and will try to automatically open your default browser.*

### 3. Frontend Setup
1. Since the client-side uses modern vanilla code, no compilation or build steps are necessary!
2. Simply navigate to `http://localhost:3000` (served by the Express backend).

---

## Default Credentials

For testing and initial logins, use the default records pre-populated in `init.sql`:

- **Admin Account:**
  - Username: `admin`
  - Password: `password123`
- **Staff Account:**
  - Username: `staff`
  - Password: `password123`

---

## API Endpoints Overview

All routes require authentication via a Bearer token in the `Authorization` header, except for public authentication endpoints.

### Authentication & Tenants
- `POST /api/auth/register-shop` - Register a new tenant shop database and seed its administrator account.
- `POST /api/auth/login` - Authenticate username, resolve tenant, and return signed JWT.
- `GET /api/auth/me` - Retrieve current logged-in user profile & permissions.
- `POST /api/auth/change-password` - Updates the current user's password.

### Staff / User Management (Admin Only)
- `GET /api/users` - Fetch all staff accounts under the tenant.
- `POST /api/users` - Register a new staff account with customized privileges.
- `PUT /api/users/:id` - Update the granular permission flags of a staff member.
- `PUT /api/users/:id/password` - Update a staff member's password.
- `DELETE /api/users/:id` - Permanently delete a staff account.

### Dashboard Stats
- `GET /api/dashboard` - Get summarized totals and lists of low-stock alert products.

### Product Management
- `GET /api/products` - List products (supports `?search=` query parameter).
- `GET /api/products/:id` - Fetch single product specifications.
- `POST /api/products` - Insert a new product (*Requires `can_manage_products`*).
- `PUT /api/products/:id` - Update details of a product (*Requires `can_manage_products`*).
- `DELETE /api/products/:id` - Permanently remove a product (*Requires `can_delete_items`*).

### Supplier Management
- `GET /api/suppliers` - List all active suppliers.
- `GET /api/suppliers/:id` - Retrieve detailed information for a single supplier.
- `POST /api/suppliers` - Register a new supplier (*Requires `can_manage_suppliers`*).
- `PUT /api/suppliers/:id` - Update a supplier's contact data (*Requires `can_manage_suppliers`*).
- `DELETE /api/suppliers/:id` - Delete a supplier record (*Requires `can_delete_items`*).

### Stock Management & Auditing
- `POST /api/inventory/update` - Adjust stock quantities (`added`, `removed`, `adjusted`) (*Requires `can_manage_stock`*).
- `GET /api/inventory/logs` - Retrieve the system-wide transaction history logs (*Requires `can_view_reports`*).

---
*Built as a high-performance, lightweight, multi-tenant inventory solution.*
