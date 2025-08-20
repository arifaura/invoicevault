import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MobileNav from '../MobileNav/MobileNav';
import './DashboardLayout.css';
import { useAuth } from '../../context/AuthContext';
import { ProfileProvider } from '../../context/ProfileContext';
import { useUpgrade } from '../../context/UpgradeContext';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { isUpgradeModalOpen } = useUpgrade();
  
  // console.log('Dashboard Layout:', { user, isAuthenticated, isUpgradeModalOpen });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ProfileProvider>
      <div className="dashboard-container">
        <Header onMenuClick={toggleSidebar} />
        <div className="dashboard-content">
          <Sidebar isOpen={isSidebarOpen} />
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