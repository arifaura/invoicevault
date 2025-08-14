import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dnd, setDnd] = useState(false); // do-not-disturb
  const desktopGrantedRef = useRef(null);

  // Load persisted notifications/settings
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('iv_notifications') || '[]');
      const savedUnread = Number(localStorage.getItem('iv_notifications_unread') || 0);
      const savedDnd = JSON.parse(localStorage.getItem('iv_notifications_dnd') || 'false');
      setNotifications(saved);
      setUnreadCount(savedUnread);
      setDnd(!!savedDnd);
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem('iv_notifications', JSON.stringify(notifications));
    localStorage.setItem('iv_notifications_unread', String(unreadCount));
  }, [notifications, unreadCount]);

  useEffect(() => {
    localStorage.setItem('iv_notifications_dnd', JSON.stringify(dnd));
  }, [dnd]);

  const addNotification = (notification) => {
    const item = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      type: 'info',
      icon: notification?.icon || null,
      ...notification,
    };
    setNotifications(prev => [item, ...prev]);
    setUnreadCount(prev => prev + 1);
    maybeShowDesktop(item);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Desktop notification helpers
  const requestDesktopPermission = async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    desktopGrantedRef.current = result === 'granted';
    return desktopGrantedRef.current;
  };

  const maybeShowDesktop = async (notification) => {
    try {
      if (dnd) return;
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted' || desktopGrantedRef.current) {
        new Notification(notification.title || 'Notification', {
          body: notification.message,
        });
      }
    } catch {}
  };

  // Schedule helper
  const scheduleNotification = (delayMs, notification) => {
    return setTimeout(() => addNotification(notification), delayMs);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      removeNotification,
      dnd,
      setDnd,
      requestDesktopPermission,
      scheduleNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext); 