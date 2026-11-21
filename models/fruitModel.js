const { pool } = require('../config/db');

class FruitModel {
  /**
   * Retrieve all fruits
   */
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM fruits ORDER BY fruit_name ASC'
    );
    return rows;
  }

  /**
   * Retrieve fruit by ID
   */
  static async getById(fruitId) {
    const [rows] = await pool.query(
      'SELECT * FROM fruits WHERE fruit_id = ?',
      [fruitId]
    );
    return rows[0] || null;
  }

  /**
   * Register a new fruit and automatically initialize 0 stock rows
   * for small, medium, and large packaging sizes.
   */
  static async create({ fruit_name, description, status = 'Available' }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        'INSERT INTO fruits (fruit_name, description, status) VALUES (?, ?, ?)',
        [fruit_name, description || null, status]
      );
      const fruitId = result.insertId;

      // Initialize stock tracking for small, medium, and large packaging sizes
      const sizes = ['small', 'medium', 'large'];
      for (const size of sizes) {
        await connection.query(
          'INSERT INTO stock (fruit_id, packaging_size, available_quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE available_quantity = available_quantity',
          [fruitId, size]
        );
      }

      await connection.commit();
      return {
        fruit_id: fruitId,
        fruit_name,
        description,
        status
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update fruit information
   */
  static async update(fruitId, { fruit_name, description, status }) {
    const [result] = await pool.query(
      `UPDATE fruits 
       SET fruit_name = COALESCE(?, fruit_name),
           description = COALESCE(?, description),
           status = COALESCE(?, status)
       WHERE fruit_id = ?`,
      [fruit_name, description, status, fruitId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Delete fruit (if not linked to stock or purchases/sales)
   */
  static async delete(fruitId) {
    const [result] = await pool.query('DELETE FROM fruits WHERE fruit_id = ?', [fruitId]);
    return result.affectedRows > 0;
  }

  /**
   * View stock quantities for each packaging size across all fruits
   * Separates small, medium, and large
   */
  static async getStockQuantities() {
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
   * Identify fruits with low stock levels
   * Returns items where available_quantity <= threshold
   */
  static async getLowStock(threshold = 15) {
    const [rows] = await pool.query(`
      SELECT 
        s.stock_id,
        f.fruit_id,
        f.fruit_name,
        s.packaging_size,
        s.available_quantity,
        f.status,
        s.updated_at
      FROM stock s
      JOIN fruits f ON s.fruit_id = f.fruit_id
      WHERE s.available_quantity <= ?
      ORDER BY s.available_quantity ASC, f.fruit_name ASC
    `, [threshold]);
    return rows;
  }
}

module.exports = FruitModel;
