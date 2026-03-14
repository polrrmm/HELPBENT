import { useState } from 'react';
import { CheckSquare, Plus, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
  tasks: Task[];
  loading: boolean;
  onRefresh: () => void;
}

export default function TaskCard({ tasks, loading, onRefresh }: TaskCardProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: formData.title.trim(),
        priority: formData.priority,
      });

      if (error) throw error;

      setFormData({ title: '', priority: 'medium' });
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {showForm ? <X className="w-5 h-5 text-gray-600" /> : <Plus className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Task title..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <div className="flex gap-2">
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No tasks yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                <button onClick={() => toggleTask(task)} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-600'}`}>
                  {task.completed && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {task.title}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all">
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
