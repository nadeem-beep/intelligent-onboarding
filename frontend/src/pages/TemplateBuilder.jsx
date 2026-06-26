import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

const categories = ['IT Setup', 'HR Compliance', 'Training', 'Meet the Team', 'Product Knowledge', 'Other'];

export default function TemplateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [template, setTemplate] = useState({
    name: '',
    department: '',
    role: '',
    description: '',
    tasks: []
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      const fetchTemplate = async () => {
        try {
          const res = await api.get(`/templates/${id}`);
          setTemplate(res.data);
        } catch (error) {
          console.error('Error fetching template:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTemplate();
    }
  }, [id, isNew]);

  const handleAddTask = () => {
    setTemplate({
      ...template,
      tasks: [
        ...template.tasks,
        {
          title: '',
          description: '',
          category: 'Training',
          due_day: 1,
          is_required: true
        }
      ]
    });
  };

  const handleUpdateTask = (idx, field, value) => {
    const newTasks = [...template.tasks];
    newTasks[idx] = { ...newTasks[idx], [field]: value };
    setTemplate({ ...template, tasks: newTasks });
  };

  const handleDeleteTask = (idx) => {
    const newTasks = template.tasks.filter((_, i) => i !== idx);
    setTemplate({ ...template, tasks: newTasks });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isNew) {
        const res = await api.post('/templates', {
          name: template.name,
          department: template.department,
          role: template.role,
          description: template.description
        });

        const templateId = res.data.id;

        // Add tasks
        for (const task of template.tasks) {
          if (task.title) {
            await api.post(`/templates/${templateId}/tasks`, {
              title: task.title,
              description: task.description,
              category: task.category,
              due_day: parseInt(task.due_day),
              is_required: task.is_required
            });
          }
        }
      } else {
        await api.put(`/templates/${id}`, {
          name: template.name,
          department: template.department,
          role: template.role,
          description: template.description
        });

        // Handle task updates - for simplicity, delete all and recreate
        const existingTasks = template.tasks.filter(t => t.id);
        for (const task of existingTasks) {
          await api.delete(`/templates/${id}/tasks/${task.id}`);
        }

        for (const task of template.tasks) {
          if (task.title && !task.id) {
            await api.post(`/templates/${id}/tasks`, {
              title: task.title,
              description: task.description,
              category: task.category,
              due_day: parseInt(task.due_day),
              is_required: task.is_required
            });
          }
        }
      }

      navigate('/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        {isNew ? 'Create Template' : 'Edit Template'}
      </h1>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Template Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Engineering Onboarding"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={template.department}
                onChange={(e) => setTemplate({ ...template, department: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
              <input
                type="text"
                required
                value={template.role}
                onChange={(e) => setTemplate({ ...template, role: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Software Engineer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={template.description}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe this onboarding template..."
            />
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
            <button
              type="button"
              onClick={handleAddTask}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>

          {template.tasks.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No tasks yet. Add one to get started!</p>
          ) : (
            <div className="space-y-4">
              {template.tasks.map((task, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={task.title}
                        onChange={(e) => handleUpdateTask(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="Task title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Category *</label>
                      <select
                        value={task.category}
                        onChange={(e) => handleUpdateTask(idx, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={task.description}
                      onChange={(e) => handleUpdateTask(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="Task description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Due Day *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={task.due_day}
                        onChange={(e) => handleUpdateTask(idx, 'due_day', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="Days from joining"
                      />
                    </div>

                    <div className="flex items-end gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={task.is_required}
                          onChange={(e) => handleUpdateTask(idx, 'is_required', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-slate-700">Required</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(idx)}
                        className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
