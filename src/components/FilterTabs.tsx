import { TaskStatus } from '@/types/task';
import { cn } from '@/lib/utils';
import { List, CalendarDays } from 'lucide-react';

interface FilterTabsProps {
  activeFilter: TaskStatus | 'all';
  onFilterChange: (filter: TaskStatus | 'all') => void;
  viewMode: 'list' | 'calendar';
  onViewModeChange: (mode: 'list' | 'calendar') => void;
  taskCounts: { all: number; pending: number; working: number; completed: number };
}

export const FilterTabs = ({
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  taskCounts,
}: FilterTabsProps) => {
  const filters: { key: TaskStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'working', label: 'Working' },
    { key: 'completed', label: 'Done' },
  ];

  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap",
              "flex items-center gap-1.5",
              activeFilter === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              activeFilter === key ? "bg-primary/10 text-primary" : "bg-muted-foreground/20"
            )}>
              {taskCounts[key]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            "p-1.5 rounded-md transition-all duration-200",
            viewMode === 'list'
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('calendar')}
          className={cn(
            "p-1.5 rounded-md transition-all duration-200",
            viewMode === 'calendar'
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
