import React, { useState, useEffect } from 'react';
import { RefreshCw, PlusCircle } from 'lucide-react';

export default function Topbar({ activeTab, onRefresh, onNewSale }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const metaMap = {
    dashboard: ['Distribution Dashboard', 'Overview of Maseru fruit distribution operations & inventory'],
    stock: ['Fruits & Stock Levels', 'Separate inventory tracking for Small, Medium, and Large packaging sizes'],
    suppliers: ['South African Suppliers', 'Suppliers directory across South African provinces'],
    vendors: ['Vendors & Credit Ledger', 'Manage Lesotho street vendors and outstanding credit balances'],
    purchases: ['Record Sourcing Purchase', 'Record shipments from SA suppliers with automatic calculations'],
    sales: ['Record Distribution Sale', 'Record sales with automatic pricing, payments, and stock checks'],
    reports: ['Reports & Analytics', 'Distribution sales revenue, fruit sales volume, and stock balance analysis']
  };

  const [title, subtitle] = metaMap[activeTab] || ['Batloung Farm', ''];

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-actions">
        <span className="live-clock">{timeStr || '--:--:--'}</span>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
          <RefreshCw size={14} /> Refresh
        </button>
        <button className="btn btn-primary btn-sm" onClick={onNewSale}>
          <PlusCircle size={14} /> + New Sale
        </button>
      </div>
    </header>
  );
}
