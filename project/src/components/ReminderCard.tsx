import { useState } from 'react';
import { Bell, Plus, X, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Reminder = Database['public']['Tables']['reminders']['Row'];

interface ReminderCardProps {
  reminders: Reminder[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ReminderCard({ reminders, loading, onRefresh }: ReminderCardProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', reminderTime: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.reminderTime) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reminders').insert({
        user_id: user.id,
        title: formData.title.trim(),
        reminder_time: formData.reminderTime,
      });

      if (error) throw error;

      setFormData({ title: '', reminderTime: '' });
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error creating reminder:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase.from('reminders').delete().eq('id', reminderId);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return 'Past due';
    } else if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `In ${diffMins} minutes`;
    } else if (diffHours < 24) {
      return `In ${diffHours} hours`;
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `In ${diffDays} days`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Reminders</h3>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {showForm ? <X className="w-5 h-5 text-gray-600" /> : <Plus className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Reminder title..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
            <input type="datetime-local" value={formData.reminderTime} onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
            <button type="submit" disabled={submitting} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Adding...' : 'Add Reminder'}
            </button>
          </form>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No reminders yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                <div className="p-2 bg-purple-50 rounded-lg mt-0.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{reminder.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatDateTime(reminder.reminder_time)}</p>
                </div>
                <button onClick={() => deleteReminder(reminder.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
