const { pool } = require('../config/db');

class SaleModel {
  /**
   * Retrieve all sales with vendor details
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        s.sale_id,
        s.vendor_id,
        v.vendor_name,
        v.phone_number,
        v.location,
        s.sale_date,
        s.payment_status,
        s.payment_method,
        s.total_amount,
        s.amount_paid,
        (s.total_amount - s.amount_paid) AS balance_remaining,
        COUNT(sd.sales_detail_id) AS total_items,
        COALESCE(SUM(sd.quantity), 0) AS total_boxes
      FROM sales s
      JOIN vendors v ON s.vendor_id = v.vendor_id
      LEFT JOIN sales_details sd ON s.sale_id = sd.sale_id
      GROUP BY s.sale_id, s.vendor_id, v.vendor_name, v.phone_number, v.location,
               s.sale_date, s.payment_status, s.payment_method, s.total_amount, s.amount_paid
      ORDER BY s.sale_date DESC
    `);
    return rows;
  }

  /**
   * Retrieve a single sale by ID with its line items
   */
  static async getById(saleId) {
    const [sales] = await pool.query(`
      SELECT 
        s.sale_id,
        s.vendor_id,
        v.vendor_name,
        v.phone_number,
        v.location,
        s.sale_date,
        s.payment_status,
        s.payment_method,
        s.total_amount,
        s.amount_paid,
        (s.total_amount - s.amount_paid) AS balance_remaining
      FROM sales s
      JOIN vendors v ON s.vendor_id = v.vendor_id
      WHERE s.sale_id = ?
    `, [saleId]);

    if (sales.length === 0) return null;
    const sale = sales[0];

    const [details] = await pool.query(`
      SELECT 
        sd.sales_detail_id,
        sd.fruit_id,
        f.fruit_name,
        sd.packaging_size,
        sd.quantity,
        sd.unit_price,
        (sd.quantity * sd.unit_price) AS line_total
      FROM sales_details sd
      JOIN fruits f ON sd.fruit_id = f.fruit_id
      WHERE sd.sale_id = ?
    `, [saleId]);

    sale.items = details;
    return sale;
  }

  /**
   * Record a sale to a vendor with transaction & strict stock validation.
   * If any item exceeds available stock, the entire sale is rejected,
   * no stock is deducted, and the transaction is cleanly rolled back.
   */
  static async createWithTransaction({ vendor_id, sale_date, items, payment_method = 'Cash', amount_paid }) {
    const connection = await pool.getConnection();

    try {
      // 1. BEGIN TRANSACTION
      await connection.beginTransaction();

      // Check vendor exists
      const [vendors] = await connection.query(
        'SELECT vendor_id, vendor_name FROM vendors WHERE vendor_id = ?',
        [vendor_id]
      );
      if (vendors.length === 0) {
        const error = new Error(`Vendor with ID ${vendor_id} does not exist.`);
        error.statusCode = 404;
        throw error;
      }

      // 2. Validate items, check stock levels, and calculate total selling price
      let calculatedTotal = 0;
      const verifiedItems = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const fruitId = parseInt(item.fruit_id, 10);
        const qty = parseInt(item.quantity, 10);
        const price = parseFloat(item.unit_price);
        const pkgSize = (item.packaging_size || '').toLowerCase();

        // Check fruit exists
        const [fruits] = await connection.query(
          'SELECT fruit_id, fruit_name FROM fruits WHERE fruit_id = ?',
          [fruitId]
        );
        if (fruits.length === 0) {
          const error = new Error(`Fruit with ID ${fruitId} does not exist.`);
          error.statusCode = 404;
          throw error;
        }
        const fruitName = fruits[0].fruit_name;

        // Query available stock for this fruit and specific packaging size with FOR UPDATE
        const [stocks] = await connection.query(
          'SELECT stock_id, available_quantity FROM stock WHERE fruit_id = ? AND packaging_size = ? FOR UPDATE',
          [fruitId, pkgSize]
        );

        const currentStock = stocks.length > 0 ? stocks[0].available_quantity : 0;

        // CRITICAL BUSINESS REQUIREMENT:
        // "A vendor requests 10 large boxes of apples, but only 6 large boxes are available.
        // The API must reject the entire sale without reducing the available stock or creating an incomplete transaction."
        if (qty > currentStock) {
          const error = new Error(
            `Sale rejected: Insufficient stock for ${fruitName} (${pkgSize} packaging). Requested: ${qty} boxes, but only ${currentStock} boxes available.`
          );
          error.statusCode = 400;
          error.details = {
            fruit_id: fruitId,
            fruit_name: fruitName,
            packaging_size: pkgSize,
            requested_quantity: qty,
            available_quantity: currentStock
          };
          throw error;
        }

        const lineTotal = qty * price;
        calculatedTotal += lineTotal;

        verifiedItems.push({
          fruit_id: fruitId,
          fruit_name: fruitName,
          packaging_size: pkgSize,
          quantity: qty,
          unit_price: price,
          line_total: lineTotal
        });
      }

      calculatedTotal = Math.round(calculatedTotal * 100) / 100;

      // 3. Advanced Payment Management Logic
      // Determine amount paid and payment status (PAID, PARTIALLY_PAID, UNPAID)
      let finalAmountPaid;
      if (amount_paid !== undefined && amount_paid !== null && !isNaN(parseFloat(amount_paid))) {
        finalAmountPaid = Math.max(0, parseFloat(amount_paid));
      } else {
        // If not explicitly provided: Credit defaults to 0 paid (UNPAID); Cash / Mobile Money default to full payment (PAID)
        finalAmountPaid = (payment_method === 'Credit') ? 0.00 : calculatedTotal;
      }
      finalAmountPaid = Math.round(finalAmountPaid * 100) / 100;

      let paymentStatus = 'UNPAID';
      if (finalAmountPaid >= calculatedTotal) {
        paymentStatus = 'PAID';
      } else if (finalAmountPaid > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      } else {
        paymentStatus = 'UNPAID';
      }

      // 4. Insert Master Sale Record
      const sDate = sale_date || new Date();
      const [saleResult] = await connection.query(
        `INSERT INTO sales (vendor_id, sale_date, payment_status, total_amount, payment_method, amount_paid)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [vendor_id, sDate, paymentStatus, calculatedTotal, payment_method, finalAmountPaid]
      );
      const saleId = saleResult.insertId;

      // 5. Insert Sales Details and Decrease Stock Levels
      for (const item of verifiedItems) {
        // Insert into sales_details
        await connection.query(
          `INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price)
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, item.fruit_id, item.packaging_size, item.quantity, item.unit_price]
        );

        // Decrease stock for this specific packaging size while preventing negative stock
        await connection.query(
          `UPDATE stock 
           SET available_quantity = available_quantity - ?
           WHERE fruit_id = ? AND packaging_size = ?`,
          [item.quantity, item.fruit_id, item.packaging_size]
        );
      }

      // 6. COMMIT TRANSACTION
      await connection.commit();

      return {
        sale_id: saleId,
        vendor_id,
        vendor_name: vendors[0].vendor_name,
        sale_date: sDate,
        total_amount: calculatedTotal,
        amount_paid: finalAmountPaid,
        balance_remaining: Math.round((calculatedTotal - finalAmountPaid) * 100) / 100,
        payment_status: paymentStatus,
        payment_method,
        items: verifiedItems
      };
    } catch (error) {
      // Complete atomic ROLLBACK
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Record payment for an outstanding sale
   */
  static async recordPayment(saleId, { payment_amount, payment_method }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [sales] = await connection.query(
        'SELECT sale_id, total_amount, amount_paid, payment_status FROM sales WHERE sale_id = ? FOR UPDATE',
        [saleId]
      );

      if (sales.length === 0) {
        const error = new Error(`Sale with ID ${saleId} not found.`);
        error.statusCode = 404;
        throw error;
      }

      const sale = sales[0];
      const additional = parseFloat(payment_amount);
      if (isNaN(additional) || additional <= 0) {
        const error = new Error('Payment amount must be greater than zero.');
        error.statusCode = 400;
        throw error;
      }

      const newTotalPaid = Math.round((parseFloat(sale.amount_paid) + additional) * 100) / 100;
      let newStatus = 'PARTIALLY_PAID';
      if (newTotalPaid >= parseFloat(sale.total_amount)) {
        newStatus = 'PAID';
      }

      await connection.query(
        `UPDATE sales 
         SET amount_paid = ?, payment_status = ?, payment_method = COALESCE(?, payment_method)
         WHERE sale_id = ?`,
        [newTotalPaid, newStatus, payment_method || null, saleId]
      );

      await connection.commit();

      return {
        sale_id: saleId,
        previous_amount_paid: sale.amount_paid,
        additional_payment: additional,
        new_total_paid: newTotalPaid,
        total_amount: sale.total_amount,
        outstanding_balance: Math.max(0, Math.round((sale.total_amount - newTotalPaid) * 100) / 100),
        payment_status: newStatus
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = SaleModel;
