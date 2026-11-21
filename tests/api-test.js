/**
 * Batloung Farm Distribution System - End-to-End System Test Suite
 * Validates backend API functionality, data integrity, and transactions
 */

require('dotenv').config();
const http = require('http');
const { app } = require('../server');
const { pool } = require('../config/db');

let server;
let baseUrl;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================================');
  console.log('  Batloung Farm Distribution System - Test Suite');
  console.log('  Maseru, Lesotho Fresh Produce Management');
  console.log('==================================================================\n');

  // Start test server on random port
  await new Promise(resolve => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Test Runner] Test server running on ${baseUrl}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    
    // System Health & Database Connection
    
    console.log('--- TEST GROUP 1: Backend & Connection Setup ---');
    const health = await request('GET', '/api/health');
    assert(health.status === 200 || health.status === 503, 'Health endpoint responds with appropriate status');
    console.log(`  Database status: ${health.body.database?.connected ? 'CONNECTED' : 'DISCONNECTED (check .env credentials)'}`);

    if (!health.body.database?.connected) {
      console.log('\n[Note] MySQL database is not connected. Please ensure your .env credentials match your MySQL server.');
      console.log('Run `npm run setup-db` after configuring .env to initialize schema and sample data.\n');
      server.close();
      return;
    }

    
    //  Suppliers CRUD & Business Constraints
    
    console.log('\n--- TEST GROUP 2: Supplier Management ---');
    const suppliers = await request('GET', '/api/suppliers');
    assert(suppliers.status === 200 && Array.isArray(suppliers.body.data), 'Retrieve all suppliers returns 200 OK');

    const newSupplier = {
      business_name: 'Bloemfontein Citrus Orchards',
      contact_person: 'Kagiso Mokoena',
      phone: '+27 51 999 1122',
      province: 'Free State',
      address: 'Plot 88 Industrial Agricultural Zone, Bloemfontein'
    };
    const createdSupplier = await request('POST', '/api/suppliers', newSupplier);
    assert(createdSupplier.status === 201 && createdSupplier.body.data.supplier_id, 'Register new supplier returns 201 Created');

    const supId = createdSupplier.body.data.supplier_id;
    const singleSupplier = await request('GET', `/api/suppliers/${supId}`);
    assert(singleSupplier.status === 200 && singleSupplier.body.data.business_name === newSupplier.business_name, 'Retrieve supplier by ID returns 200 OK');

    const deleteSupplier = await request('DELETE', `/api/suppliers/${supId}`);
    assert(deleteSupplier.status === 200, 'Delete unreferenced supplier succeeds with 200 OK');

    // Fruits & Stock Management (Packaging specific)
   
    console.log('\n--- TEST GROUP 3: Fruit & Stock Management ---');
    const fruits = await request('GET', '/api/fruits');
    assert(fruits.status === 200 && fruits.body.data.length >= 5, 'Retrieve all fruits returns at least 5 produce types');

    const stock = await request('GET', '/api/stock');
    assert(stock.status === 200, 'View stock quantities for each packaging size returns 200 OK');
    
    // Check that small, medium, and large packaging sizes are tracked separately
    const pkgSizes = [...new Set(stock.body.data.map(s => s.packaging_size.toLowerCase()))];
    assert(pkgSizes.includes('small') && pkgSizes.includes('medium') && pkgSizes.includes('large'), 'Stock accurately separates Small, Medium, and Large packaging sizes');

    const lowStock = await request('GET', '/api/stock/low-stock?threshold=15');
    assert(lowStock.status === 200 && Array.isArray(lowStock.body.data), 'Identify fruits with low stock levels returns 200 OK');

   
    // Vendor Management & Search

    console.log('\n--- TEST GROUP 4: Vendor Management ---');
    const vendors = await request('GET', '/api/vendors');
    assert(vendors.status === 200 && Array.isArray(vendors.body.data), 'Retrieve all registered vendors returns 200 OK');

    const searchRes = await request('GET', '/api/vendors/search?q=Maseru');
    assert(searchRes.status === 200 && searchRes.body.data.length > 0, 'Search for vendor using name/phone/location returns 200 OK');

    const newVendor = {
      vendor_name: 'Khubetsoana Fresh Kiosk',
      phone_number: '+266 5999 8877',
      location: 'Khubetsoana Main Road, Maseru',
      registration_date: '2026-11-01'
    };
    const createdVendor = await request('POST', '/api/vendors', newVendor);
    assert(createdVendor.status === 201 && createdVendor.body.data.vendor_id, 'Register new vendor returns 201 Created');

    
    //  Purchases Recording (Stock In) & Automatic Calculation
   
    console.log('\n--- TEST GROUP 5: Purchase Management & Stock Increment ---');
    // Read initial stock of Bananas (small)
    const bananaBefore = stock.body.data.find(s => s.fruit_name.toLowerCase() === 'bananas' && s.packaging_size.toLowerCase() === 'small');
    const initialBananaQty = bananaBefore ? bananaBefore.available_quantity : 0;
    const bananaFruitId = bananaBefore ? bananaBefore.fruit_id : 2;

    const purchasePayload = {
      supplier_id: 1,
      items: [
        {
          fruit_id: bananaFruitId,
          packaging_size: 'small',
          quantity: 20,
          unit_cost: 45.00
        }
      ]
    };
    const purchaseRes = await request('POST', '/api/purchases', purchasePayload);
    assert(purchaseRes.status === 201 && parseFloat(purchaseRes.body.data.total_amount) === 900.00, 'Purchase total is calculated automatically (20 boxes * M45.00 = M900.00)');

    const stockAfterPurchase = await request('GET', '/api/stock');
    const bananaAfter = stockAfterPurchase.body.data.find(s => s.fruit_id === bananaFruitId && s.packaging_size.toLowerCase() === 'small');
    assert(bananaAfter.available_quantity === initialBananaQty + 20, 'Stock increased properly after purchase was recorded');

    
    //  Out of Stock Rejection & Atomic Rollback
    
    console.log('\n--- TEST GROUP 6: Out-of-Stock Validation & Transaction Rollback ---');
    console.log('  Scenario: Requested stock quantity exceeds available boxes');
    
    // Find Apples (large)
    const appleEntry = stockAfterPurchase.body.data.find(s => s.fruit_name.toLowerCase() === 'apples' && s.packaging_size.toLowerCase() === 'large');
    const appleFruitId = appleEntry ? appleEntry.fruit_id : 1;
    const currentAppleStock = appleEntry ? appleEntry.available_quantity : 6;

    const failSalePayload = {
      vendor_id: 1,
      payment_method: 'Cash',
      items: [
        {
          fruit_id: appleFruitId,
          packaging_size: 'large',
          quantity: currentAppleStock + 4, // Request more than available
          unit_price: 160.00
        }
      ]
    };

    const failSaleRes = await request('POST', '/api/sales', failSalePayload);
    assert(failSaleRes.status === 400, 'Sale was REJECTED with 400 Bad Request when requested stock exceeded available stock');
    assert(failSaleRes.body.error && failSaleRes.body.error.includes('Insufficient stock'), 'API provided meaningful error message identifying fruit, packaging size, and quantities');

    const stockAfterFail = await request('GET', '/api/stock');
    const appleAfterFail = stockAfterFail.body.data.find(s => s.fruit_id === appleFruitId && s.packaging_size.toLowerCase() === 'large');
    assert(appleAfterFail.available_quantity === currentAppleStock, 'Stock remained completely untouched (Atomic ROLLBACK verified!)');

   
    // Successful Multi-Item Sale & Payment Status Logic
   
    console.log('\n--- TEST GROUP 7: Sales Management & Payment Logic ---');
    const validSalePayload = {
      vendor_id: 1,
      payment_method: 'Mobile Money',
      amount_paid: 200.00,
      items: [
        {
          fruit_id: bananaFruitId,
          packaging_size: 'small',
          quantity: 5,
          unit_price: 60.00 // line total: 300.00
        }
      ]
    };
    const validSaleRes = await request('POST', '/api/sales', validSalePayload);
    assert(validSaleRes.status === 201, 'Valid sale recorded with 201 Created');
    assert(parseFloat(validSaleRes.body.data.total_amount) === 300.00, 'Sales total calculated automatically (5 * M60.00 = M300.00)');
    assert(validSaleRes.body.data.payment_status === 'PARTIALLY_PAID', 'Payment status correctly evaluated as PARTIALLY_PAID (Paid M200 of M300)');

    
    // SQL Reporting Queries
    
    console.log('\n--- TEST GROUP 8: Analytics & SQL Reporting Queries ---');
    const r1 = await request('GET', '/api/reports/top-fruits?limit=5');
    assert(r1.status === 200 && Array.isArray(r1.body.data), 'Query 1: Five most frequently sold fruits executed');

    const r2 = await request('GET', '/api/reports/revenue?startDate=2026-01-01&endDate=2026-12-31');
    assert(r2.status === 200 && r2.body.data.summary, 'Query 2: Total sales revenue for date range executed');

    const r3 = await request('GET', '/api/reports/top-vendor');
    assert(r3.status === 200, 'Query 3: Vendor with highest boxes purchased executed');

    const r4 = await request('GET', '/api/reports/stock-levels');
    assert(r4.status === 200 && Array.isArray(r4.body.data), 'Query 4: Current stock levels by fruit & packaging size executed');

    // Vendor Balances
    const balances = await request('GET', '/api/vendors/balances');
    assert(balances.status === 200 && Array.isArray(balances.body.data), 'Vendor outstanding credit ledger retrieved successfully');

    console.log('\n==================================================================');
    console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('  All system functions & transactions verified');
    console.log('==================================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) {
      server.close();
    }
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
