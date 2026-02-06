// Service Worker for TaskFlow - Background Notifications

const CACHE_NAME = 'taskflow-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  if (type === 'SCHEDULE_REMINDER') {
    scheduleReminder(payload);
  }
  
  if (type === 'CANCEL_REMINDER') {
    cancelReminder(payload.taskId);
  }
});

// Store for scheduled reminders
const scheduledReminders = new Map();

function scheduleReminder({ taskId, title, intervalMs }) {
  // Cancel existing reminder for this task
  cancelReminder(taskId);
  
  // Schedule new reminder
  const timerId = setInterval(() => {
    showNotification(title);
  }, intervalMs);
  
  scheduledReminders.set(taskId, timerId);
}

function cancelReminder(taskId) {
  if (scheduledReminders.has(taskId)) {
    clearInterval(scheduledReminders.get(taskId));
    scheduledReminders.delete(taskId);
  }
}

function showNotification(taskTitle) {
  self.registration.showNotification('Task Reminder', {
    body: `You're still working on: ${taskTitle}`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'task-reminder',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if no existing window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
