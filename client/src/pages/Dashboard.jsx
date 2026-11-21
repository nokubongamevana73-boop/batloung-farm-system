import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DollarSign, Package, Clock, Truck, AlertTriangle, Trophy } from 'lucide-react';

export default function Dashboard({ onNavigate, showToast }) {
  const [metrics, setMetrics] = useState({
    total_revenue: 0,
    total_boxes_in_stock: 0,
    total_outstanding_credit: 0,
    total_expenses: 0
  });
  const [lowStockList, setLowStockList] = useState([]);
  const [topFruits, setTopFruits] = useState([]);
  const [topVendor, setTopVendor] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [metricsRes, lowStockRes, topFruitsRes, topVendorRes, salesRes] = await Promise.allSettled([
        api.getDashboard(),
        api.getLowStock(15),
        api.getTopFruits(5),
        api.getTopVendor(),
        api.getSales()
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value.data) {
        setMetrics(metricsRes.value.data);
      }
      if (lowStockRes.status === 'fulfilled' && lowStockRes.value.data) {
        setLowStockList(lowStockRes.value.data);
      }
      if (topFruitsRes.status === 'fulfilled' && topFruitsRes.value.data) {
        setTopFruits(topFruitsRes.value.data);
      }
      if (topVendorRes.status === 'fulfilled' && topVendorRes.value.data) {
        setTopVendor(topVendorRes.value.data);
      }
      if (salesRes.status === 'fulfilled' && salesRes.value.data) {
        setRecentSales(salesRes.value.data.slice(0, 6));
      }
    } catch (err) {
      showToast('Error loading dashboard: ' + err.message, 'error');
    } finally {
      setLoading(false);
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
      {/* Low Stock Warning Banner */}
      {lowStockList.length > 0 && (
        <div className="alert-banner warning-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <div>
              <strong>Low Stock Warning: </strong>
              <span>
                {lowStockList.length} fruit packaging sizes are low in stock (
                {lowStockList.slice(0, 3).map((item) => `${item.fruit_name} [${item.packaging_size}: ${item.available_quantity}]`).join(', ')}
                {lowStockList.length > 3 ? '...' : ''}
              </span>
            </div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={() => onNavigate('stock')}>
            Inspect Stock
          </button>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Sales Revenue</span>
            <DollarSign size={20} className="text-success" />
          </div>
          <div className="metric-value">
            M {parseFloat(metrics.total_revenue || 0).toLocaleString('en-LS', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-sub">Distributions to Lesotho vendors</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Available Stock</span>
            <Package size={20} className="text-primary" />
          </div>
          <div className="metric-value">{metrics.total_boxes_in_stock || 0} boxes</div>
          <div className="metric-sub">Small, Medium & Large combined</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Vendor Credit Outstanding</span>
            <Clock size={20} className="text-amber" />
          </div>
          <div className="metric-value text-amber">
            M {parseFloat(metrics.total_outstanding_credit || 0).toLocaleString('en-LS', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-sub">Unpaid & Partially paid balances</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Purchases Incurred</span>
            <Truck size={20} className="text-secondary" />
          </div>
          <div className="metric-value">
            M {parseFloat(metrics.total_expenses || 0).toLocaleString('en-LS', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-sub">Sourced from SA provinces</div>
        </div>
      </div>

      {/* -Column Section */}
      <div className="grid-2col mt-4">
        {/* Top Selling Fruits */}
        <div className="card">
          <div className="card-header">
            <h3> Top Selling Fruits</h3>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('reports')}>
              View Report
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fruit</th>
                    <th>Boxes Sold</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topFruits.length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted">No sales data yet.</td></tr>
                  ) : (
                    topFruits.map((item) => (
                      <tr key={item.fruit_id}>
                        <td><strong>{item.fruit_name}</strong></td>
                        <td><span className="badge badge-info">{item.total_boxes_sold} boxes</span></td>
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

        {/* Top Volume Vendor */}
        <div className="card">
          <div className="card-header">
            <h3> Highest Volume Vendor</h3>
            <span className="badge badge-success">Top Buyer</span>
          </div>
          <div className="card-body">
            {topVendor ? (
              <div style={{ padding: '8px 0' }}>
                <h4 style={{ fontSize: '18px', color: 'var(--dark)' }}>{topVendor.vendor_name}</h4>
                <p className="text-muted text-sm mt-1">{topVendor.location}</p>
                <p className="text-muted text-sm">{topVendor.phone_number}</p>
                <div className="metrics-grid mt-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ background: 'var(--slate-50)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div className="text-muted text-xs">Total Boxes Purchased</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                      {topVendor.total_boxes_purchased} boxes
                    </div>
                  </div>
                  <div style={{ background: 'var(--slate-50)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div className="text-muted text-xs">Total Spend</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dark)' }}>
                      M {parseFloat(topVendor.total_amount_spent || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted p-4">No vendor sales recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Ledger */}
      <div className="card mt-4">
        <div className="card-header">
          <h3> Recent Sales Transactions</h3>
          <button className="btn btn-xs btn-outline" onClick={() => onNavigate('sales')}>
            All Sales
          </button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr><td colSpan="7" className="text-center text-muted">No sales recorded yet.</td></tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.sale_id}>
                      <td><strong>#{sale.sale_id}</strong></td>
                      <td>{sale.vendor_name}</td>
                      <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                      <td>{sale.payment_method}</td>
                      <td>{renderPaymentBadge(sale.payment_status)}</td>
                      <td><strong>M {parseFloat(sale.total_amount).toFixed(2)}</strong></td>
                      <td className={sale.balance_remaining > 0 ? 'text-amber' : 'text-success'}>
                        M {parseFloat(sale.balance_remaining).toFixed(2)}
                      </td>
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
