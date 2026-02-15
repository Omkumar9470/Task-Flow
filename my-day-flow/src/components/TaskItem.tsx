import { Task, TaskStatus } from '@/types/task';
import { Check, Clock, Play, Trash2, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TaskItemProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-secondary text-secondary-foreground',
  },
  working: {
    label: 'Working',
    icon: Play,
    className: 'bg-warning/15 text-warning',
  },
  completed: {
    label: 'Done',
    icon: Check,
    className: 'bg-success/15 text-success',
  },
};

export const TaskItem = ({ task, onStatusChange, onDelete, onEdit }: TaskItemProps) => {
  const [showActions, setShowActions] = useState(false);
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  const getTimeRemaining = () => {
    if (task.status !== 'completed' || !task.completedAt) return null;
    const completedTime = new Date(task.completedAt).getTime();
    const deleteTime = completedTime + 24 * 60 * 60 * 1000;
    const remaining = deleteTime - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `Auto-deletes in ${hours}h ${minutes}m`;
  };

  const cycleStatus = () => {
    const statusOrder: TaskStatus[] = ['pending', 'working', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % 3];
    onStatusChange(task.id, nextStatus);
  };

  return (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-xl p-4 transition-all duration-200",
        "hover:shadow-md hover:border-primary/20",
        task.status === 'completed' && "opacity-70",
        "animate-fade-in"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        {/* Status Toggle Button */}
        <button
          onClick={cycleStatus}
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
            "border-2 hover:scale-110",
            task.status === 'pending' && "border-muted-foreground/30 hover:border-primary",
            task.status === 'working' && "border-warning bg-warning/10 animate-pulse-soft",
            task.status === 'completed' && "border-success bg-success text-success-foreground"
          )}
          title={`Click to change status (Current: ${config.label})`}
        >
          {task.status === 'completed' && <Check className="w-4 h-4" />}
          {task.status === 'working' && <Play className="w-3 h-3 fill-current text-warning" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-medium text-foreground transition-all duration-200",
              task.status === 'completed' && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn("text-xs px-2 py-0.5 rounded-full", config.className)}>
              <StatusIcon className="w-3 h-3 inline mr-1" />
              {config.label}
            </span>
            {task.dueDate && (
              <span className="text-xs text-muted-foreground">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.status === 'completed' && (
              <span className="text-xs text-muted-foreground italic">
                {getTimeRemaining()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity duration-200",
            showActions ? "opacity-100" : "opacity-0 md:opacity-0",
            "opacity-100 md:opacity-0 md:group-hover:opacity-100"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(task)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete task?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(task.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
