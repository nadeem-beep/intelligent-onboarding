import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const statusColors = {
  pending: { bg: '#f3f4f6', text: '#6b7280', label: 'Pending' },
  in_progress: { bg: '#dbeafe', text: '#0284c7', label: 'In Progress' },
  completed: { bg: '#dcfce7', text: '#16a34a', label: 'Completed' },
  skipped: { bg: '#fed7aa', text: '#d97706', label: 'Skipped' }
};

export default function TaskCard({ task, onStatusChange, onNoteSave }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [saving, setSaving] = useState(false);

  const statusInfo = statusColors[task.status] || statusColors.pending;

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    await onStatusChange(task.id, newStatus, notes);
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    await onNoteSave(task.id, notes);
    setSaving(false);
  };

  const dueDate = new Date(task.due_date);
  const today = new Date();
  const isOverdue = dueDate < today && task.status !== 'completed' && task.status !== 'skipped';
  const isToday = dueDate.toDateString() === today.toDateString();

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 text-left">
          <div className="flex-1">
            <p className="font-medium text-slate-900">{task.title}</p>
            <p className="text-sm text-slate-500 mt-1">{task.category}</p>
          </div>
          <div className="text-right">
            <div
              style={{ backgroundColor: statusInfo.bg }}
              className="inline-block rounded-full px-3 py-1 text-xs font-medium"
              style={{ color: statusInfo.text, backgroundColor: statusInfo.bg }}
            >
              {statusInfo.label}
            </div>
            {task.due_date && (
              <p className={`text-xs mt-2 ${isOverdue ? 'text-red-600 font-semibold' : isToday ? 'text-amber-600' : 'text-slate-500'}`}>
                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        <ChevronDown size={20} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          {task.description && (
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">{task.description}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add notes about this task..."
            />
          </div>

          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
