const ReportModel = require('../models/reportModel');

/**
 * Report 1: Five most frequently sold fruits
 * GET /api/reports/top-fruits?limit=5
 */
async function getTopFruits(req, res, next) {
  try {
    const limit = req.query.limit || 5;
    const fruits = await ReportModel.getTopSellingFruits(limit);
    res.status(200).json({
      success: true,
      report: 'Five Most Frequently Sold Fruits',
      count: fruits.length,
      data: fruits
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Report 2: Total sales revenue generated during a specified date range
 * GET /api/reports/revenue?startDate=2026-01-01&endDate=2026-12-31
 */
async function getRevenueReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const report = await ReportModel.getRevenueByDateRange(startDate, endDate);
    res.status(200).json({
      success: true,
      report: 'Total Sales Revenue Generated During Specified Date Range',
      data: report
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Report 3: The vendor who has purchased the highest number of boxes
 * GET /api/reports/top-vendor
 */
async function getTopVendor(req, res, next) {
  try {
    const vendor = await ReportModel.getTopVendorByBoxes();
    res.status(200).json({
      success: true,
      report: 'Vendor With Highest Number of Boxes Purchased',
      data: vendor
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Report 4: Current stock levels for each fruit and packaging size
 * GET /api/reports/stock-levels
 */
async function getStockLevels(req, res, next) {
  try {
    const stock = await ReportModel.getCurrentStockLevels();
    res.status(200).json({
      success: true,
      report: 'Current Stock Levels for Each Fruit and Packaging Size',
      count: stock.length,
      data: stock
    });
  } catch (error) {
    next(error);
  }
}

/**
 * General Dashboard Overview Metrics
 * GET /api/reports/dashboard
 */
async function getDashboardSummary(req, res, next) {
  try {
    const metrics = await ReportModel.getDashboardMetrics();
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTopFruits,
  getRevenueReport,
  getTopVendor,
  getStockLevels,
  getDashboardSummary
};
