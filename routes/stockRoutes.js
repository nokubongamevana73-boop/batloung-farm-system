const express = require('express');
const router = express.Router();
const fruitController = require('../controllers/fruitController');

// Stock management endpoints
router.get('/', fruitController.getStockQuantities);
router.get('/low-stock', fruitController.getLowStock);

module.exports = router;
