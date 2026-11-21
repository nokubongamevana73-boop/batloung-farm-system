import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { PlusCircle, Search } from 'lucide-react';

const LESOTHO_LOCATIONS = [
  'Maseru - Pitso Ground Taxi Rank',
  'Maseru - Lancers Inn Area',
  'Maseru - Main North Road Market',
  'Maseru - Maseru Bridge Border Post Area',
  'Leribe (Hlotse) - Leribe Main Market',
  'Leribe (Hlotse) - Hlotse Taxi Rank',
  'Berea - Teyateyaneng (TY) Market',
  'Mafeteng - Mafeteng Town Market',
  'Mafeteng - Mafeteng Taxi Rank',
  "Mohale's Hoek - Town Centre Market",
  'Quthing - Moyeni Market',
  "Qacha's Nek - Town Market",
  'Mokhotlong - Main Market',
  'Thaba-Tseka - Town Centre Market',
  'Butha-Buthe - Town Market',
  'Semonkong - Local Market',
  'Maputsoe - Industrial Area Market',
  'Roma - Roma Valley Market',
  'Other - Maseru District',
  'Other - Leribe District',
  'Other - Berea District',
  'Other - Mafeteng District',
  "Other - Mohale's Hoek District",
  'Other - Quthing District',
  "Other - Qacha's Nek District",
  'Other - Mokhotlong District',
  'Other - Thaba-Tseka District',
  'Other - Butha-Buthe District',
];

export default function Vendors({ onSelectVendor, showToast }) {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    vendor_name: '',
    phone_number: '',
    location: '',
    registration_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      const res = await api.getVendorBalances();
      setVendors(res.data || []);
    } catch (err) {
      showToast('Error loading vendors: ' + err.message, 'error');
    }
  }

  async function handleSearch(term) {
    setSearchTerm(term);
    if (!term.trim()) {
      loadVendors();
      return;
    }

    try {
      const res = await api.searchVendors(term.trim());
      setVendors(res.data || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.createVendor(newVendor);
      showToast('Vendor registered successfully!', 'success');
      setIsModalOpen(false);
      setNewVendor({
        vendor_name: '',
        phone_number: '',
        location: '',
        registration_date: new Date().toISOString().split('T')[0]
      });
      loadVendors();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Vendors &amp; Outstanding Credit Ledger</h2>
          <p className="text-muted">Manage Lesotho street vendors, track credit limits, and outstanding balances</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={14} /> Register New Vendor
        </button>
      </div>

      {/* Search Bar */}
      <div className="card search-card mb-4">
        <div className="card-body search-body">
          <div className="search-input-group">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search vendor by name, phone (+266...), or location..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {searchTerm && (
            <button className="btn btn-secondary" onClick={() => handleSearch('')}>
              Clear Search
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Registered Vendors &amp; Balance Summary</h3>
          <span className="badge badge-info">Advanced Payment Logic</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor ID</th>
                  <th>Vendor Name</th>
                  <th>Phone</th>
                  <th>Location in Lesotho</th>
                  <th>Orders</th>
                  <th>Total Invoiced</th>
                  <th>Total Paid</th>
                  <th>Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr><td colSpan="8" className="text-center text-muted">No vendors found.</td></tr>
                ) : (
                  vendors.map((v) => {
                    const balance = parseFloat(v.outstanding_balance || 0);
                    return (
                      <tr key={v.vendor_id}>
                        <td>#{v.vendor_id}</td>
                        <td><strong>{v.vendor_name}</strong></td>
                        <td>{v.phone_number}</td>
                        <td>{v.location}</td>
                        <td>{v.total_orders || 0}</td>
                        <td>M {parseFloat(v.total_invoiced || 0).toFixed(2)}</td>
                        <td>M {parseFloat(v.total_paid || 0).toFixed(2)}</td>
                        <td>
                          <strong className={balance > 0 ? 'text-amber' : 'text-success'}>
                            M {balance.toFixed(2)}
                          </strong>
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

      {/* Modal: Add Vendor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Lesotho Vendor"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Vendor Name / Business *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Ntate Lerato Fruit Kiosk"
                value={newVendor.vendor_name}
                onChange={(e) => setNewVendor({ ...newVendor, vendor_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="enter your number"
                value={newVendor.phone_number}
                onChange={(e) => setNewVendor({ ...newVendor, phone_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Location in Lesotho *</label>
              <select
                className="form-control"
                required
                value={newVendor.location}
                onChange={(e) => setNewVendor({ ...newVendor, location: e.target.value })}
              >
                <option value=""> Select Location </option>
                {LESOTHO_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Registration Date</label>
              <input
                type="date"
                className="form-control"
                value={newVendor.registration_date}
                onChange={(e) => setNewVendor({ ...newVendor, registration_date: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Vendor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
