import { X, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NotificationPermission } from '@/hooks/useNotifications';

interface InAppReminder {
  id: string;
  taskId: string;
  title: string;
  timestamp: number;
}

interface ReminderBannerProps {
  reminders: InAppReminder[];
  permission: NotificationPermission;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onRequestPermission: () => void;
}

export const ReminderBanner = ({
  reminders,
  permission,
  onDismiss,
  onDismissAll,
  onRequestPermission
}: ReminderBannerProps) => {
  if (reminders.length === 0 && permission !== 'denied' && permission !== 'default') {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {/* Permission prompt */}
      {(permission === 'default' || permission === 'denied') && (
        <div className={cn(
          "flex items-center justify-between gap-3 p-3 rounded-lg border",
          permission === 'denied' 
            ? "bg-destructive/10 border-destructive/20" 
            : "bg-primary/10 border-primary/20"
        )}>
          <div className="flex items-center gap-2">
            {permission === 'denied' ? (
              <BellOff className="w-4 h-4 text-destructive" />
            ) : (
              <Bell className="w-4 h-4 text-primary" />
            )}
            <span className="text-sm">
              {permission === 'denied' 
                ? "Notifications blocked. Reminders will show here instead."
                : "Enable notifications for task reminders"}
            </span>
          </div>
          {permission === 'default' && (
            <Button size="sm" variant="outline" onClick={onRequestPermission}>
              Enable
            </Button>
          )}
        </div>
      )}

      {/* In-app reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Reminders
            </span>
            {reminders.length > 1 && (
              <button 
                onClick={onDismissAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>
          
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between gap-3 p-3 bg-accent/50 border border-accent rounded-lg animate-fade-in"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Bell className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm truncate">{reminder.title}</span>
              </div>
              <button
                onClick={() => onDismiss(reminder.id)}
                className="p-1 rounded hover:bg-muted shrink-0"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
