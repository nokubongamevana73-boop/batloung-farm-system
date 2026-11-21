import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FileText, Search } from 'lucide-react';

export default function Reports({ showToast }) {
  const [topFruits, setTopFruits] = useState([]);
  const [topVendor, setTopVendor] = useState(null);
  const [stockLevels, setStockLevels] = useState([]);

  // Date range state for Query 2
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [revenueSummary, setRevenueSummary] = useState({
    total_sales_transactions: 0,
    total_sales_revenue: 0,
    total_cash_collected: 0,
    total_outstanding_credit: 0
  });

  useEffect(() => {
    loadAllReports();
  }, []);

  async function loadAllReports() {
    try {
      const [fruitsRes, vendorRes, stockRes] = await Promise.all([
        api.getTopFruits(5),
        api.getTopVendor(),
        api.getStockLevels()
      ]);
      setTopFruits(fruitsRes.data || []);
      setTopVendor(vendorRes.data || null);
      setStockLevels(stockRes.data || []);
      loadRevenueReport();
    } catch (err) {
      showToast('Error loading reports: ' + err.message, 'error');
    }
  }

  async function loadRevenueReport() {
    try {
      const res = await api.getRevenue(startDate, endDate);
      if (res.data && res.data.summary) {
        setRevenueSummary(res.data.summary);
      }
    } catch (err) {
      showToast('Error loading revenue query: ' + err.message, 'error');
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p className="text-muted">Business intelligence, sales performance, and inventory movement analytics</p>
        </div>
      </div>

      {/* Report 1: Top 5 Fruits */}
      <div className="card report-card mb-4">
        <div className="card-header">
          <div>
            <h3>Top Selling Fruits</h3>
            <p className="text-sm text-muted">Ranked by total quantity of boxes sold across all packaging sizes</p>
          </div>
          <span className="badge badge-primary">Volume Analysis</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Fruit Name</th>
                  <th>Description</th>
                  <th>Total Boxes Sold</th>
                  <th>Orders Count</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topFruits.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted">No sales data.</td></tr>
                ) : (
                  topFruits.map((item, idx) => (
                    <tr key={item.fruit_id}>
                      <td><span className={`badge ${idx === 0 ? 'badge-warning' : 'badge-info'}`}>#{idx + 1}</span></td>
                      <td><strong>{item.fruit_name}</strong></td>
                      <td className="text-sm text-muted">{item.description || '-'}</td>
                      <td><span className="badge badge-success" style={{ fontSize: '12px' }}>{item.total_boxes_sold} boxes</span></td>
                      <td>{item.total_orders_count} orders</td>
                      <td><strong>M {parseFloat(item.total_revenue_generated || 0).toFixed(2)}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Revenue Range Filter */}
      <div className="card report-card mb-4">
        <div className="card-header">
          <div>
            <h3>Sales Revenue by Date Range</h3>
            <p className="text-sm text-muted">Filters total revenue, cash collected, and outstanding credit</p>
          </div>
          <span className="badge badge-primary">Financial Summary</span>
        </div>
        <div className="card-body">
          <div className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Start Date:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto', display: 'inline-block' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label style={{ fontSize: '13px', fontWeight: 600, marginLeft: '8px' }}>End Date:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto', display: 'inline-block' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button className="btn btn-sm btn-primary" onClick={loadRevenueReport}>
              <Search size={14} /> Run Revenue Query
            </button>
          </div>

          <div className="metrics-grid mb-3">
            <div className="metric-card">
              <div className="metric-header"><span className="metric-title">Sales Count</span></div>
              <div className="metric-value text-sm">{revenueSummary.total_sales_transactions || 0} orders</div>
            </div>
            <div className="metric-card">
              <div className="metric-header"><span className="metric-title">Total Revenue</span></div>
              <div className="metric-value text-sm">
                M {parseFloat(revenueSummary.total_sales_revenue || 0).toFixed(2)}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-header"><span className="metric-title">Cash Collected</span></div>
              <div className="metric-value text-sm text-success">
                M {parseFloat(revenueSummary.total_cash_collected || 0).toFixed(2)}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-header"><span className="metric-title">Outstanding Credit</span></div>
              <div className="metric-value text-sm text-amber">
                M {parseFloat(revenueSummary.total_outstanding_credit || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customer */}
      <div className="card report-card mb-4">
        <div className="card-header">
          <div>
            <h3>Highest Volume Vendor</h3>
            <p className="text-sm text-muted">Identifies the highest purchasing retailer or street vendor in Lesotho</p>
          </div>
          <span className="badge badge-primary">Key Account</span>
        </div>
        <div className="card-body">
          {topVendor ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', color: 'var(--dark)' }}>{topVendor.vendor_name}</h3>
                <p className="text-muted mt-1"> {topVendor.location}</p>
                <p className="text-muted"> {topVendor.phone_number}</p>
                <small className="text-muted">Registered: {new Date(topVendor.registration_date).toLocaleDateString()}</small>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ background: 'var(--slate-50)', border: '1px solid var(--border)', padding: '14px 20px', borderRadius: '8px', textAlign: 'center' }}>
                  <span className="text-muted text-xs uppercase" style={{ fontWeight: 700 }}>Total Boxes Purchased</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{topVendor.total_boxes_purchased} boxes</div>
                </div>
                <div style={{ background: 'var(--slate-50)', border: '1px solid var(--border)', padding: '14px 20px', borderRadius: '8px', textAlign: 'center' }}>
                  <span className="text-muted text-xs uppercase" style={{ fontWeight: 700 }}>Total Orders</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-700)' }}>{topVendor.total_purchases_count}</div>
                </div>
                <div style={{ background: 'var(--slate-50)', border: '1px solid var(--border)', padding: '14px 20px', borderRadius: '8px', textAlign: 'center' }}>
                  <span className="text-muted text-xs uppercase" style={{ fontWeight: 700 }}>Total Spend</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--dark)' }}>M {parseFloat(topVendor.total_amount_spent || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted p-4">No vendor purchases found.</div>
          )}
        </div>
      </div>

      {/* Stock Levels Breakdown */}
      <div className="card report-card">
        <div className="card-header">
          <div>
            <h3>Current Stock Levels by Packaging Size</h3>
            <p className="text-sm text-muted">Separate tracking for Small, Medium, and Large boxes</p>
          </div>
          <span className="badge badge-primary">Stock Status</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stock ID</th>
                  <th>Fruit</th>
                  <th>Packaging Size</th>
                  <th>Available Quantity</th>
                  <th>Status</th>
                  <th>Last Movement</th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted">No stock data found.</td></tr>
                ) : (
                  stockLevels.map((s) => (
                    <tr key={s.stock_id}>
                      <td>{s.stock_id}</td>
                      <td><strong>{s.fruit_name}</strong></td>
                      <td><span className={`pkg-badge pkg-${s.packaging_size}`}>{s.packaging_size}</span></td>
                      <td><strong style={{ fontSize: '14.5px' }}>{s.available_quantity} boxes</strong></td>
                      <td>
                        {s.available_quantity <= 15 ? (
                          <span className="badge badge-warning">Low</span>
                        ) : (
                          <span className="badge badge-success">OK</span>
                        )}
                      </td>
                      <td className="text-sm text-muted">{new Date(s.updated_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
