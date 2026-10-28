import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoNotificationsOutline } from "react-icons/io5";
import { RiUserLine, RiLogoutBoxLine, RiFileListLine } from "react-icons/ri";
import { BsSun, BsMoon } from "react-icons/bs";
import {
  FiAlertTriangle,
  FiBell,
  FiCamera,
  FiCheck,
  FiDownload,
  FiLock,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { toast } from 'react-hot-toast';
import "./Header.css";

const getNotificationIcon = (iconName, type) => {
  const icon = typeof iconName === 'string' ? iconName : type;
  switch (icon) {
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
    case 'announcement':
    case 'info':
    default:
      return <FiBell size={16} />;
  }
};

const formatNotificationTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const Header = ({ onMenuClick, isSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    realtimeStatus,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    dnd,
    setDnd,
    requestDesktopPermission,
  } =
    useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
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

  const handleNotificationToggle = () => {
    setShowUserMenu(false);
    setShowNotifications((isOpen) => !isOpen);
  };

  const handleDesktopNotifications = async () => {
    try {
      const granted = await requestDesktopPermission();
      if (granted) {
        toast.success('Desktop notifications enabled');
      } else {
        toast.error('Desktop notification permission was not granted');
      }
    } catch (error) {
      console.error('Error requesting desktop notification permission:', error);
      toast.error('Could not enable desktop notifications');
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Toggle menu"
          aria-expanded={isSidebarOpen}
          aria-controls="dashboard-sidebar"
          type="button"
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
          type="button"
        >
          {theme ? <BsSun size={20} /> : <BsMoon size={20} />}
        </button>

        <div className="notification-wrapper" ref={notificationRef}>
          <button
            className="notification-btn"
            onClick={handleNotificationToggle}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={showNotifications}
            aria-haspopup="dialog"
            type="button"
          >
            <IoNotificationsOutline size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <section
              className="notification-dropdown"
              role="dialog"
              aria-label="Notifications"
              aria-modal="false"
            >
              <div className="notification-header">
                <div className="notification-title-group">
                  <span className="notification-heading-icon"><FiBell /></span>
                  <div>
                    <h3>Notifications</h3>
                    <span className="notification-subtitle">
                      {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
                    </span>
                  </div>
                </div>
                <button
                  className="notification-refresh"
                  type="button"
                  onClick={() => fetchNotifications()}
                  aria-label="Refresh notifications"
                  title="Refresh notifications"
                  disabled={notificationsLoading}
                >
                  <FiRefreshCw className={notificationsLoading ? 'is-spinning' : ''} />
                </button>
              </div>

              <div className="notification-controls">
                <span className={`notification-live-status ${realtimeStatus}`}>
                  <span />
                  {realtimeStatus === 'connected'
                    ? 'Live updates on'
                    : realtimeStatus === 'error'
                      ? 'Reconnecting…'
                      : 'Connecting…'}
                </span>
                <div className="notification-actions">
                  <button
                    className="notification-action"
                    onClick={() => markAllAsRead().catch(() => {})}
                    disabled={unreadCount === 0}
                    type="button"
                  >
                    <FiCheck />
                    Read all
                  </button>
                  <button
                    className="notification-action"
                    onClick={() => clearNotifications().catch(() => {})}
                    disabled={!notifications.length}
                    type="button"
                  >
                    <FiTrash2 />
                    Clear
                  </button>
                </div>
              </div>

              <div className="notification-list" aria-live="polite">
                {notificationsLoading && !notifications.length ? (
                  <div className="notification-empty">
                    <span className="notification-empty-icon"><FiBell /></span>
                    <p>Loading notifications</p>
                    <small>Checking for the latest updates…</small>
                  </div>
                ) : notifications.length ? (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={`notification-item ${notification.read ? '' : 'unread'}`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id).catch(() => {});
                        }
                        if (notification.link) {
                          setShowNotifications(false);
                          navigate(notification.link);
                        }
                      }}
                      type="button"
                    >
                      <span className={`notification-icon notification-type-${notification.type || 'info'}`}>
                        {getNotificationIcon(notification.icon, notification.type)}
                      </span>
                      <span className="notification-content">
                        <span className="notification-item-heading">
                          <span className="notification-title">{notification.title || 'Notification'}</span>
                          {!notification.read && <span className="notification-unread-dot" />}
                        </span>
                        <span className="notification-message">{notification.message || 'Notification'}</span>
                        <span className="notification-time">
                          {formatNotificationTime(notification.created_at || notification.timestamp)}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="notification-empty">
                    <span className="notification-empty-icon"><FiBell /></span>
                    <p>All caught up</p>
                    <small>New updates will show up here.</small>
                  </div>
                )}
              </div>

              <div className="notification-footer">
                <button
                  className={`notification-preference ${dnd ? 'active' : ''}`}
                  onClick={() => setDnd((enabled) => !enabled)}
                  type="button"
                  aria-pressed={dnd}
                >
                  {dnd ? 'Pause pop-up alerts' : 'Enable quiet mode'}
                </button>
                <button
                  className="notification-preference"
                  onClick={handleDesktopNotifications}
                  type="button"
                >
                  {typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted'
                    ? 'Desktop alerts on'
                    : 'Desktop alerts'}
                </button>
              </div>
            </section>
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
