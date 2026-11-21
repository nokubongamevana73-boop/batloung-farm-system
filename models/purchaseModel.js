const { pool } = require('../config/db');

class PurchaseModel {
  /**
   * Retrieve all purchases with supplier name and item count
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        p.purchase_id,
        p.supplier_id,
        s.business_name AS supplier_name,
        s.province AS supplier_province,
        p.purchase_date,
        p.total_amount,
        COUNT(pd.purchase_detail_id) AS total_items,
        COALESCE(SUM(pd.quantity), 0) AS total_boxes
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      LEFT JOIN purchase_details pd ON p.purchase_id = pd.purchase_id
      GROUP BY p.purchase_id, p.supplier_id, s.business_name, s.province, p.purchase_date, p.total_amount
      ORDER BY p.purchase_date DESC
    `);
    return rows;
  }

  /**
   * Retrieve single purchase by ID with all line items
   */
  static async getById(purchaseId) {
    const [purchases] = await pool.query(`
      SELECT 
        p.purchase_id,
        p.supplier_id,
        s.business_name AS supplier_name,
        s.contact_person,
        s.phone,
        s.province,
        p.purchase_date,
        p.total_amount
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.purchase_id = ?
    `, [purchaseId]);

    if (purchases.length === 0) return null;
    const purchase = purchases[0];

    const [details] = await pool.query(`
      SELECT 
        pd.purchase_detail_id,
        pd.fruit_id,
        f.fruit_name,
        pd.packaging_size,
        pd.quantity,
        pd.unit_cost,
        (pd.quantity * pd.unit_cost) AS line_total
      FROM purchase_details pd
      JOIN fruits f ON pd.fruit_id = f.fruit_id
      WHERE pd.purchase_id = ?
    `, [purchaseId]);

    purchase.items = details;
    return purchase;
  }

  /**
   * Record a new purchase from a supplier with multiple fruit items.
   * Uses MySQL Transaction: BEGIN, COMMIT, ROLLBACK
   * Automatically calculates total amount and updates stock levels for each packaging size.
   */
  static async createWithTransaction({ supplier_id, purchase_date, items }) {
    const connection = await pool.getConnection();

    try {
      // 1. BEGIN TRANSACTION
      await connection.beginTransaction();

      // Verify supplier exists
      const [suppliers] = await connection.query(
        'SELECT supplier_id, business_name FROM suppliers WHERE supplier_id = ?',
        [supplier_id]
      );
      if (suppliers.length === 0) {
        const error = new Error(`Supplier with ID ${supplier_id} does not exist.`);
        error.statusCode = 404;
        throw error;
      }

      // 2. Validate all items and calculate total purchase amount automatically
      let calculatedTotal = 0;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const [fruits] = await connection.query(
          'SELECT fruit_id, fruit_name FROM fruits WHERE fruit_id = ?',
          [item.fruit_id]
        );
        if (fruits.length === 0) {
          const error = new Error(`Fruit with ID ${item.fruit_id} does not exist.`);
          error.statusCode = 404;
          throw error;
        }

        const qty = parseInt(item.quantity, 10);
        const cost = parseFloat(item.unit_cost);

        if (isNaN(qty) || qty <= 0) {
          const error = new Error(`Invalid quantity ${item.quantity} for fruit ID ${item.fruit_id}. Must be > 0.`);
          error.statusCode = 400;
          throw error;
        }

        if (isNaN(cost) || cost < 0) {
          const error = new Error(`Invalid unit_cost ${item.unit_cost} for fruit ID ${item.fruit_id}. Must be >= 0.`);
          error.statusCode = 400;
          throw error;
        }

        calculatedTotal += qty * cost;
      }

      // Round to 2 decimal places
      calculatedTotal = Math.round(calculatedTotal * 100) / 100;

      // 3. Insert Purchase Master Record
      const pDate = purchase_date || new Date();
      const [purchaseResult] = await connection.query(
        `INSERT INTO purchases (supplier_id, purchase_date, total_amount)
         VALUES (?, ?, ?)`,
        [supplier_id, pDate, calculatedTotal]
      );
      const purchaseId = purchaseResult.insertId;

      // 4. Insert Purchase Details and Update Stock
      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        const cost = parseFloat(item.unit_cost);
        const pkgSize = item.packaging_size.toLowerCase();

        // Insert into purchase_details
        await connection.query(
          `INSERT INTO purchase_details (purchase_id, fruit_id, packaging_size, quantity, unit_cost)
           VALUES (?, ?, ?, ?, ?)`,
          [purchaseId, item.fruit_id, pkgSize, qty, cost]
        );

        // Increase stock: maintain separate stock balances for each fruit and packaging size
        // If stock record doesn't exist, create it; otherwise increment available_quantity
        await connection.query(
          `INSERT INTO stock (fruit_id, packaging_size, available_quantity)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE available_quantity = available_quantity + ?`,
          [item.fruit_id, pkgSize, qty, qty]
        );
      }

      // 5. COMMIT TRANSACTION
      await connection.commit();

      return {
        purchase_id: purchaseId,
        supplier_id,
        supplier_name: suppliers[0].business_name,
        purchase_date: pDate,
        total_amount: calculatedTotal,
        items_count: items.length
      };
    } catch (error) {
      // ROLLBACK on any failure (validation, db error, etc.)
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = PurchaseModel;
