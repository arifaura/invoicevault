import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoNotificationsOutline } from "react-icons/io5";
import { RiUserLine, RiLogoutBoxLine, RiFileListLine } from "react-icons/ri";
import { BsSun, BsMoon } from "react-icons/bs";
import { FiX, FiTrash2, FiDownload, FiAlertTriangle, FiCamera, FiSave, FiLock } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import "./Header.css";

const getNotificationIcon = (iconName) => {
  switch (iconName) {
    case 'invoice-success':
    case 'success':
      return <RiFileListLine size={16} />;
    case 'invoice-error':
    case 'error':
      return <FiX size={16} />;
    case 'trash':
      return <FiTrash2 size={16} />;
    case 'download':
      return <FiDownload size={16} />;
    case 'warning':
      return <FiAlertTriangle size={16} />;
    case 'camera':
      return <FiCamera size={16} />;
    case 'save':
      return <FiSave size={16} />;
    case 'lock':
      return <FiLock size={16} />;
    default:
      return '📢';
  }
};

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, dnd, setDnd, requestDesktopPermission, addNotification } =
    useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/'); // Redirect to home page instead of login
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

  // Handle notification toggle with error handling
  const handleNotificationToggle = () => {
    try {
      console.log('Toggling notifications. Current state:', showNotifications);
      console.log('Notifications data:', notifications);
      console.log('Unread count:', unreadCount);
      setShowNotifications(!showNotifications);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setShowNotifications(false);
    }
  };

  // Safe notification rendering with fallback
  const renderNotifications = () => {
    try {
      console.log('Notifications data:', notifications); // Debug log

      if (!notifications || !Array.isArray(notifications)) {
        console.log('Notifications is not an array:', notifications);
        return (
          <div className="no-notifications">
            <p>No notifications available</p>
            <small>You're all caught up!</small>
          </div>
        );
      }

      if (notifications.length === 0) {
        return (
          <div className="no-notifications">
            <p>No notifications</p>
            <small>You're all caught up!</small>
          </div>
        );
      }

      return notifications.map((notification, index) => (
        <div
          key={notification.id || `notification-${index}`}
          className={`notification-item ${!notification.read ? "unread" : ""
            }`}
          onClick={() => {
            try {
              if (notification.id) {
                markAsRead(notification.id);
              }
            } catch (error) {
              console.error('Error marking notification as read:', error);
            }
          }}
        >
          <div className="notification-icon">
            {getNotificationIcon(notification.icon)}
          </div>
          <div className="notification-content">
            <p className="notification-message">
              {notification.message || 'Notification'}
            </p>
            <span className="notification-time">
              {notification.timestamp ?
                new Date(notification.timestamp).toLocaleTimeString() :
                'Just now'
              }
            </span>
          </div>
        </div>
      ));
    } catch (error) {
      console.error('Error rendering notifications:', error);
      return (
        <div className="no-notifications">
          <p>Error loading notifications</p>
          <small>Please try refreshing the page</small>
        </div>
      );
    }
  };

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

        <div className="notification-wrapper" ref={notificationRef}>
          <button
            className="notification-btn"
            onClick={handleNotificationToggle}
            aria-label="Toggle notifications"
            type="button"
          >
            <IoNotificationsOutline size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>



          {showNotifications && (
            <div className="notification-dropdown" role="dialog" aria-label="Notifications">
              <div className="notification-header">
                <h3>Notifications</h3>
                <div className="notification-actions">
                  <button
                    className="mark-all-read"
                    onClick={() => {
                      try {
                        markAllAsRead();
                      } catch (error) {
                        console.error('Error marking all as read:', error);
                      }
                    }}
                    disabled={unreadCount === 0}
                    type="button"
                  >
                    Mark all as read
                  </button>
                  <button
                    className="mark-all-read"
                    onClick={() => {
                      try {
                        clearNotifications();
                      } catch (error) {
                        console.error('Error clearing notifications:', error);
                      }
                    }}
                    disabled={!notifications || !notifications.length}
                    type="button"
                  >
                    Clear
                  </button>
                  <button
                    className={`mark-all-read ${dnd ? 'active' : ''}`}
                    onClick={() => {
                      try {
                        setDnd(!dnd);
                      } catch (error) {
                        console.error('Error toggling DND:', error);
                      }
                    }}
                    type="button"
                  >
                    {dnd ? 'DND On' : 'DND Off'}
                  </button>
                  <button
                    className="mark-all-read"
                    onClick={() => {
                      try {
                        requestDesktopPermission();
                      } catch (error) {
                        console.error('Error requesting desktop permission:', error);
                      }
                    }}
                    type="button"
                  >
                    Desktop
                  </button>
                </div>
              </div>
              <div className="notification-list">
                {renderNotifications()}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu-container" ref={userMenuRef}>
          <button
            className="user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
            type="button"
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
                type="button"
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
