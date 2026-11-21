const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { validateVendor } = require('../middleware/validateRequest');

router.get('/', vendorController.getAllVendors);
router.get('/search', vendorController.searchVendors);
router.get('/balances', vendorController.getVendorBalances);
router.get('/:id', vendorController.getVendorById);
router.get('/:id/balance', vendorController.getSingleVendorBalance);
router.post('/', validateVendor, vendorController.createVendor);
router.put('/:id', validateVendor, vendorController.updateVendor);

module.exports = router;
