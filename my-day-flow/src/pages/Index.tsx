import { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { useTasks, REMINDER_INTERVAL_MS } from '@/hooks/useTasks';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from '@/components/Header';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { CalendarView } from '@/components/CalendarView';
import { FilterTabs } from '@/components/FilterTabs';
import { ReminderBanner } from '@/components/ReminderBanner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

const Index = () => {
  const { 
    tasks, 
    isLoaded,
    addTask, 
    updateTask, 
    deleteTask, 
    setTaskStatus, 
    getTasksByDate,
    getWorkingTasks 
  } = useTasks();
  
  const { isDark, toggleTheme } = useTheme();
  
  const {
    permission,
    inAppReminders,
    requestPermission,
    scheduleReminder,
    cancelReminder,
    dismissInAppReminder,
    clearAllInAppReminders
  } = useNotifications();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
 const [activeFilter, setActiveFilter] = useState<TaskStatus | 'all'>('pending');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Manage reminders for working tasks
  useEffect(() => {
    if (!isLoaded) return;
    
    const workingTasks = getWorkingTasks();
    
    // Schedule reminders for all working tasks
    workingTasks.forEach(task => {
      scheduleReminder(task.id, task.title, REMINDER_INTERVAL_MS);
    });
    
    // Cancel reminders for tasks that are no longer working
    tasks.forEach(task => {
      if (task.status !== 'working') {
        cancelReminder(task.id);
      }
    });
  }, [tasks, isLoaded, getWorkingTasks, scheduleReminder, cancelReminder]);

  const taskCounts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    working: tasks.filter(t => t.status === 'working').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks]);

  const displayedTasks = useMemo(() => {
    if (viewMode === 'calendar' && selectedDate) {
      return getTasksByDate(selectedDate);
    }
    return tasks;
  }, [tasks, viewMode, selectedDate, getTasksByDate]);

  const handleSubmit = (data: { title: string; description?: string; dueDate?: string }) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Show loading state while tasks are being loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} onToggleTheme={toggleTheme} />
      
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Reminder Banner */}
        <ReminderBanner
          reminders={inAppReminders}
          permission={permission}
          onDismiss={dismissInAppReminder}
          onDismissAll={clearAllInAppReminders}
          onRequestPermission={requestPermission}
        />

        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {viewMode === 'calendar' && selectedDate 
                ? format(selectedDate, 'EEEE, MMMM d')
                : 'My Tasks'}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {viewMode === 'calendar' && selectedDate
                ? `${getTasksByDate(selectedDate).length} tasks`
                : `${taskCounts.working} in progress • ${taskCounts.pending} pending`}
            </p>
          </div>
          
          {!isFormOpen && (
            <Button onClick={() => setIsFormOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          )}
        </div>

        {/* Task Form */}
        {isFormOpen && (
          <div className="mb-6">
            <TaskForm
              task={editingTask}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Filters & View Toggle */}
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          taskCounts={taskCounts}
        />

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="mb-6">
            <CalendarView
              tasks={tasks}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </div>
        )}

        {/* Task List */}
        <TaskList
          tasks={displayedTasks}
          filter={activeFilter}
          onStatusChange={setTaskStatus}
          onDelete={deleteTask}
          onEdit={handleEdit}
          onAddClick={() => setIsFormOpen(true)}
        />

        {/* Bottom spacing for mobile */}
        <div className="h-20" />
      </main>

      {/* Floating Add Button for Mobile */}
      {!isFormOpen && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            onClick={() => setIsFormOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
