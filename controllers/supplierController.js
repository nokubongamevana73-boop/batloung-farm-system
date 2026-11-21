const SupplierModel = require('../models/supplierModel');

/**
 * Retrieve all suppliers
 * GET /api/suppliers
 */
async function getAllSuppliers(req, res, next) {
  try {
    const suppliers = await SupplierModel.getAll();
    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a supplier by ID
 * GET /api/suppliers/:id
 */
async function getSupplierById(req, res, next) {
  try {
    const { id } = req.params;
    const supplier = await SupplierModel.getById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Supplier with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new supplier
 * POST /api/suppliers
 */
async function createSupplier(req, res, next) {
  try {
    const newSupplier = await SupplierModel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Supplier registered successfully.',
      data: newSupplier
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing supplier
 * PUT /api/suppliers/:id
 */
async function updateSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await SupplierModel.getById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Supplier with ID ${id} not found.`
      });
    }

    await SupplierModel.update(id, req.body);
    const updated = await SupplierModel.getById(id);

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a supplier subject to applicable business constraints
 * DELETE /api/suppliers/:id
 */
async function deleteSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await SupplierModel.getById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        status: 404,
        error: `Supplier with ID ${id} not found.`
      });
    }

    await SupplierModel.delete(id);

    res.status(200).json({
      success: true,
      message: `Supplier '${existing.business_name}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
