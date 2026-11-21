import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { PlusCircle, AlertTriangle } from 'lucide-react';

export default function Sales({ showToast }) {
  const [vendors, setVendors] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [stock, setStock] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);

  const [vendorId, setVendorId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [items, setItems] = useState([
    { fruit_id: '', packaging_size: 'medium', quantity: 5, unit_price: 110.0 }
  ]);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSale, setPaymentSale] = useState(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('Cash');

  useEffect(() => {
    loadDependencies();
  }, []);

  async function loadDependencies() {
    try {
      const [vendorsRes, fruitsRes, stockRes, salesRes] = await Promise.all([
        api.getVendorBalances(),
        api.getFruits(),
        api.getStock(),
        api.getSales()
      ]);
      setVendors(vendorsRes.data || []);
      setFruits(fruitsRes.data || []);
      setStock(stockRes.data || []);
      setSalesHistory(salesRes.data || []);
    } catch (err) {
      showToast('Error loading sales dependencies: ' + err.message, 'error');
    }
  }

  const selectedVendor = vendors.find((v) => v.vendor_id === parseInt(vendorId, 10));

  function handleAddItem() {
    setItems([
      ...items,
      { fruit_id: '', packaging_size: 'medium', quantity: 5, unit_price: 110.0 }
    ]);
  }

  function handleRemoveItem(index) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function handleItemChange(index, field, value) {
    const updated = [...items];
    updated[index][field] = value;

    // Default prices based on packaging size
    if (field === 'packaging_size') {
      const priceMap = { small: 65.0, medium: 110.0, large: 165.0 };
      updated[index].unit_price = priceMap[value] || 110.0;
    }

    setItems(updated);
  }

  const calculatedTotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return acc + qty * price;
  }, 0);

  // Check if any item exceeds available stock
  let stockWarning = null;
  items.forEach((item) => {
    if (item.fruit_id && item.packaging_size && item.quantity > 0) {
      const entry = stock.find(
        (s) => s.fruit_id === parseInt(item.fruit_id, 10) && s.packaging_size.toLowerCase() === item.packaging_size.toLowerCase()
      );
      const avail = entry ? entry.available_quantity : 0;
      if (item.quantity > avail) {
        const fruit = fruits.find((f) => f.fruit_id === parseInt(item.fruit_id, 10));
        const fruitName = fruit ? fruit.fruit_name : 'Fruit';
        stockWarning = `Requested ${item.quantity} ${item.packaging_size} boxes of ${fruitName}, but only ${avail} boxes are available! The transaction will be rejected if submitted.`;
      }
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vendorId) {
      showToast('Please select a registered vendor.', 'warning');
      return;
    }

    const validItems = items.filter((item) => item.fruit_id && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('Please specify at least one fruit item.', 'warning');
      return;
    }

    try {
      const payload = {
        vendor_id: parseInt(vendorId, 10),
        payment_method: paymentMethod,
        amount_paid: amountPaid !== '' ? parseFloat(amountPaid) : undefined,
        items: validItems.map((item) => ({
          fruit_id: parseInt(item.fruit_id, 10),
          packaging_size: item.packaging_size,
          quantity: parseInt(item.quantity, 10),
          unit_price: parseFloat(item.unit_price)
        }))
      };

      const res = await api.createSale(payload);
      showToast(`Sale recorded successfully! Total: M ${parseFloat(res.data.total_amount).toFixed(2)} (${res.data.payment_status})`, 'success');

      // Reset
      setVendorId('');
      setAmountPaid('');
      setItems([{ fruit_id: '', packaging_size: 'medium', quantity: 5, unit_price: 110.0 }]);
      loadDependencies();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function openPaymentModal(sale) {
    setPaymentSale(sale);
    setPaymentAmountInput(parseFloat(sale.balance_remaining).toFixed(2));
    setPaymentMethodInput('Cash');
    setIsPaymentModalOpen(true);
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    if (!paymentSale) return;

    try {
      const res = await api.recordPayment(paymentSale.sale_id, {
        payment_amount: parseFloat(paymentAmountInput),
        payment_method: paymentMethodInput
      });
      showToast('Payment recorded successfully! Status: ' + res.data.payment_status, 'success');
      setIsPaymentModalOpen(false);
      loadDependencies();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const renderPaymentBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-success">PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-warning">PARTIAL</span>;
      case 'UNPAID':
        return <span className="badge badge-danger">UNPAID</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Record Distribution Sale (Stock Out)</h2>
          <p className="text-muted">Record sales to Lesotho vendors with automatic selling price calculation and strict stock validation</p>
        </div>
      </div>

      <div className="grid-2col">
        {/* Sale Entry Form */}
        <div className="card">
          <div className="card-header">
            <h3>New Sale Order Form</h3>
            <span className="badge badge-success">Atomic Check</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Registered Vendor *</label>
                <select
                  className="form-control"
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.vendor_id} value={v.vendor_id}>
                      {v.vendor_name} ({v.location})
                    </option>
                  ))}
                </select>
                {selectedVendor && parseFloat(selectedVendor.outstanding_balance || 0) > 0 && (
                  <div className="alert-banner warning-banner mt-2" style={{ padding: '8px 12px', fontSize: '12.5px' }}>
                    Note: Vendor has an outstanding balance of <strong>M {parseFloat(selectedVendor.outstanding_balance).toFixed(2)}</strong>.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    if (e.target.value === 'Credit') {
                      setAmountPaid('0.00');
                    }
                  }}
                >
                  <option value="Cash">Cash (Immediate Payment)</option>
                  <option value="Mobile Money">Mobile Money (M-Pesa / EcoCash)</option>
                  <option value="Credit">Outstanding Payment (Credit)</option>
                </select>
              </div>

              {/* Items Section */}
              <div className="items-section">
                <div className="items-header">
                  <h4>Fruit Items Requested</h4>
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
                        placeholder="Price (M)"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
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

              <div className="form-group mt-3">
                <label>Amount Paid (M / LSL)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="Defaults to total for Cash/Mobile Money, 0 for Credit"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
                <small className="text-muted">Status is automatically evaluated as PAID, PARTIALLY_PAID, or UNPAID.</small>
              </div>

              <div className="form-summary mt-4">
                <div className="summary-row">
                  <span>Total Selling Price:</span>
                  <strong className="total-amount-display text-success">
                    M {calculatedTotal.toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Stock Warning Box */}
              {stockWarning && (
                <div className="alert-banner warning-banner mt-3" style={{ fontSize: '12.5px' }}>
                  <AlertTriangle size={16} />
                  <span>{stockWarning}</span>
                </div>
              )}

              <div className="form-actions mt-4">
                <button type="submit" className="btn btn-primary btn-block">
                  Confirm Sale & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sales History Card */}
        <div className="card">
          <div className="card-header">
            <h3>Distribution Sales Ledger</h3>
            <span className="text-muted text-sm">Ledger</span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Vendor</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted">No sales recorded yet.</td></tr>
                  ) : (
                    salesHistory.map((s) => {
                      const balance = parseFloat(s.balance_remaining || 0);
                      return (
                        <tr key={s.sale_id}>
                          <td><strong>{s.sale_id}</strong></td>
                          <td>
                            <strong>{s.vendor_name}</strong>
                            <br />
                            <small className="text-muted">{s.location}</small>
                          </td>
                          <td>M {parseFloat(s.total_amount).toFixed(2)}</td>
                          <td>M {parseFloat(s.amount_paid).toFixed(2)}</td>
                          <td>{renderPaymentBadge(s.payment_status)}</td>
                          <td>
                            {balance > 0 ? (
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() => openPaymentModal(s)}
                              >
                                Pay
                              </button>
                            ) : (
                              <span className="text-xs text-success">Cleared</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Vendor Payment"
      >
        {paymentSale && (
          <form onSubmit={handleRecordPayment}>
            <div className="modal-body">
              <div className="form-group">
                <label>Sale ID</label>
                <input
                  type="text"
                  className="form-control"
                  readOnly
                  value={`Sale #${paymentSale.sale_id} - ${paymentSale.vendor_name}`}
                />
              </div>
              <div className="form-group">
                <label>Outstanding Balance</label>
                <input
                  type="text"
                  className="form-control"
                  readOnly
                  value={`M ${parseFloat(paymentSale.balance_remaining).toFixed(2)}`}
                />
              </div>
              <div className="form-group">
                <label>Payment Amount (M / LSL) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentSale.balance_remaining}
                  className="form-control"
                  required
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  className="form-control"
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Mobile Money">Mobile Money (M-Pesa / EcoCash)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Record Payment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
