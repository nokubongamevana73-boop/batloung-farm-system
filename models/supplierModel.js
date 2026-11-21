const { pool } = require('../config/db');

class SupplierModel {
  /**
   * Retrieve all suppliers sorted by business name
   */
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM suppliers ORDER BY business_name ASC'
    );
    return rows;
  }

  /**
   * Retrieve a supplier by ID
   */
  static async getById(supplierId) {
    const [rows] = await pool.query(
      'SELECT * FROM suppliers WHERE supplier_id = ?',
      [supplierId]
    );
    return rows[0] || null;
  }

  /**
   * Register a new supplier
   */
  static async create({ business_name, contact_person, phone, province, address }) {
    const [result] = await pool.query(
      `INSERT INTO suppliers (business_name, contact_person, phone, province, address)
       VALUES (?, ?, ?, ?, ?)`,
      [business_name, contact_person, phone, province, address]
    );
    return {
      supplier_id: result.insertId,
      business_name,
      contact_person,
      phone,
      province,
      address
    };
  }

  /**
   * Update an existing supplier
   */
  static async update(supplierId, { business_name, contact_person, phone, province, address }) {
    const [result] = await pool.query(
      `UPDATE suppliers 
       SET business_name = ?, contact_person = ?, phone = ?, province = ?, address = ?
       WHERE supplier_id = ?`,
      [business_name, contact_person, phone, province, address, supplierId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Check if supplier has associated purchases
   */
  static async hasPurchases(supplierId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM purchases WHERE supplier_id = ?',
      [supplierId]
    );
    return rows[0].count > 0;
  }

  /**
   * Delete a supplier subject to business constraints
   */
  static async delete(supplierId) {
    // Check business constraint: cannot delete if linked to purchases
    const purchasesCount = await this.hasPurchases(supplierId);
    if (purchasesCount) {
      const error = new Error('Cannot delete supplier because purchase records are linked to this supplier. Deletion violates business integrity.');
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.query(
      'DELETE FROM suppliers WHERE supplier_id = ?',
      [supplierId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = SupplierModel;
