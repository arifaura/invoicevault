import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaFileInvoiceDollar, 
  FaUsers, 
  FaTasks, 
  FaCog 
} from 'react-icons/fa';
import './MobileNav.css';

const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: FaHome, label: 'Overview' },
    { path: '/dashboard/invoices', icon: FaFileInvoiceDollar, label: 'Invoices' },
    { path: '/dashboard/customers', icon: FaUsers, label: 'Customers' },
    { path: '/dashboard/tasks', icon: FaTasks, label: 'Tasks' },
    { path: '/dashboard/settings', icon: FaCog, label: 'Settings' },
  ];

  return (
    <nav className="mobile-nav md:hidden">
      <div className="mobile-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path === '/dashboard' && location.pathname === '/dashboard');
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <div className="mobile-nav-icon">
                <Icon className="nav-icon" />
                {isActive && <div className="active-indicator" />}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;