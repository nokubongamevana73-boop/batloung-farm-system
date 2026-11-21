const { pool } = require('../config/db');

class VendorModel {
  /**
   * Retrieve all registered vendors
   */
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM vendors ORDER BY vendor_name ASC'
    );
    return rows;
  }

  /**
   * Retrieve vendor by ID
   */
  static async getById(vendorId) {
    const [rows] = await pool.query(
      'SELECT * FROM vendors WHERE vendor_id = ?',
      [vendorId]
    );
    return rows[0] || null;
  }

  /**
   * Search for a vendor using name or phone number
   */
  static async search(term) {
    const pattern = `%${term}%`;
    const [rows] = await pool.query(
      `SELECT * FROM vendors 
       WHERE vendor_name LIKE ? OR phone_number LIKE ? OR location LIKE ?
       ORDER BY vendor_name ASC`,
      [pattern, pattern, pattern]
    );
    return rows;
  }

  /**
   * Register a new vendor
   */
  static async create({ vendor_name, phone_number, location, registration_date }) {
    const regDate = registration_date || new Date().toISOString().split('T')[0];
    const [result] = await pool.query(
      `INSERT INTO vendors (vendor_name, phone_number, location, registration_date)
       VALUES (?, ?, ?, ?)`,
      [vendor_name, phone_number, location, regDate]
    );
    return {
      vendor_id: result.insertId,
      vendor_name,
      phone_number,
      location,
      registration_date: regDate
    };
  }

  /**
   * Update vendor details
   */
  static async update(vendorId, { vendor_name, phone_number, location, registration_date }) {
    const [result] = await pool.query(
      `UPDATE vendors 
       SET vendor_name = COALESCE(?, vendor_name),
           phone_number = COALESCE(?, phone_number),
           location = COALESCE(?, location),
           registration_date = COALESCE(?, registration_date)
       WHERE vendor_id = ?`,
      [vendor_name, phone_number, location, registration_date, vendorId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Calculate and display outstanding balance for each vendor
   * (Total Invoiced - Total Paid)
   */
  static async getAllBalances() {
    const [rows] = await pool.query(`
      SELECT 
        v.vendor_id,
        v.vendor_name,
        v.phone_number,
        v.location,
        v.registration_date,
        COUNT(s.sale_id) AS total_orders,
        COALESCE(SUM(s.total_amount), 0.00) AS total_invoiced,
        COALESCE(SUM(s.amount_paid), 0.00) AS total_paid,
        COALESCE(SUM(s.total_amount - s.amount_paid), 0.00) AS outstanding_balance
      FROM vendors v
      LEFT JOIN sales s ON v.vendor_id = s.vendor_id
      GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location, v.registration_date
      ORDER BY outstanding_balance DESC, v.vendor_name ASC
    `);
    return rows;
  }

  /**
   * Calculate outstanding balance for a specific vendor
   */
  static async getVendorBalance(vendorId) {
    const [rows] = await pool.query(`
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
      WHERE v.vendor_id = ?
      GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location
    `, [vendorId]);
    return rows[0] || null;
  }
}

module.exports = VendorModel;
