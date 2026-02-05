export type TaskStatus = 'pending' | 'working' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  lastReminderAt?: string;
}
