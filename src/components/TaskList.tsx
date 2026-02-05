import { Task, TaskStatus } from '@/types/task';
import { TaskItem } from './TaskItem';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onAddClick: () => void;
  filter: TaskStatus | 'all';
}

export const TaskList = ({
  tasks,
  onStatusChange,
  onDelete,
  onEdit,
  onAddClick,
  filter,
}: TaskListProps) => {
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filter);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Working tasks first, then pending, then completed
    const statusOrder = { working: 0, pending: 1, completed: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (sortedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {filter === 'all' 
            ? 'Add your first task to get started'
            : 'Tasks with this status will appear here'}
        </p>
        {filter === 'all' && (
          <Button onClick={onAddClick}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};
