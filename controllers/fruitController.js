const FruitModel = require('../models/fruitModel');

/**
 * Retrieve all available fruits
 * GET /api/fruits
 */
async function getAllFruits(req, res, next) {
  try {
    const fruits = await FruitModel.getAll();
    res.status(200).json({
      success: true,
      count: fruits.length,
      data: fruits
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve fruit by ID
 * GET /api/fruits/:id
 */
async function getFruitById(req, res, next) {
  try {
    const { id } = req.params;
    const fruit = await FruitModel.getById(id);

    if (!fruit) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Fruit with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: fruit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new fruit type
 * POST /api/fruits
 */
async function createFruit(req, res, next) {
  try {
    const newFruit = await FruitModel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Fruit registered successfully and stock tracking initialized.',
      data: newFruit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update fruit information
 * PUT /api/fruits/:id
 */
async function updateFruit(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await FruitModel.getById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Fruit with ID ${id} not found.`
      });
    }

    await FruitModel.update(id, req.body);
    const updated = await FruitModel.getById(id);

    res.status(200).json({
      success: true,
      message: 'Fruit updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * View stock quantities for each packaging size (small, medium, large)
 * GET /api/stock
 */
async function getStockQuantities(req, res, next) {
  try {
    const stock = await FruitModel.getStockQuantities();
    res.status(200).json({
      success: true,
      count: stock.length,
      data: stock
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Identify fruits with low stock levels
 * GET /api/stock/low-stock?threshold=15
 */
async function getLowStock(req, res, next) {
  try {
    const threshold = parseInt(req.query.threshold, 10) || parseInt(process.env.LOW_STOCK_THRESHOLD, 10) || 15;
    const lowStock = await FruitModel.getLowStock(threshold);

    res.status(200).json({
      success: true,
      threshold,
      count: lowStock.length,
      data: lowStock
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllFruits,
  getFruitById,
  createFruit,
  updateFruit,
  getStockQuantities,
  getLowStock
};
