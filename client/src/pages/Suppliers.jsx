import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { PlusCircle, Trash2 } from 'lucide-react';

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

export default function Suppliers({ showToast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    phone: '',
    province: '',
    address: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      const res = await api.getSuppliers();
      setSuppliers(res.data || []);
    } catch (err) {
      showToast('Error loading suppliers: ' + err.message, 'error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.createSupplier(formData);
      showToast('Supplier registered successfully!', 'success');
      setIsModalOpen(false);
      setFormData({
        business_name: '',
        contact_person: '',
        phone: '',
        province: '',
        address: ''
      });
      loadSuppliers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete supplier '${name}'? Deletion is rejected if purchase records are linked to this supplier.`)) {
      return;
    }

    try {
      const res = await api.deleteSupplier(id);
      showToast(res.message || 'Supplier deleted.', 'success');
      loadSuppliers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>South African Suppliers Directory</h2>
          <p className="text-muted">Suppliers across Free State, Gauteng, Western Cape, KwaZulu-Natal, Limpopo, etc.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={14} /> Register Supplier
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Business Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Province (SA)</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr><td colSpan="7" className="text-center text-muted">No suppliers registered.</td></tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.supplier_id}>
                      <td>{s.supplier_id}</td>
                      <td><strong>{s.business_name}</strong></td>
                      <td>{s.contact_person}</td>
                      <td>{s.phone}</td>
                      <td><span className="badge badge-primary">{s.province}</span></td>
                      <td className="text-sm">{s.address}</td>
                      <td>
                        <button
                          className="btn btn-xs btn-outline text-danger"
                          onClick={() => handleDelete(s.supplier_id, s.business_name)}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Add Supplier */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register South African Supplier"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Business Name *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Free State Gold Agro"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Contact Person *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Thabo Mokoena"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Province (South Africa) *</label>
              <select
                className="form-control"
                required
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              >
                <option value=""> Select Province </option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Physical Address *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder=""
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
