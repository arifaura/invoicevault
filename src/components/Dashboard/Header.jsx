import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoNotificationsOutline } from "react-icons/io5";
import { RiUserLine, RiLogoutBoxLine } from "react-icons/ri";
import { BsSun, BsMoon } from "react-icons/bs";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import "./Header.css";

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, dnd, setDnd, requestDesktopPermission } =
    useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Get user display name
  const userDisplayName = useMemo(() => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.firstName) return `${profile.firstName} ${profile.lastName}`.trim();
    return 'User';
  }, [profile]);

  // Get avatar URL or fallback
  const avatarUrl = useMemo(() => {
    if (profile?.avatar_url) return profile.avatar_url;
    if (profile?.avatar) return profile.avatar;
    return null;
  }, [profile]);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <HiMenuAlt2 size={24} />
        </button>
        <Link to="/dashboard" className="header-logo">
          InvoiceVault
        </Link>
      </div>

      <div className="header-right">
        <button
          className="theme-toggle-button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme ? "light" : "dark"} mode`}
        >
          {theme ? <BsSun size={20} /> : <BsMoon size={20} />}
        </button>

        <div className="notification-wrapper">
          <button
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <IoNotificationsOutline size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
              <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                  <div className="notification-actions">
                    <button className="mark-all-read" onClick={markAllAsRead} disabled={unreadCount===0}>Mark all as read</button>
                    <button className="mark-all-read" onClick={clearNotifications} disabled={!notifications.length}>Clear</button>
                    <button className={`mark-all-read ${dnd?'active':''}`} onClick={() => setDnd(!dnd)}>{dnd ? 'DND On' : 'DND Off'}</button>
                    <button className="mark-all-read" onClick={requestDesktopPermission}>Desktop</button>
                  </div>
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${
                        !notification.read ? "unread" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="notification-icon">
                        {notification.icon}
                      </div>
                      <div className="notification-content">
                        <p className="notification-message">
                          {notification.message}
                        </p>
                        <span className="notification-time">
                          {new Date(
                            notification.timestamp
                          ).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-notifications">No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu-container">
          <button
            className="user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <div className="user-avatar">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="profile-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = ''; // Clear the source on error
                  }}
                />
              ) : (
                <RiUserLine size={20} />
              )}
            </div>
            <span className="user-name">{userDisplayName}</span>
          </button>

          {showUserMenu && (
            <div className="user-menu">
              <Link to="/dashboard/settings" className="user-menu-item">
                <RiUserLine size={18} />
                Profile
              </Link>
              <div className="menu-divider"></div>
              <button 
                className="user-menu-item text-danger"
                onClick={handleSignOut}
              >
                <RiLogoutBoxLine size={18} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
