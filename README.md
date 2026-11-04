# Inventory Control System

Track products, suppliers, stock movements, and staff permissions for one or more shops. The app uses Node.js, Express, and MySQL. Express serves the HTML, CSS, and JavaScript frontend on the same address as the API.

## Run locally

1. Install Node.js and npm. The backend requires Node.js 18 or later. Start a local MySQL server. If you use XAMPP, start its **MySQL** module.
2. From the project root, install the backend dependencies.

   ```sh
   cd backend
   npm ci
   ```

3. If you do not already have a `backend/.env` file, copy `.env.example` to `.env` in the backend folder. On Windows PowerShell, use `Copy-Item .env.example .env`. On macOS or Linux, use `cp .env.example .env`. Edit the file with these settings.

   | Setting | Value |
   | --- | --- |
   | `DB_HOST` | MySQL hostname, usually `localhost`. The app uses MySQL's default port, 3306. |
   | `DB_USER` and `DB_PASSWORD` | MySQL credentials. The account needs permission to create the default database and any new shop databases, create and alter tables, and read and write application data. |
   | `DB_NAME` | Keep `inventory_db` for a fresh install. The initialization script uses this name explicitly. |
   | `PORT` | HTTP port, `3000` by default. |
   | `JWT_SECRET` | A private random string used to sign login tokens. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. |

4. From the backend folder, start the server.

   ```sh
   npm start
   ```

   On first startup, the server creates the default database, its tables, and the demo accounts. Open [http://localhost:3000](http://localhost:3000), or use the port you configured. Run `npm run server` from the same folder for automatic restarts during development.

## Sign in

| Demo username | Password | Access |
| --- | --- | --- |
| `admin` | `password123` | Full access, including staff management |
| `staff` | `password123` | Product and supplier lists, with additional actions available when granted by an admin |

Use these credentials on a fresh local install. Before sharing the instance, change the admin password using **Change Password** and reset the demo staff password under **Staff Accounts**.

To set up a separate shop, choose **Create New Shop Database** on the login page. Enter a shop name, a globally unique admin username, and a password of at least six characters. Once registration succeeds, sign in with the new account. Each registered shop has its own database, and the app finds it from the login username.

## Use the app

1. Open **Suppliers** to add vendor details, then open **Products** to create items with a unique SKU, a price, and an optional supplier.
2. In **Products**, choose **Update Stock** on an item. Add or remove a positive quantity, or adjust stock to an exact positive quantity. A removal cannot exceed the available stock.
3. Check **Dashboard** for totals, stock value, and products with 10 or fewer units. Open **Reports** to view or print the latest 100 stock movements.
4. As an admin, open **Staff Accounts** to create accounts, grant permissions for product and supplier management, stock updates, reports, and deletion, or reset staff passwords.

## Project layout

- `frontend/` contains the browser pages and shared CSS and JavaScript.
- `backend/server.js` serves the frontend and mounts the API under `/api`. Routes, controllers, and middleware live in their respective backend folders.
- `backend/config/db.js` initializes MySQL and manages database connections. Startup and new-shop registration both use `backend/db/init.sql`.
- `backend/package.json` and `backend/package-lock.json` define the dependencies and npm scripts.

The API accepts JSON. `POST /api/auth/login` and `POST /api/auth/register-shop` are public. Send the token returned by login as `Authorization: Bearer <token>` for other API calls. The main resource paths are `/api/dashboard`, `/api/products`, `/api/suppliers`, `/api/users`, `/api/inventory/update`, and `/api/inventory/logs`.

## Troubleshooting

- **Database connection refused.** Start MySQL and check that it is listening at the configured host on port 3306.
- **Database access denied.** Check the credentials and MySQL grants in `backend/.env`, then restart the app.
- **Port already in use.** Change `PORT` in `backend/.env`, restart, and open the new address.
