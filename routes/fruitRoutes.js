const express = require('express');
const router = express.Router();
const fruitController = require('../controllers/fruitController');
const { validateFruit } = require('../middleware/validateRequest');

// Fruit CRUD
router.get('/', fruitController.getAllFruits);
router.get('/stock', fruitController.getStockQuantities);
router.get('/low-stock', fruitController.getLowStock);
router.get('/:id', fruitController.getFruitById);
router.post('/', validateFruit, fruitController.createFruit);
router.put('/:id', validateFruit, fruitController.updateFruit);

module.exports = router;
