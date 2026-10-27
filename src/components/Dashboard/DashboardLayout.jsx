import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MobileNav from '../MobileNav/MobileNav';
import './DashboardLayout.css';
import { ProfileProvider } from '../../context/ProfileContext';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);

  const toggleSidebar = () => {
    setIsSidebarOpen((isOpen) => !isOpen);
  };

  return (
    <ProfileProvider>
      <div className="dashboard-container">
        <Header onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <div className="dashboard-content">
          {isSidebarOpen && (
            <button
              className="sidebar-backdrop"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close navigation menu"
              type="button"
            />
          )}
          <Sidebar
            isOpen={isSidebarOpen}
            onNavigate={() => {
              if (window.innerWidth <= 768) setIsSidebarOpen(false);
            }}
          />
          <main className={`main-content ${!isSidebarOpen ? 'expanded' : ''}`}>
            <div className="content-wrapper">
              <Outlet />
            </div>
            <Footer />
          </main>
        </div>
        <MobileNav />
      </div>
    </ProfileProvider>
  );
};

export default DashboardLayout; 