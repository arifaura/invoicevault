import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  RiDashboardLine, 
  RiFileList2Line,
  RiUserLine,
  RiSettings4Line 
} from 'react-icons/ri';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { BiAnalyse } from 'react-icons/bi';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: <RiDashboardLine size={20} />
    },
    {
      path: '/dashboard/invoices',
      name: 'Invoices',
      icon: <RiFileList2Line size={20} />
    },
    {
      path: '/dashboard/settings',
      name: 'Settings',
      icon: <RiSettings4Line size={20} />
    }
  ];

  return (
    <aside className={`dashboard-sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="upgrade-pro">
          <p className="upgrade-text">Upgrade to Pro</p>
          <p className="upgrade-subtext">Access all features</p>
          <button className="btn btn-upgrade">Upgrade</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 