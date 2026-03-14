import { useEffect, useState } from 'react';
import TaskCard from './TaskCard';
import ReminderCard from './ReminderCard';
import WeatherCard from './WeatherCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type Reminder = Database['public']['Tables']['reminders']['Row'];

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);

  useEffect(() => {
    if (user) {
      loadTasks();
      loadReminders();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('is_active', true)
        .order('reminder_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoadingReminders(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TaskCard tasks={tasks} loading={loadingTasks} onRefresh={loadTasks} />
          <ReminderCard reminders={reminders} loading={loadingReminders} onRefresh={loadReminders} />
        </div>

        <div>
          <WeatherCard />
        </div>
      </div>
    </div>
  );
}
