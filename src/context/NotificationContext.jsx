import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext(null);
const MAX_NOTIFICATIONS = 50;

const getNotificationActionError = (error, action) => {
  if (['PGRST204', 'PGRST205', '42P01'].includes(error?.code)) {
    return 'Notification setup is out of date. Run src/supabase_notifications.sql in Supabase, then retry.';
  }
  if (error?.code === '42501') {
    return 'Supabase blocked this notification action. Run src/supabase_notifications.sql to apply the user-scoped permissions.';
  }
  return `Could not ${action}. Please try again.`;
};

const toStoredIcon = (icon, type) => {
  if (typeof icon === 'string') return icon;
  if (type === 'success') return 'invoice-success';
  if (type === 'error') return 'invoice-error';
  return 'announcement';
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dnd, setDnd] = useState(false);
  const [dndLoadedUserId, setDndLoadedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const dndRef = useRef(dnd);
  const notificationIdsRef = useRef(new Set());
  const notificationsRef = useRef([]);
  const pendingReadIdsRef = useRef(new Set());
  const requestIdRef = useRef(0);
  const dataRevisionRef = useRef(0);

  useEffect(() => {
    dndRef.current = dnd;
  }, [dnd]);

  useEffect(() => {
    if (!userId) {
      setDnd(false);
      setDndLoadedUserId(null);
      return;
    }

    try {
      setDnd(localStorage.getItem(`iv_notifications_dnd_${userId}`) === 'true');
      setDndLoadedUserId(userId);
    } catch (error) {
      console.error('Unable to load notification preferences:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || dndLoadedUserId !== userId) return;

    try {
      localStorage.setItem(`iv_notifications_dnd_${userId}`, String(dnd));
    } catch (error) {
      console.error('Unable to save notification preferences:', error);
    }
  }, [dnd, dndLoadedUserId, userId]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    const requestId = ++requestIdRef.current;
    const dataRevision = dataRevisionRef.current;
    setIsLoading(true);

    try {
      const [listResult, unreadResult] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(MAX_NOTIFICATIONS),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('read', false),
      ]);

      if (listResult.error) throw listResult.error;
      if (unreadResult.error) throw unreadResult.error;
      if (requestId !== requestIdRef.current || dataRevision !== dataRevisionRef.current) return;

      const nextNotifications = listResult.data || [];
      notificationsRef.current = nextNotifications;
      notificationIdsRef.current = new Set(nextNotifications.map((item) => item.id));
      setNotifications(nextNotifications);
      setUnreadCount(unreadResult.count || 0);
    } catch (error) {
      if (requestId === requestIdRef.current) {
        console.error('Error fetching notifications:', error);
        toast.error('Could not refresh notifications');
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      requestIdRef.current += 1;
      notificationsRef.current = [];
      notificationIdsRef.current = new Set();
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      setRealtimeStatus('disconnected');
      return undefined;
    }

    let active = true;
    setRealtimeStatus('connecting');
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!active) return;

          dataRevisionRef.current += 1;

          if (payload.eventType === 'INSERT') {
            const notification = payload.new;
            const alreadyPresent = notificationIdsRef.current.has(notification.id);
            if (!alreadyPresent) {
              notificationIdsRef.current.add(notification.id);
              const nextNotifications = [notification, ...notificationsRef.current]
                .slice(0, MAX_NOTIFICATIONS);
              notificationsRef.current = nextNotifications;
              setNotifications(nextNotifications);
              if (!notification.read) setUnreadCount((count) => count + 1);

              if (!dndRef.current && notification.message) {
                if (document.visibilityState === 'visible') {
                  toast(notification.message, {
                    icon: typeof notification.icon === 'string' ? notification.icon : '🔔',
                    duration: 4000,
                  });
                } else if (
                  typeof window !== 'undefined' &&
                  'Notification' in window &&
                  Notification.permission === 'granted'
                ) {
                  try {
                    new Notification(notification.title || 'InvoiceVault', {
                      body: notification.message,
                      icon: '/favicon.ico',
                    });
                  } catch (error) {
                    console.error('Unable to show desktop notification:', error);
                  }
                }
              }
            }
            return;
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            const existing = notificationsRef.current.find((item) => item.id === updated.id);
            const wasUnread = existing ? !existing.read : payload.old?.read === false;
            const isUnread = !updated.read;
            if (wasUnread !== isUnread) {
              setUnreadCount((count) => Math.max(0, count + (isUnread ? 1 : -1)));
            }
            const nextNotifications = notificationsRef.current.map((item) =>
              item.id === updated.id ? updated : item,
            );
            notificationsRef.current = nextNotifications;
            setNotifications(nextNotifications);
            return;
          }

          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            const existing = notificationsRef.current.find((item) => item.id === deletedId);
            if (existing && !existing.read) {
              setUnreadCount((count) => Math.max(0, count - 1));
            }
            const nextNotifications = notificationsRef.current.filter((item) => item.id !== deletedId);
            notificationsRef.current = nextNotifications;
            setNotifications(nextNotifications);
            notificationIdsRef.current.delete(deletedId);
          }
        },
      )
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          fetchNotifications();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error');
          console.error(`Notification realtime channel status: ${status}`);
        } else if (status === 'CLOSED') {
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      active = false;
      setRealtimeStatus('disconnected');
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const addNotification = useCallback(async (notification) => {
    if (!userId) {
      toast.error('Sign in before creating a notification');
      return null;
    }
    if (!notification?.message) {
      toast.error('Notification message cannot be empty');
      return null;
    }

    const type = notification.type || 'info';
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title: notification.title || 'Notification',
        message: notification.message,
        type,
        icon: toStoredIcon(notification.icon, type),
        read: false,
        link: notification.link || null,
        metadata: notification.metadata || {},
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding notification:', error);
      toast.error(getNotificationActionError(error, 'add the notification'));
      return null;
    }

    if (data && !notificationIdsRef.current.has(data.id)) {
      notificationIdsRef.current.add(data.id);
      dataRevisionRef.current += 1;
      const nextNotifications = [data, ...notificationsRef.current].slice(0, MAX_NOTIFICATIONS);
      notificationsRef.current = nextNotifications;
      setNotifications(nextNotifications);
      setUnreadCount((count) => count + 1);
    }

    return data;
  }, [userId]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!userId || !notificationId) return;
    const notification = notificationsRef.current.find((item) => item.id === notificationId);
    if (
      !notification ||
      notification.read ||
      pendingReadIdsRef.current.has(notificationId)
    ) return;

    pendingReadIdsRef.current.add(notificationId);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      dataRevisionRef.current += 1;
      const currentNotification = notificationsRef.current.find((item) => item.id === notificationId);
      if (currentNotification && !currentNotification.read) {
        const nextNotifications = notificationsRef.current.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item,
        );
        notificationsRef.current = nextNotifications;
        setNotifications(nextNotifications);
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Could not mark notification as read');
      throw error;
    } finally {
      pendingReadIdsRef.current.delete(notificationId);
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Could not mark notifications as read');
      throw error;
    }

    dataRevisionRef.current += 1;
    await fetchNotifications();
  }, [fetchNotifications, unreadCount, userId]);

  const clearNotifications = useCallback(async () => {
    if (!userId || notificationsRef.current.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing notifications:', error);
      toast.error(getNotificationActionError(error, 'clear notifications'));
      throw error;
    }

    dataRevisionRef.current += 1;
    await fetchNotifications();
  }, [fetchNotifications, userId]);

  const requestDesktopPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      realtimeStatus,
      fetchNotifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      dnd,
      setDnd,
      requestDesktopPermission,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
