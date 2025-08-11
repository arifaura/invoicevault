import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiSettings, FiUsers, FiStar, FiCheckSquare } from 'react-icons/fi';
import { useUpgrade } from '../../context/UpgradeContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const upgradeContext = useUpgrade();

  useEffect(() => {
    // console.log('Sidebar mounted, upgrade context:', upgradeContext);
  }, [upgradeContext]);

  const handleUpgradeClick = (e) => {
    // console.log('Upgrade button clicked');
    e.preventDefault();
    e.stopPropagation();
    
    if (upgradeContext && typeof upgradeContext.openUpgradeModal === 'function') {
      // console.log('Calling openUpgradeModal');
      upgradeContext.openUpgradeModal();
    } else {
      console.error('openUpgradeModal is not a function:', upgradeContext);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: <FiHome size={20} />, label: 'Dashboard' },
    { path: '/dashboard/invoices', icon: <FiFileText size={20} />, label: 'Invoices' },
    { path: '/dashboard/customers', icon: <FiUsers size={20} />, label: 'Clients' },
    { path: '/dashboard/todo', icon: <FiCheckSquare size={20} />, label: 'Tasks' },
    { path: '/dashboard/settings', icon: <FiSettings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="logo">
          <h2>InvoiceVault</h2>
        </div>

        <nav className="menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button 
          className="upgrade-button"
          onClick={handleUpgradeClick}
          type="button"
        >
          <FiStar className="upgrade-icon" />
          <div className="upgrade-text">
            <span className="primary">Upgrade to Pro</span>
            <span className="secondary">Access all features ......</span>
            <button>Upgrade</button>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 