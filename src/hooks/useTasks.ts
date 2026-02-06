import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '@/types/task';

const STORAGE_KEY = 'taskflow-tasks';
const AUTO_DELETE_HOURS = 24;
export const REMINDER_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load tasks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Task[];
        setTasks(parsed);
      }
    } catch (error) {
      console.error('[Tasks] Failed to parse tasks from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save tasks to localStorage whenever they change (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.error('[Tasks] Failed to save tasks to localStorage:', error);
      }
    }
  }, [tasks, isLoaded]);

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
      }
      
      if (status !== 'completed') {
        updates.completedAt = undefined;
      }
      
      return { ...task, ...updates };
    }));
  }, []);

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

  const getWorkingTasks = useCallback(() => {
    return tasks.filter(t => t.status === 'working');
  }, [tasks]);

  return {
    tasks,
    isLoaded,
    addTask,
    updateTask,
    deleteTask,
    setTaskStatus,
    getTasksByDate,
    getTasksForMonth,
    getWorkingTasks,
  };
};
