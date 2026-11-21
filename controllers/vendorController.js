const VendorModel = require('../models/vendorModel');

/**
 * Retrieve all registered vendors
 * GET /api/vendors
 */
async function getAllVendors(req, res, next) {
  try {
    const vendors = await VendorModel.getAll();
    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a vendor by ID
 * GET /api/vendors/:id
 */
async function getVendorById(req, res, next) {
  try {
    const { id } = req.params;
    const vendor = await VendorModel.getById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Vendor with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Search for a vendor using name or phone number
 * GET /api/vendors/search?q=...
 */
async function searchVendors(req, res, next) {
  try {
    const query = req.query.q || req.query.name || req.query.phone || '';
    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: "Query parameter 'q', 'name', or 'phone' is required."
      });
    }

    const results = await VendorModel.search(query.trim());
    res.status(200).json({
      success: true,
      query: query.trim(),
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new vendor
 * POST /api/vendors
 */
async function createVendor(req, res, next) {
  try {
    const newVendor = await VendorModel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully.',
      data: newVendor
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update vendor details
 * PUT /api/vendors/:id
 */
async function updateVendor(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await VendorModel.getById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Vendor with ID ${id} not found.`
      });
    }

    await VendorModel.update(id, req.body);
    const updated = await VendorModel.getById(id);

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Calculate and display outstanding balance for each vendor
 * GET /api/vendors/balances
 */
async function getVendorBalances(req, res, next) {
  try {
    const balances = await VendorModel.getAllBalances();
    res.status(200).json({
      success: true,
      count: balances.length,
      data: balances
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Calculate and display outstanding balance for a specific vendor
 * GET /api/vendors/:id/balance
 */
async function getSingleVendorBalance(req, res, next) {
  try {
    const { id } = req.params;
    const balance = await VendorModel.getVendorBalance(id);

    if (!balance) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Vendor with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: balance
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllVendors,
  getVendorById,
  searchVendors,
  createVendor,
  updateVendor,
  getVendorBalances,
  getSingleVendorBalance
};
