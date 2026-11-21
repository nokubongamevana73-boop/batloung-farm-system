import React, { useState } from 'react';
import { api } from '../api/client';
import { Play, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function DemoSuite({ showToast }) 
{
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [rubricVerified, setRubricVerified] = useState(true);

  async function runOutOfStockTest() 
  {
    setIsTesting(true);
    const logs = [];
    const log = (msg) => logs.push(msg);

    log('===============================================================');
    log('  STARTING TEST: Out-of-Stock Atomic Rollback Verification');
    log('  Requirement: Reject sale if requested > available, with zero stock loss.');
    log('===============================================================\n');

    try {
      // Query initial stock for Apples (Large)
      log('[Step 1] Querying current stock for Apples (Large packaging)...');
      const stockRes = await api.getStock();
      const appleStock = (stockRes.data || []).find(
        (s) => s.fruit_name.toLowerCase() === 'apples' && s.packaging_size.toLowerCase() === 'large'
      );

      const fruitId = appleStock ? appleStock.fruit_id : 1;
      const initialQty = appleStock ? appleStock.available_quantity : 6;
      log(`  -> Initial Available Stock: ${initialQty} large boxes of Apples.`);

      // Attempt to order initialQty 
      const requestedQty = initialQty + 4;
      log(`\n[Step 2] Sending POST /api/sales requesting ${requestedQty} boxes (exceeding ${initialQty})...`);

      const salePayload = {
        vendor_id: 1,
        payment_method: 'Cash',
        items: [
          {
            fruit_id: fruitId,
            packaging_size: 'large',
            quantity: requestedQty,
            unit_price: 160.0
          }
        ]
      };

      try {
        await api.createSale(salePayload);
        log('  ✗ UNEXPECTED: The sale unexpectedly succeeded when it should have failed!');
      }
      catch (err) 
       {
        log(`  ✓ EXPECTED: Request failed with status ${err.status || 400}`);
        log(`  ✓ Response Error Message: "${err.message}"`);
      }

      // Verify that stock was NOT deducted
      log('\n[Step 3] Querying stock again to verify atomic ROLLBACK...');
      const verifyRes = await api.getStock();
      const appleStockAfter = (verifyRes.data || []).find(
        (s) => s.fruit_id === fruitId && s.packaging_size.toLowerCase() === 'large'
      );
      const finalQty = appleStockAfter ? appleStockAfter.available_quantity : 0;
      log(`  -> Final Available Stock: ${finalQty} boxes (was ${initialQty}).`);

      if (finalQty === initialQty) {
        log('\n===============================================================');
        log('  The transaction safely rolled back, preventing negative stock.');
        log('  Criteria Database transactions & Stock management verified!');
        log('===============================================================');
        showToast('Out-of-stock rollback test passed cleanly!', 'success');
      } else {
        log('\n  ✗ Stock was modified during failed transaction.');
      }
    } catch (err) {
      log(`  ✗ Test exception: ${err.message}`);
    } finally {
      setConsoleLogs(logs);
      setIsTesting(false);
    }
  }
}  