import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import FruitsStock from './pages/FruitsStock';
import Suppliers from './pages/Suppliers';
import Vendors from './pages/Vendors';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbConnected, setDbConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check DB health
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  async function checkHealth() {
    try {
      const res = await api.getHealth();
      setDbConnected(Boolean(res && res.database && res.database.connected));
    } catch {
      setDbConnected(false);
    }
  }

  function showToast(message, type = 'info') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }

  function handleRefresh() {
    setRefreshKey((prev) => prev + 1);
    checkHealth();
    showToast('Data refreshed!', 'info');
  }

  function renderPage() {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard key={refreshKey} onNavigate={setActiveTab} showToast={showToast} />;
      case 'stock':
        return <FruitsStock key={refreshKey} showToast={showToast} />;
      case 'suppliers':
        return <Suppliers key={refreshKey} showToast={showToast} />;
      case 'vendors':
        return <Vendors key={refreshKey} showToast={showToast} />;
      case 'purchases':
        return <Purchases key={refreshKey} showToast={showToast} />;
      case 'sales':
        return <Sales key={refreshKey} showToast={showToast} />;
      case 'reports':
        return <Reports key={refreshKey} showToast={showToast} />;
      default:
        return <Dashboard key={refreshKey} onNavigate={setActiveTab} showToast={showToast} />;
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dbConnected={dbConnected}
      />

      <main className="main-content">
        <Topbar
          activeTab={activeTab}
          onRefresh={handleRefresh}
          onNewSale={() => setActiveTab('sales')}
        />

        {renderPage()}
      </main>

      <Toast toasts={toasts} />
    </div>
  );
}
