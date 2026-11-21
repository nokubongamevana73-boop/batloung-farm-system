import React from 'react';
import { 
  BarChart3, 
  Apple, 
  Tractor, 
  Users, 
  ArrowDownToLine, 
  ShoppingCart, 
  FileText 
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, dbConnected }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard',icon:BarChart3},
    { id: 'stock', label: 'Fruits & Stock',icon:Apple},
    { id: 'suppliers', label: 'SA Suppliers',icon:Tractor},
    { id: 'vendors', label: 'Vendors & Credit',icon:Users},
    { id: 'purchases', label: 'Record Purchase',icon:ShoppingCart},
    { id: 'sales', label: 'Record Sale',icon:FileText  },
    { id: 'reports', label: 'Reports & Analytics',icon: ArrowDownToLine }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">🍏</div>
        <div className="brand-text">
          <h2>
            Batloung Farm
            <span className="react-badge">React</span>
          </h2>
          <span>Fresh Produce Distribution </span>
        </div>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <span className={`status-dot ${dbConnected ? 'connected' : 'disconnected'}`} />
          <span>{dbConnected ? 'MySQL: Connected' : 'MySQL: Offline'}</span>
        </div>
        <div className="course-info">
          <small>Batloung Farm Distribution</small>
          <small>Maseru, Lesotho</small>
        </div>
      </div>
    </aside>
  );
}
