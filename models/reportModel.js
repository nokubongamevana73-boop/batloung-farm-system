const { pool } = require('../config/db');

class ReportModel {
  /**
   * Report 1: The five most frequently sold fruits
   */
  static async getTopSellingFruits(limit = 5) {
    const lim = Math.max(1, parseInt(limit, 10) || 5);
    const [rows] = await pool.query(`
      SELECT 
        f.fruit_id,
        f.fruit_name,
        f.description,
        COALESCE(SUM(sd.quantity), 0) AS total_boxes_sold,
        COUNT(DISTINCT sd.sale_id) AS total_orders_count,
        ROUND(COALESCE(SUM(sd.quantity * sd.unit_price), 0), 2) AS total_revenue_generated
      FROM fruits f
      JOIN sales_details sd ON f.fruit_id = sd.fruit_id
      GROUP BY f.fruit_id, f.fruit_name, f.description
      ORDER BY total_boxes_sold DESC
      LIMIT ?
    `, [lim]);
    return rows;
  }

  /**
   * Report 2: The total sales revenue generated during a specified date range
   */
  static async getRevenueByDateRange(startDate, endDate) {
    // Default to last 30 days if not provided
    const start = startDate || '2026-01-01';
    const end = endDate || '2026-12-31';

    const [rows] = await pool.query(`
      SELECT 
        ? AS start_date,
        ? AS end_date,
        COUNT(sale_id) AS total_sales_transactions,
        COALESCE(SUM(total_amount), 0.00) AS total_sales_revenue,
        COALESCE(SUM(amount_paid), 0.00) AS total_cash_collected,
        COALESCE(SUM(total_amount - amount_paid), 0.00) AS total_outstanding_credit
      FROM sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
    `, [start, end, start, end]);

    // Also get breakdown by day
    const [dailyBreakdown] = await pool.query(`
      SELECT 
        DATE(sale_date) AS sale_day,
        COUNT(sale_id) AS transactions_count,
        SUM(total_amount) AS daily_revenue,
        SUM(amount_paid) AS daily_collected
      FROM sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
      GROUP BY DATE(sale_date)
      ORDER BY sale_day ASC
    `, [start, end]);

    return {
      summary: rows[0],
      daily_breakdown: dailyBreakdown
    };
  }

  /**
   * Report 3: The vendor who has purchased the highest number of boxes
   */
  static async getTopVendorByBoxes() {
    const [rows] = await pool.query(`
      SELECT 
        v.vendor_id,
        v.vendor_name,
        v.phone_number,
        v.location,
        v.registration_date,
        COALESCE(SUM(sd.quantity), 0) AS total_boxes_purchased,
        COUNT(DISTINCT s.sale_id) AS total_purchases_count,
        ROUND(COALESCE(SUM(s.total_amount), 0), 2) AS total_amount_spent
      FROM vendors v
      JOIN sales s ON v.vendor_id = s.vendor_id
      JOIN sales_details sd ON s.sale_id = sd.sale_id
      GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location, v.registration_date
      ORDER BY total_boxes_purchased DESC
      LIMIT 1
    `);
    return rows[0] || null;
  }

  /**
   * Report 4: The current stock levels for each fruit and packaging size
   */
  static async getCurrentStockLevels() {
    const [rows] = await pool.query(`
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
               FIELD(s.packaging_size, 'small', 'medium', 'large') ASC
    `);
    return rows;
  }

  /**
   * Summary overview stats for dashboard
   */
  static async getDashboardMetrics() {
    const [totalRevenue] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM sales');
    const [totalPurchases] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) AS total_expenses FROM purchases');
    const [totalStock] = await pool.query('SELECT COALESCE(SUM(available_quantity), 0) AS total_boxes_in_stock FROM stock');
    const [outstandingCredit] = await pool.query('SELECT COALESCE(SUM(total_amount - amount_paid), 0) AS total_outstanding FROM sales');
    const [vendorCount] = await pool.query('SELECT COUNT(*) AS total_vendors FROM vendors');
    const [supplierCount] = await pool.query('SELECT COUNT(*) AS total_suppliers FROM suppliers');

    return {
      total_revenue: totalRevenue[0].total_revenue,
      total_expenses: totalPurchases[0].total_expenses,
      total_boxes_in_stock: totalStock[0].total_boxes_in_stock,
      total_outstanding_credit: outstandingCredit[0].total_outstanding,
      total_vendors: vendorCount[0].total_vendors,
      total_suppliers: supplierCount[0].total_suppliers
    };
  }
}

module.exports = ReportModel;
