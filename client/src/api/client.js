const API_BASE = '/api';

async function request(endpoint, options = {}) 
{
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error((data && data.error) || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Fruits & Stock
  getFruits: () => request('/fruits'),
  createFruit: (payload) => request('/fruits', { method: 'POST', body: JSON.stringify(payload) }),
  getStock: () => request('/stock'),
  getLowStock: (threshold = 15) => request(`/stock/low-stock?threshold=${threshold}`),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  createSupplier: (payload) => request('/suppliers', { method: 'POST', body: JSON.stringify(payload) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Vendors
  getVendors: () => request('/vendors'),
  searchVendors: (q) => request(`/vendors/search?q=${encodeURIComponent(q)}`),
  createVendor: (payload) => request('/vendors', { method: 'POST', body: JSON.stringify(payload) }),
  getVendorBalances: () => request('/vendors/balances'),
  getSingleVendorBalance: (id) => request(`/vendors/${id}/balance`),

  // Purchases
  getPurchases: () => request('/purchases'),
  createPurchase: (payload) => request('/purchases', { method: 'POST', body: JSON.stringify(payload) }),

  // Sales
  getSales: () => request('/sales'),
  createSale: (payload) => request('/sales', { method: 'POST', body: JSON.stringify(payload) }),
  recordPayment: (saleId, payload) => request(`/sales/${saleId}/payments`, { method: 'POST', body: JSON.stringify(payload) }),

  // Reports
  getTopFruits: (limit = 5) => request(`/reports/top-fruits?limit=${limit}`),
  getRevenue: (startDate, endDate) => request(`/reports/revenue?startDate=${startDate}&endDate=${endDate}`),
  getTopVendor: () => request('/reports/top-vendor'),
  getStockLevels: () => request('/reports/stock-levels'),
  getDashboard: () => request('/reports/dashboard')
};
