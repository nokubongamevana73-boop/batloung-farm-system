

USE batloung_farm_db;

-- Insert Suppliers across South African provinces
INSERT INTO suppliers (business_name, contact_person, phone, province, address)

-- Insert Fruits
INSERT INTO fruits (fruit_name, description, status)

--  Initialize Stock records for all 5 fruits across all 3 packaging sizes 
INSERT INTO stock (fruit_id, packaging_size, available_quantity)

-- Insert Sample Purchases (Bulk stock intake from SA suppliers)
INSERT INTO purchases (purchase_id, supplier_id, purchase_date, total_amount)
-- Purchase Details
INSERT INTO purchase_details (purchase_id, fruit_id, quantity, unit_cost, packaging_size)


-- Insert Sample Sales to Lesotho Vendors
-- Demonstrating payment statuses: PAID, PARTIALLY_PAID, UNPAID
-- Payment methods: Cash, Mobile Money, Credit
INSERT INTO sales (sale_id, vendor_id, sale_date, payment_status, total_amount, payment_method, amount_paid)

-- Sales Details
-- Small, medium, large packaging sizes with selling prices
INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price)

