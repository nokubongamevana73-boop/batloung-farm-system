import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { PlusCircle, Filter } from 'lucide-react';

export default function FruitsStock({ showToast }) {
  const [fruits, setFruits] = useState([]);
  const [stock, setStock] = useState([]);
  const [isLowStockOnly, setIsLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFruit, setNewFruit] = useState({
    fruit_name: '',
    description: '',
    status: 'Available'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [fruitsRes, stockRes] = await Promise.all([
        api.getFruits(),
        api.getStock()
      ]);
      setFruits(fruitsRes.data || []);
      setStock(stockRes.data || []);
    } catch (err) {
      showToast('Error loading stock: ' + err.message, 'error');
    }
  }

  async function handleSubmitFruit(e) {
    e.preventDefault();
    if (!newFruit.fruit_name.trim()) return;

    try {
      await api.createFruit(newFruit);
      showToast(`Fruit '${newFruit.fruit_name}' registered successfully!`, 'success');
      setIsModalOpen(false);
      setNewFruit({ fruit_name: '', description: '', status: 'Available' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const filteredStock = isLowStockOnly
    ? stock.filter((s) => s.available_quantity <= 15)
    : stock;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Fruit Types & Packaging Stock Levels</h2>
          <p className="text-muted">Separate inventory tracking for Small, Medium, and Large packaging sizes</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${isLowStockOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsLowStockOnly(!isLowStockOnly)}
          >
            <Filter size={14} />
            {isLowStockOnly ? 'Show All Stock' : 'Show Low Stock Only (≤15)'}
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <PlusCircle size={14} /> Register New Fruit
          </button>
        </div>
      </div>

      {/* Fruit Stock Cards Matrix */}
      <div className="fruit-stock-grid">
        {fruits.map((f) => {
          const getQty = (size) => {
            const entry = stock.find(
              (s) => s.fruit_id === f.fruit_id && s.packaging_size.toLowerCase() === size
            );
            return entry ? entry.available_quantity : 0;
          };

          const small = getQty('small');
          const medium = getQty('medium');
          const large = getQty('large');
          const totalBoxes = small + medium + large;
          const hasLow = small < 15 || medium < 15 || large < 15;

          return (
            <div key={f.fruit_id} className="fruit-stock-card">
              <div className="fruit-card-header">
                <div>
                  <div className="fruit-card-title">{f.fruit_name}</div>
                  <p className="text-muted text-sm mt-1">{f.description || 'No description'}</p>
                </div>
                <span className={`badge ${f.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>
                  {f.status}
                </span>
              </div>

              <div className="stock-pill-row">
                <div className={`stock-pill ${small < 15 ? 'low-stock' : ''}`}>
                  <div className="stock-pill-size">Small</div>
                  <div className="stock-pill-qty">{small}</div>
                  <small className="text-muted">boxes</small>
                </div>
                <div className={`stock-pill ${medium < 15 ? 'low-stock' : ''}`}>
                  <div className="stock-pill-size">Medium</div>
                  <div className="stock-pill-qty">{medium}</div>
                  <small className="text-muted">boxes</small>
                </div>
                <div className={`stock-pill ${large < 15 ? 'low-stock' : ''}`}>
                  <div className="stock-pill-size">Large</div>
                  <div className="stock-pill-qty">{large}</div>
                  <small className="text-muted">boxes</small>
                </div>
              </div>

              <div className="mt-3 text-sm text-muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total: <strong>{totalBoxes} boxes</strong></span>
                {hasLow ? (
                  <span className="text-amber" style={{ fontWeight: 600 }}>⚠️ Low Box Inventory</span>
                ) : (
                  <span className="text-success">✓ Stock healthy</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Stock Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3>Detailed Stock Balance Table</h3>
          <span className="text-muted text-sm">Maintains separate balances for Small, Medium & Large</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fruit Name</th>
                  <th>Packaging Size</th>
                  <th>Available Quantity (Boxes)</th>
                  <th>Status Indicator</th>
                  <th>Fruit Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted">No stock records found.</td></tr>
                ) : (
                  filteredStock.map((s) => (
                    <tr key={s.stock_id}>
                      <td><strong>{s.fruit_name}</strong></td>
                      <td><span className={`pkg-badge pkg-${s.packaging_size}`}>{s.packaging_size}</span></td>
                      <td><strong style={{ fontSize: '15px' }}>{s.available_quantity} boxes</strong></td>
                      <td>
                        {s.available_quantity <= 15 ? (
                          <span className="badge badge-danger">Low Stock (≤15)</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td>{s.fruit_status || 'Available'}</td>
                      <td className="text-sm text-muted">{new Date(s.updated_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Register Fruit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Fruit Type"
      >
        <form onSubmit={handleSubmitFruit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Fruit Name *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Peaches, Strawberries, Avocados"
                value={newFruit.fruit_name}
                onChange={(e) => setNewFruit({ ...newFruit, fruit_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Variety, origin, and grade notes"
                value={newFruit.description}
                onChange={(e) => setNewFruit({ ...newFruit, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Status *</label>
              <select
                className="form-control"
                value={newFruit.status}
                onChange={(e) => setNewFruit({ ...newFruit, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Discontinued">Discontinued</option>
              </select>
            </div>
            <p className="text-sm text-muted">
              Stock records for Small, Medium, and Large packaging sizes will automatically be initialized to 0.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Fruit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
