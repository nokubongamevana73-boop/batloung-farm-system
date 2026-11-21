const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/top-fruits', reportController.getTopFruits);
router.get('/revenue', reportController.getRevenueReport);
router.get('/top-vendor', reportController.getTopVendor);
router.get('/stock-levels', reportController.getStockLevels);
router.get('/dashboard', reportController.getDashboardSummary);

module.exports = router;
