import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaFileInvoiceDollar, 
  FaUsers, 
  FaTasks, 
  FaCog 
} from 'react-icons/fa';

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
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <Icon className="text-xl mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;