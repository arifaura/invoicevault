import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dnd, setDnd] = useState(false); // do-not-disturb
  const { user } = useAuth();

  // Load DND setting from local storage
  useEffect(() => {
    const savedDnd = JSON.parse(localStorage.getItem('iv_notifications_dnd') || 'false');
    setDnd(!!savedDnd);
  }, []);

  // Persist DND setting
  useEffect(() => {
    localStorage.setItem('iv_notifications_dnd', JSON.stringify(dnd));
  }, [dnd]);

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  // Initial fetch and Real-time subscription
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Notification change received!', payload);
          // Refresh notifications on any change
          fetchNotifications();

          // Show toast for new notifications if not DND
          if (payload.eventType === 'INSERT' && !dnd) {
            const newNotif = payload.new;
            toast(newNotif.message, {
              icon: newNotif.icon || '📢',
              duration: 4000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchNotifications, dnd]);

  const addNotification = async (notification) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            title: notification.title || 'Notification',
            message: notification.message,
            type: notification.type || 'info',
            icon: notification.icon || '📢',
            read: false,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      // No need to manually update state, subscription will handle it
    } catch (error) {
      console.error('Error adding notification:', error);
      toast.error('Failed to add notification');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Optimistic update
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error would go here, but simple log is fine for now
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;

    try {
      // Only delete read notifications or all? Usually clear means delete all visible
      // But let's just delete all for this user for now based on previous implementation
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const requestDesktopPermission = async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      dnd,
      setDnd,
      requestDesktopPermission
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);