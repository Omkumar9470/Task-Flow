import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '@/types/task';

const STORAGE_KEY = 'taskflow-tasks';
const AUTO_DELETE_HOURS = 24;
const REMINDER_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Task[];
        setTasks(parsed);
      } catch {
        console.error('Failed to parse tasks from localStorage');
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Auto-delete completed tasks after 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTasks(prev => prev.filter(task => {
        if (task.status === 'completed' && task.completedAt) {
          const completedTime = new Date(task.completedAt).getTime();
          const hoursSinceCompleted = (now - completedTime) / (1000 * 60 * 60);
          return hoursSinceCompleted < AUTO_DELETE_HOURS;
        }
        return true;
      }));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Hourly reminders for "working" tasks
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      const workingTasks = tasks.filter(t => t.status === 'working');
      
      workingTasks.forEach(task => {
        const lastReminder = task.lastReminderAt ? new Date(task.lastReminderAt).getTime() : 0;
        const timeSinceReminder = now - lastReminder;
        
        if (timeSinceReminder >= REMINDER_INTERVAL_MS) {
          sendReminder(task);
          updateTask(task.id, { lastReminderAt: new Date().toISOString() });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [tasks]);

  const sendReminder = (task: Task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Task Reminder', {
        body: `You're still working on: ${task.title}`,
        icon: '/favicon.ico',
      });
    }
  };

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const setTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== id) return task;
      
      const updates: Partial<Task> = { status };
      
      if (status === 'completed') {
        updates.completedAt = new Date().toISOString();
      } else if (status === 'working') {
        updates.lastReminderAt = new Date().toISOString();
        requestNotificationPermission();
      }
      
      if (status !== 'completed') {
        updates.completedAt = undefined;
      }
      
      return { ...task, ...updates };
    }));
  }, [requestNotificationPermission]);

  const getTasksByDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (task.dueDate) {
        return task.dueDate.startsWith(dateStr);
      }
      return task.createdAt.startsWith(dateStr);
    });
  }, [tasks]);

  const getTasksForMonth = useCallback((year: number, month: number) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate || task.createdAt);
      return taskDate.getFullYear() === year && taskDate.getMonth() === month;
    });
  }, [tasks]);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    setTaskStatus,
    getTasksByDate,
    getTasksForMonth,
    requestNotificationPermission,
  };
};
