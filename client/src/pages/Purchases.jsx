import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PlusCircle } from 'lucide-react';

export default function Purchases({ showToast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [purchasesHistory, setPurchasesHistory] = useState([]);

  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [items, setItems] = useState([
    { fruit_id: '', packaging_size: 'medium', quantity: 10, unit_cost: 50.0 }
  ]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [suppliersRes, fruitsRes, purchasesRes] = await Promise.all([
        api.getSuppliers(),
        api.getFruits(),
        api.getPurchases()
      ]);
      setSuppliers(suppliersRes.data || []);
      setFruits(fruitsRes.data || []);
      setPurchasesHistory(purchasesRes.data || []);
    } catch (err) {
      showToast('Error loading purchase dependencies: ' + err.message, 'error');
    }
  }

  function handleAddItem() {
    setItems([
      ...items,
      { fruit_id: '', packaging_size: 'medium', quantity: 10, unit_cost: 50.0 }
    ]);
  }

  function handleRemoveItem(index) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function handleItemChange(index, field, value) {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  }

  const calculatedTotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    return acc + qty * cost;
  }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supplierId) {
      showToast('Please select a supplier.', 'warning');
      return;
    }

    const validItems = items.filter((item) => item.fruit_id && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('Please specify at least one valid fruit item with positive quantity.', 'warning');
      return;
    }

    try {
      const payload = {
        supplier_id: parseInt(supplierId, 10),
        purchase_date: purchaseDate || undefined,
        items: validItems.map((item) => ({
          fruit_id: parseInt(item.fruit_id, 10),
          packaging_size: item.packaging_size,
          quantity: parseInt(item.quantity, 10),
          unit_cost: parseFloat(item.unit_cost)
        }))
      };

      const res = await api.createPurchase(payload);
      showToast(`Purchase recorded successfully! Total: M ${parseFloat(res.data.total_amount).toFixed(2)}`, 'success');

      // Reset form
      setSupplierId('');
      setPurchaseDate('');
      setItems([{ fruit_id: '', packaging_size: 'medium', quantity: 10, unit_cost: 50.0 }]);
      
      // Reload history
      const historyRes = await api.getPurchases();
      setPurchasesHistory(historyRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Record Sourcing Purchase (Stock In)</h2>
          <p className="text-muted">Record bulk shipments from South African suppliers with automatic cost calculations and stock increments</p>
        </div>
      </div>

      <div className="grid-2col">
        {/* Form Card */}
        <div className="card">
          <div className="card-header">
            <h3> Purchase Entry Form</h3>
            <span className="badge badge-primary">MySQL Transaction</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select SA Supplier *</label>
                <select
                  className="form-control"
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.business_name} ({s.province})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Purchase Date</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              {/* Items Section */}
              <div className="items-section">
                <div className="items-header">
                  <h4>Fruit Items in this Shipment</h4>
                  <button type="button" className="btn btn-xs btn-outline" onClick={handleAddItem}>
                    <PlusCircle size={12} /> Add Item
                  </button>
                </div>

                <div className="items-container">
                  {items.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <select
                        className="form-control"
                        required
                        value={item.fruit_id}
                        onChange={(e) => handleItemChange(idx, 'fruit_id', e.target.value)}
                      >
                        <option value="">-- Select Fruit --</option>
                        {fruits.map((f) => (
                          <option key={f.fruit_id} value={f.fruit_id}>
                            {f.fruit_name}
                          </option>
                        ))}
                      </select>

                      <select
                        className="form-control"
                        value={item.packaging_size}
                        onChange={(e) => handleItemChange(idx, 'packaging_size', e.target.value)}
                      >
                        <option value="small">Small Box</option>
                        <option value="medium">Medium Box</option>
                        <option value="large">Large Box</option>
                      </select>

                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        placeholder="Boxes"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        required
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        placeholder="Cost (M)"
                        value={item.unit_cost}
                        onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                        required
                      />

                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-row"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-summary mt-4">
                <div className="summary-row">
                  <span>Total Purchase Cost:</span>
                  <strong className="total-amount-display">
                    M {calculatedTotal.toFixed(2)}
                  </strong>
                </div>
                <p className="text-sm text-muted">
                  Total is automatically calculated based on quantity and unit cost.
                </p>
              </div>

              <div className="form-actions mt-4">
                <button type="submit" className="btn btn-primary btn-block">
                  Confirm Purchase & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Purchase History Card */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Purchases History</h3>
            <span className="text-muted text-sm">Audit trail</span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Supplier</th>
                    <th>Date</th>
                    <th>Boxes</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasesHistory.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted">No purchase records yet.</td></tr>
                  ) : (
                    purchasesHistory.slice(0, 8).map((p) => (
                      <tr key={p.purchase_id}>
                        <td>{p.purchase_id}</td>
                        <td>
                          <strong>{p.supplier_name}</strong>
                          <br />
                          <small className="text-muted">{p.supplier_province}</small>
                        </td>
                        <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                        <td><span className="badge badge-info">{p.total_boxes} boxes</span></td>
                        <td><strong>M {parseFloat(p.total_amount).toFixed(2)}</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
