# Batloung Farm Fresh Produce Distribution Management System

##  Executive Summary & Business Background

**Batloung Farm** is a fresh produce distribution company based in **Maseru, Lesotho**. The enterprise sources quality fruits (Apples, Bananas, Oranges, Mangoes, and Grapes) in bulk from commercial agricultural suppliers across South African provinces (Free State, Gauteng, Western Cape, KwaZulu-Natal, Limpopo, Mpumalanga, Eastern Cape, and North West) and distributes them to local street vendors and retail grocers across Lesotho.

Prior to this system, Batloung Farm managed its inventory, purchasing, and vendor credit using spreadsheets and notebooks, resulting in:
- Stock tracking inconsistencies across different box packaging sizes.
- Frequent manual calculation errors on bulk orders and deliveries.
- Difficulty monitoring vendor credit balances and payment statuses.
- Unmonitored stock movements during purchases and sales.

This web-based **Fresh Produce Distribution Management System** provides an end-to-end automated platform featuring a **MySQL relational database**, a **Node.js & Express.js REST API**, and a modern **Web Dashboard**.

---


| Part | Assessment Criterion | Marks | System Implementation |
| :--- | :--- | :---: | :--- |
| **Part A** | Database Creation | **1** | `batloung_farm_db` created with UTF8MB4 charset and utf8mb4_unicode_ci collation. |
| **Part A** | Table Creation | **2** | All 8 required tables created: `suppliers`, `fruits`, `vendors`, `purchases`, `purchase_details`, `sales`, `sales_details`, `stock`. |
| **Part A** | Primary & Foreign Keys | **2** | Auto-increment primary keys on all tables; referential integrity constraints with `ON UPDATE CASCADE` and `ON DELETE RESTRICT/CASCADE`. |
| **Part A** | Database Constraints | **2** | `NOT NULL`, `UNIQUE`, `CHECK` constraints on packaging sizes, SA provinces, payment methods, payment status, and non-negative stock. |
| **Part A** | Sample Data | **2** | Realistic records for SA suppliers, Maseru street vendors, fruits, historical purchases, and distribution sales. |
| **Part A** | Packaging-Specific Stock | **1** | `stock` table uniquely tracks stock per `(fruit_id, packaging_size)` for **small**, **medium**, and **large** boxes. |
| **Part B** | Project Initialisation | **1** | Node.js configured with `express`, `mysql2`, `dotenv`, and `cors`. |
| **Part B** | Project Structure | **2** | Clean architecture: `config/`, `controllers/`, `models/`, `routes/`, `middleware/`, `database/`, `public/`. |
| **Part B** | MySQL Connection | **2** | `mysql2/promise` connection pool with graceful connection verification on startup (app never terminates unexpectedly). |
| **Part B** | Environment Variables | **1** | `.env` file for credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`). No hardcoded secrets. |
| **Part B** | Asynchronous Programming | **2** | 100% `async/await` and robust `try/catch` error handling across all controllers and database layers. |
| **Part C** | Supplier API | **2** | Full CRUD endpoints; deletion prevented if supplier is referenced by existing purchase records. |
| **Part C** | Fruit and Stock API | **3** | Fruit CRUD, stock quantities separated by packaging size, and dynamic low-stock queries. |
| **Part C** | Vendor API | **2** | Vendor registration, listing, search by name/phone/location, and profile updates. |
| **Part C** | Purchase API | **2** | Records multi-item supplier shipments, calculates totals automatically, and increments stock per packaging size. |
| **Part C** | Sales API | **3** | Multi-item vendor orders, automatic pricing, stock availability check, and automatic stock decrement. |
| **Part C** | Validation & Error Handling | **2** | Proper HTTP status codes: `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500/503 Error`. |
| **Part D** | Sales Calculations | **2** | Server-side total calculation: `Σ(quantity × unit_price)`. Administrator never enters totals manually. |
| **Part D** | Stock Management Logic | **2** | Purchases increment stock; sales decrement stock; negative stock is strictly prevented at DB & API levels. |
| **Part D** | SQL Reporting Queries | **2** | All 4 required reporting queries implemented: Top 5 fruits, revenue by date range, top vendor by boxes, current stock matrix. |
| **Part D** | Database Transactions | **2** | Explicit MySQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) guaranteeing atomic operations on multi-item orders. |
| **Part D** | Payment Management | **2** | Supports **Cash**, **Mobile Money** (M-Pesa/EcoCash), **Credit**; statuses `PAID`, `PARTIALLY_PAID`, `UNPAID`; displays outstanding vendor balances. |
| **TOTAL** | **All Sections** | **42** | **100% Complete** |


### Critical Packaging-Specific Design
Stock is not stored simply as total fruit count. Instead, the `stock` table uses a composite unique constraint `(fruit_id, packaging_size)`:
```sql
CREATE TABLE stock (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    fruit_id INT NOT NULL,
    packaging_size VARCHAR(10) NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_fruit_packaging_size UNIQUE (fruit_id, packaging_size),
    CONSTRAINT chk_stock_packaging_size CHECK (packaging_size IN ('small', 'medium', 'large')),
    CONSTRAINT chk_stock_available_qty CHECK (available_quantity >= 0)
);
```

---

##  Setup & Installation Instructions

### 1. Prerequisites
- **Node.js** (v18.x, v20.x, or v24.x)
- **MySQL Server** (v8.0 or MariaDB) running locally on port 3306

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=3000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=batloung_farm_db

# Business Thresholds
LOW_STOCK_THRESHOLD=15
```

### 3. Initialize MySQL Database & Seed Realistic Sample Data
Run the automated database setup script:
```bash
npm run setup-db
```
This executes `database/schema.sql` (creating `batloung_farm_db`, all 8 tables, and constraints) followed by `database/sample_data.sql` (seeding South African suppliers, Maseru vendors, and initial stock).

### 4. Start the Application
For production / normal run:
```bash
npm start
```
For development with auto-reload:
```bash
npm run dev
```

### 5. Access the Web Application
You can run the application with either frontend:
- **React Frontend (Vite on `http://localhost:5173`):**
  ```bash
  npm run client
  ```
  *(Features a modern React 18 SPA with Lucide icons, live state, and Vite hot module replacement).*
- **Express Built-in Dashboard (`http://localhost:3000`):**
  Directly served from the Express server.

---

##  REST API Endpoint Documentation

### 1. Supplier Management (`/api/suppliers`)
- `GET /api/suppliers` — Retrieve all suppliers sorted by business name.
- `GET /api/suppliers/:id` — Retrieve single supplier by ID.
- `POST /api/suppliers` — Register a new South African supplier.
  - Body: `{ business_name, contact_person, phone, province, address }`
- `PUT /api/suppliers/:id` — Update supplier details.
- `DELETE /api/suppliers/:id` — Delete supplier (blocked with `400 Bad Request` if purchase records exist).

### 2. Fruit & Stock Management (`/api/fruits`, `/api/stock`)
- `GET /api/fruits` — Retrieve all fruits.
- `GET /api/fruits/:id` — Retrieve fruit details.
- `POST /api/fruits` — Register new fruit (automatically initializes 0-quantity stock records for Small, Medium, and Large packaging).
- `PUT /api/fruits/:id` — Update fruit information.
- `GET /api/stock` — View stock levels separated by packaging size for all fruits.
- `GET /api/stock/low-stock?threshold=15` — List stock items with quantities at or below threshold.

### 3. Vendor Management (`/api/vendors`)
- `GET /api/vendors` — List all registered vendors.
- `GET /api/vendors/:id` — Get vendor profile by ID.
- `GET /api/vendors/search?q=Maseru` — Search vendors by name, phone number, or location.
- `POST /api/vendors` — Register a new vendor.
  - Body: `{ vendor_name, phone_number, location, registration_date }`
- `PUT /api/vendors/:id` — Update vendor details.
- `GET /api/vendors/balances` — Retrieve all vendors with total invoiced, total paid, and outstanding credit balances.
- `GET /api/vendors/:id/balance` — Outstanding balance for an individual vendor.

### 4. Purchase Management (`/api/purchases`)
- `POST /api/purchases` — Record shipment from a supplier (Stock In).
  - Body:
    ```json
    {
      "supplier_id": 1,
      "items": [
        {
          "fruit_id": 1,
          "packaging_size": "medium",
          "quantity": 25,
          "unit_cost": 80.00
        }
      ]
    }
    ```
  - **Behavior:** Calculates total cost automatically (`25 × M80.00 = M2,000.00`), inserts purchase and details within a transaction, and increments available stock.

### 5. Sales Management (`/api/sales`)
- `POST /api/sales` — Record sale to a vendor (Stock Out).
  - Body:
    ```json
    {
      "vendor_id": 1,
      "payment_method": "Cash",
      "amount_paid": 400.00,
      "items": [
        {
          "fruit_id": 1,
          "packaging_size": "large",
          "quantity": 5,
          "unit_price": 160.00
        }
      ]
    }
    ```
  - **Critical Out-of-Stock Rule:** If requested quantity exceeds available stock (e.g., requested 10 large boxes of apples when only 6 are available), the transaction immediately rolls back and returns:
    ```json
    {
      "success": false,
      "status": 400,
      "error": "Sale rejected: Insufficient stock for Apples (large packaging). Requested: 10 boxes, but only 6 boxes available."
    }
    ```
- `POST /api/sales/:id/payments` — Record payment against an outstanding balance (updates `amount_paid` and changes status to `PAID` or `PARTIALLY_PAID`).

### 6. Part D: Required SQL Reporting Queries (`/api/reports`)
1. **Query 1:** `GET /api/reports/top-fruits` — Five most frequently sold fruits.
2. **Query 2:** `GET /api/reports/revenue?startDate=2026-10-01&endDate=2026-11-30` — Total revenue and credit breakdown for date range.
3. **Query 3:** `GET /api/reports/top-vendor` — Vendor with highest number of boxes purchased.
4. **Query 4:** `GET /api/reports/stock-levels` — Current stock levels for each fruit and packaging size.
5. **Dashboard:** `GET /api/reports/dashboard` — High-level KPI summary cards.

---
search by name and phone number.
5. Sourcing purchase with automatic total calculation and stock increment.
6. **Mandatory out-of-stock scenario** (10 requested vs 6 available -> 400 Bad Request, stock unchanged).
7. Sale completion with stock deduction and payment status logic (`PAID`, `PARTIALLY_PAID`, `UNPAID`).
8. Execution of all 4 SQL reporting queries.

---
