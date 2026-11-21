const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { validatePurchase } = require('../middleware/validateRequest');

router.get('/', purchaseController.getAllPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.post('/', validatePurchase, purchaseController.createPurchase);

module.exports = router;
