const SaleModel = require('../models/saleModel');

/**
 * Retrieve all sales
 * GET /api/sales
 */
async function getAllSales(req, res, next) {
  try {
    const sales = await SaleModel.getAll();
    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve sale by ID
 * GET /api/sales/:id
 */
async function getSaleById(req, res, next) {
  try {
    const { id } = req.params;
    const sale = await SaleModel.getById(id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Sale with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record a sale to a vendor with transaction & out-of-stock validation
 * POST /api/sales
 */
async function createSale(req, res, next) {
  try {
    const result = await SaleModel.createWithTransaction(req.body);
    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully and stock deducted.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record payment towards an outstanding sale
 * POST /api/sales/:id/payments
 */
async function recordPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { payment_amount, payment_method } = req.body;

    if (!payment_amount || isNaN(parseFloat(payment_amount)) || parseFloat(payment_amount) <= 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: 'payment_amount must be a positive number.'
      });
    }

    const result = await SaleModel.recordPayment(id, { payment_amount, payment_method });
    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  recordPayment
};
