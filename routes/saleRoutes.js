const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { validateSale } = require('../middleware/validateRequest');

router.get('/', saleController.getAllSales);
router.get('/:id', saleController.getSaleById);
router.post('/', validateSale, saleController.createSale);
router.post('/:id/payments', saleController.recordPayment);

module.exports = router;
