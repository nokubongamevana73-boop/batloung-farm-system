const PurchaseModel = require('../models/purchaseModel');

/**
 * Retrieve all purchases
 * GET /api/purchases
 */
async function getAllPurchases(req, res, next) {
  try {
    const purchases = await PurchaseModel.getAll();
    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve purchase by ID
 * GET /api/purchases/:id
 */
async function getPurchaseById(req, res, next) {
  try {
    const { id } = req.params;
    const purchase = await PurchaseModel.getById(id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Purchase with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record a purchase from a supplier
 * POST /api/purchases
 */
async function createPurchase(req, res, next) {
  try {
    const result = await PurchaseModel.createWithTransaction(req.body);
    res.status(201).json({
      success: true,
      message: 'Purchase recorded successfully and stock levels updated.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllPurchases,
  getPurchaseById,
  createPurchase
};
