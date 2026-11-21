
-- Batloung Farm Distribution System - Analytics & SQL Reports
-- Inventory, Revenue, and Distribution Queries


USE batloung_farm_db;


-- Query 1: The five most frequently sold fruits
-- Rationale: Sums total quantity of boxes sold per fruit across
-- all packaging sizes, sorted descending, top 5.

SELECT 
    f.fruit_id,
    f.fruit_name,
    f.description,
    SUM(sd.quantity) AS total_boxes_sold,
    COUNT(DISTINCT sd.sale_id) AS total_orders_count,
    ROUND(SUM(sd.quantity * sd.unit_price), 2) AS total_revenue_generated
FROM fruits f
JOIN sales_details sd ON f.fruit_id = sd.fruit_id
GROUP BY f.fruit_id, f.fruit_name, f.description
ORDER BY total_boxes_sold DESC
LIMIT 5;

-- Query 2: The total sales revenue generated during a specified date range
-- Parameter placeholder: startDate and endDate 

SELECT 
    COUNT(sale_id) AS total_sales_transactions,
    COALESCE(SUM(total_amount), 0.00) AS total_sales_revenue,
    COALESCE(SUM(amount_paid), 0.00) AS total_cash_collected,
    COALESCE(SUM(total_amount - amount_paid), 0.00) AS total_outstanding_credit
FROM sales
WHERE DATE(sale_date) BETWEEN '2026-10-01' AND '2026-11-30';


-- Query 3: The vendor who has purchased the highest number of boxes
-- Rationale: Joins vendors, sales, and sales_details to calculate
-- total boxes purchased per vendor, returns top 1.

SELECT 
    v.vendor_id,
    v.vendor_name,
    v.phone_number,
    v.location,
    v.registration_date,
    SUM(sd.quantity) AS total_boxes_purchased,
    COUNT(DISTINCT s.sale_id) AS total_purchases_count,
    ROUND(SUM(s.total_amount), 2) AS total_amount_spent
FROM vendors v
JOIN sales s ON v.vendor_id = s.vendor_id
JOIN sales_details sd ON s.sale_id = sd.sale_id
GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location, v.registration_date
ORDER BY total_boxes_purchased DESC
LIMIT 1;


-- Query 4: The current stock levels for each fruit and packaging size
-- Rationale: Lists stock by fruit name and separates small, medium, large

SELECT 
    s.stock_id,
    f.fruit_id,
    f.fruit_name,
    s.packaging_size,
    s.available_quantity,
    f.status AS fruit_status,
    s.updated_at
FROM stock s
JOIN fruits f ON s.fruit_id = f.fruit_id
ORDER BY f.fruit_name ASC, 
         FIELD(s.packaging_size, 'small', 'medium', 'large') ASC;


-- Advanced Business Logic Query: Calculate and display outstanding balance for each vendor
SELECT 
    v.vendor_id,
    v.vendor_name,
    v.phone_number,
    v.location,
    COUNT(s.sale_id) AS total_orders,
    COALESCE(SUM(s.total_amount), 0.00) AS total_invoiced,
    COALESCE(SUM(s.amount_paid), 0.00) AS total_paid,
    COALESCE(SUM(s.total_amount - s.amount_paid), 0.00) AS outstanding_balance
FROM vendors v
LEFT JOIN sales s ON v.vendor_id = s.vendor_id
GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location
ORDER BY outstanding_balance DESC, v.vendor_name ASC;
