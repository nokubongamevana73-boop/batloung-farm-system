CREATE DATABASE IF NOT EXISTS batloung_farm_db;
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE batloung_farm_db;

-- Drop tables if they already exist (in reverse dependency order)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS sales_details;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS purchase_details;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS fruits;
DROP TABLE IF EXISTS suppliers;
SET FOREIGN_KEY_CHECKS = 1;

-- Table 1: Suppliers
-- Suppliers across South African provinces
CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    province VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_supplier_province CHECK (
        province IN (
            'Gauteng', 
            'Free State', 
            'KwaZulu-Natal', 
            'Western Cape', 
            'Eastern Cape', 
            'Limpopo', 
            'Mpumalanga', 
            'North West'
        )
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: Fruits
-- Apples, bananas, oranges, mangoes, grapes
CREATE TABLE fruits (
    fruit_id INT AUTO_INCREMENT PRIMARY KEY,
    fruit_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fruit_status CHECK (
        status IN ('Available', 'Out of Stock', 'Discontinued')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: Vendors
-- Street vendors and small retailers in Lesotho
CREATE TABLE vendors (
    vendor_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30) NOT NULL UNIQUE,
    location VARCHAR(100) NOT NULL,
    registration_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: Purchases
-- Records bulk purchases from South African suppliers
CREATE TABLE purchases (
    purchase_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id) 
        REFERENCES suppliers(supplier_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_purchase_total CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Table 5: Purchase details
-- Line items for each purchase, distinguishing packaging sizes
CREATE TABLE purchase_details (
    purchase_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    fruit_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    packaging_size VARCHAR(10) NOT NULL,
    CONSTRAINT fk_pd_purchase FOREIGN KEY (purchase_id) 
        REFERENCES purchases(purchase_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_pd_fruit FOREIGN KEY (fruit_id) 
        REFERENCES fruits(fruit_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_pd_packaging_size CHECK (packaging_size IN ('small', 'medium', 'large')),
    CONSTRAINT chk_pd_quantity CHECK (quantity > 0),
    CONSTRAINT chk_pd_unit_cost CHECK (unit_cost >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 6: Sales
-- Distribution sales to Lesotho vendors with payment tracking
CREATE TABLE sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'Cash',
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors(vendor_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_sale_payment_status CHECK (
        payment_status IN ('PAID', 'PARTIALLY_PAID', 'UNPAID')
    ),
    CONSTRAINT chk_sale_payment_method CHECK (
        payment_method IN ('Cash', 'Mobile Money', 'Credit')
    ),
    CONSTRAINT chk_sale_total CHECK (total_amount >= 0),
    CONSTRAINT chk_sale_amount_paid CHECK (amount_paid >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 7: Sales details
-- Line items for each sale with packaging size and unit price
CREATE TABLE sales_details (
    sales_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    fruit_id INT NOT NULL,
    packaging_size VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_sd_sale FOREIGN KEY (sale_id) 
        REFERENCES sales(sale_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_sd_fruit FOREIGN KEY (fruit_id) 
        REFERENCES fruits(fruit_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_sd_packaging_size CHECK (packaging_size IN ('small', 'medium', 'large')),
    CONSTRAINT chk_sd_quantity CHECK (quantity > 0),
    CONSTRAINT chk_sd_unit_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Table 8: Stock
-- Tracks available quantity separately for small, medium, and large
CREATE TABLE stock (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    fruit_id INT NOT NULL,
    packaging_size VARCHAR(10) NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_fruit FOREIGN KEY (fruit_id) 
        REFERENCES fruits(fruit_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT uq_fruit_packaging_size UNIQUE (fruit_id, packaging_size),
    CONSTRAINT chk_stock_packaging_size CHECK (packaging_size IN ('small', 'medium', 'large')),
    CONSTRAINT chk_stock_available_qty CHECK (available_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance and reporting queries
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_vendor ON sales(vendor_id);
CREATE INDEX idx_stock_fruit ON stock(fruit_id);
CREATE INDEX idx_sd_fruit ON sales_details(fruit_id);
