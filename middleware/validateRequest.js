const SA_PROVINCES = [
  'Gauteng',
  'Free State',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West'
];

const PACKAGING_SIZES = ['small', 'medium', 'large'];

/**
 * Validates Supplier creation / update input
 */
function validateSupplier(req, res, next) {
  const { business_name, contact_person, phone, province, address } = req.body;

  if (!business_name || !contact_person || !phone || !province || !address) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: 'Missing required supplier fields: business_name, contact_person, phone, province, address.'
    });
  }

  if (!SA_PROVINCES.includes(province)) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: `Invalid province '${province}'. Sourcing is allowed only from South African provinces: ${SA_PROVINCES.join(', ')}.`
    });
  }

  next();
}

/**
 * Validates Fruit input
 */
function validateFruit(req, res, next) {
  const { fruit_name, status } = req.body;

  if (!fruit_name || typeof fruit_name !== 'string' || !fruit_name.trim()) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: 'fruit_name is required.'
    });
  }

  if (status && !['Available', 'Out of Stock', 'Discontinued'].includes(status)) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: "status must be one of 'Available', 'Out of Stock', or 'Discontinued'."
    });
  }

  next();
}

/**
 * Validates Vendor input
 */
function validateVendor(req, res, next) {
  const { vendor_name, phone_number, location, registration_date } = req.body;

  if (!vendor_name || !phone_number || !location) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: 'vendor_name, phone_number, and location are required.'
    });
  }

  next();
}

/**
 * Validates Purchase recording input (Supplier ID + multiple items)
 */
function validatePurchase(req, res, next) {
  const { supplier_id, items } = req.body;

  if (!supplier_id || isNaN(parseInt(supplier_id, 10))) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: 'A valid supplier_id is required.'
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: 'Purchase must contain an array of one or more fruit items.'
    });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.fruit_id || isNaN(parseInt(item.fruit_id, 10))) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: `Item at index ${i} is missing a valid fruit_id.`
      });
    }

    if (!item.quantity || parseInt(item.quantity, 10) <= 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: `Item at index ${i} must have a positive quantity (number of boxes).`
      });
    }

    if (item.unit_cost === undefined || isNaN(parseFloat(item.unit_cost)) || parseFloat(item.unit_cost) < 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: `Item at index ${i} must have a valid non-negative unit_cost.`
      });
    }

    if (!item.packaging_size || !PACKAGING_SIZES.includes(item.packaging_size.toLowerCase())) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: `Item at index ${i} has invalid packaging_size '${item.packaging_size}'. Must be 'small', 'medium', or 'large'.`
      });
    }
  }

  next();
}

/**
 * Validates Sale recording input (Vendor ID + multiple items + payment info)
 */
function validateSale(req, res, next) {
  const { vendor_id, items, payment_method } = req.body;

  if (!vendor_id || isNaN(parseInt(vendor_id, 10))) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: 'A valid vendor_id is required.'
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: 'Sale must contain an array of one or more fruit items.'
    });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.fruit_id || isNaN(parseInt(item.fruit_id, 10))) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: `Sale item at index ${i} is missing a valid fruit_id.`
      });
    }

    if (!item.quantity || parseInt(item.quantity, 10) <= 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: `Sale item at index ${i} must have a positive quantity.`
      });
    }

    if (item.unit_price === undefined || isNaN(parseFloat(item.unit_price)) || parseFloat(item.unit_price) < 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: `Sale item at index ${i} must have a valid non-negative unit_price.`
      });
    }

    if (!item.packaging_size || !PACKAGING_SIZES.includes(item.packaging_size.toLowerCase())) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: `Sale item at index ${i} has invalid packaging_size '${item.packaging_size}'. Must be 'small', 'medium', or 'large'.`
      });
    }
  }

  if (payment_method && !['Cash', 'Mobile Money', 'Credit'].includes(payment_method)) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: "payment_method must be one of 'Cash', 'Mobile Money', or 'Credit'."
    });
  }

  next();
}

module.exports = {
  validateSupplier,
  validateFruit,
  validateVendor,
  validatePurchase,
  validateSale,
  SA_PROVINCES,
  PACKAGING_SIZES
};
