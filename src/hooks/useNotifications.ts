import { useState, useEffect, useCallback, useRef } from 'react';

export type NotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

interface InAppReminder {
  id: string;
  taskId: string;
  title: string;
  timestamp: number;
}

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  swRegistration: ServiceWorkerRegistration | null;
  inAppReminders: InAppReminder[];
  requestPermission: () => Promise<NotificationPermission>;
  scheduleReminder: (taskId: string, title: string, intervalMs: number) => void;
  cancelReminder: (taskId: string) => void;
  sendNotification: (title: string, body: string) => void;
  dismissInAppReminder: (id: string) => void;
  clearAllInAppReminders: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [inAppReminders, setInAppReminders] = useState<InAppReminder[]>([]);
  
  // Track active reminders for fallback
  const fallbackTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const taskTitles = useRef<Map<string, string>>(new Map());

  // Check support and register service worker
  useEffect(() => {
    const init = async () => {
      try {
        // Check if notifications are supported
        const notificationSupported = 'Notification' in window;
        const swSupported = 'serviceWorker' in navigator;
        
        setIsSupported(notificationSupported);
        
        if (notificationSupported) {
          setPermission(Notification.permission as NotificationPermission);
        } else {
          setPermission('unsupported');
        }
        
        // Register service worker
        if (swSupported) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/'
            });
            setSwRegistration(registration);
            console.log('[Notifications] Service Worker registered');
          } catch (error) {
            console.warn('[Notifications] Service Worker registration failed:', error);
          }
        }
      } catch (error) {
        console.error('[Notifications] Initialization error:', error);
        setPermission('unsupported');
      }
    };

    init();

    // Cleanup fallback timers on unmount
    return () => {
      fallbackTimers.current.forEach((timer) => clearInterval(timer));
      fallbackTimers.current.clear();
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      return result as NotificationPermission;
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      return 'denied';
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, body: string) => {
    if (!isSupported) return;

    if (permission === 'granted') {
      try {
        if (swRegistration) {
          // Use service worker for better mobile support
          swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'task-reminder',
          });
        } else {
          // Fallback to regular notification
          new Notification(title, {
            body,
            icon: '/favicon.ico',
          });
        }
      } catch (error) {
        console.error('[Notifications] Failed to show notification:', error);
        // Add in-app reminder as fallback
        addInAppReminder('fallback', body);
      }
    } else {
      // Show in-app reminder if notifications not granted
      addInAppReminder('fallback', body);
    }
  }, [isSupported, permission, swRegistration]);

  const addInAppReminder = useCallback((taskId: string, title: string) => {
    const reminder: InAppReminder = {
      id: crypto.randomUUID(),
      taskId,
      title,
      timestamp: Date.now()
    };
    setInAppReminders(prev => [reminder, ...prev].slice(0, 5)); // Keep max 5 reminders
  }, []);

  const scheduleReminder = useCallback((taskId: string, title: string, intervalMs: number) => {
    // Cancel any existing reminder for this task
    cancelReminderInternal(taskId);
    
    // Store task title for fallback
    taskTitles.current.set(taskId, title);

    // Try to use service worker
    if (swRegistration?.active && permission === 'granted') {
      swRegistration.active.postMessage({
        type: 'SCHEDULE_REMINDER',
        payload: { taskId, title, intervalMs }
      });
      console.log(`[Notifications] Scheduled SW reminder for "${title}" every ${intervalMs / 1000}s`);
    }
    
    // Always set up fallback timer (works even if SW fails or notifications denied)
    const fallbackTimer = setInterval(() => {
      if (permission === 'granted' && swRegistration) {
        // SW should handle it, but send notification as backup
        sendNotification('Task Reminder', `You're still working on: ${title}`);
      } else {
        // Show in-app reminder
        addInAppReminder(taskId, `You're still working on: ${title}`);
      }
    }, intervalMs);
    
    fallbackTimers.current.set(taskId, fallbackTimer);
  }, [swRegistration, permission, sendNotification, addInAppReminder]);

  const cancelReminderInternal = (taskId: string) => {
    // Cancel service worker reminder
    if (swRegistration?.active) {
      swRegistration.active.postMessage({
        type: 'CANCEL_REMINDER',
        payload: { taskId }
      });
    }
    
    // Cancel fallback timer
    const existingTimer = fallbackTimers.current.get(taskId);
    if (existingTimer) {
      clearInterval(existingTimer);
      fallbackTimers.current.delete(taskId);
    }
    
    taskTitles.current.delete(taskId);
  };

  const cancelReminder = useCallback((taskId: string) => {
    cancelReminderInternal(taskId);
    console.log(`[Notifications] Cancelled reminder for task ${taskId}`);
  }, [swRegistration]);

  const dismissInAppReminder = useCallback((id: string) => {
    setInAppReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearAllInAppReminders = useCallback(() => {
    setInAppReminders([]);
  }, []);

  return {
    permission,
    isSupported,
    swRegistration,
    inAppReminders,
    requestPermission,
    scheduleReminder,
    cancelReminder,
    sendNotification,
    dismissInAppReminder,
    clearAllInAppReminders
  };
};
