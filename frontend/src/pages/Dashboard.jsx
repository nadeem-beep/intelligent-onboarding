import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { Users, TrendingUp, AlertCircle, Plus } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    template_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    manager_name: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, employeesRes, templatesRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/employees'),
          api.get('/templates')
        ]);

        setStats(statsRes.data);
        setRecentEmployees(employeesRes.data.slice(0, 5));
        setTemplates(templatesRes.data);

        // Get upcoming tasks
        const allTasks = [];
        for (const emp of employeesRes.data) {
          const tasksRes = await api.get(`/employees/${emp.id}`);
          tasksRes.data.tasks
            .filter(t => {
              const dueDate = new Date(t.due_date);
              const today = new Date();
              const daysUntil = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
              return daysUntil >= 0 && daysUntil <= 7 && t.status !== 'completed';
            })
            .forEach(t => {
              allTasks.push({ ...t, employee: emp });
            });
        }
        setUpcomingTasks(allTasks.slice(0, 10));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        department: '',
        role: '',
        template_id: '',
        joining_date: new Date().toISOString().split('T')[0],
        manager_name: ''
      });
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error creating employee:', error);
      alert(error.response?.data?.error || 'Failed to create employee');
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-2">Welcome back! Here's your onboarding overview.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Hire
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          icon={Users}
          color="#6366f1"
        />
        <StatCard
          title="Active Onboarding"
          value={stats?.activeOnboarding || 0}
          subtitle="In progress"
          icon={TrendingUp}
          color="#22c55e"
        />
        <StatCard
          title="Avg Completion"
          value={`${stats?.avgCompletionRate || 0}%`}
          icon={TrendingUp}
          color="#3b82f6"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks || 0}
          icon={AlertCircle}
          color="#ef4444"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Employees */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Hires</h2>
            <div className="space-y-2">
              {recentEmployees.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No employees yet</p>
              ) : (
                recentEmployees.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: emp.avatar_color }}
                      >
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all"
                          style={{ width: `${emp.completion_percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{emp.completion_percentage}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Due This Week</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {upcomingTasks.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No upcoming tasks</p>
              ) : (
                upcomingTasks.map(task => (
                  <div key={task.id} className="text-sm border-l-2 border-indigo-300 pl-3 py-2">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{task.employee.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        title="Add New Hire"
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Manager Name</label>
            <input
              type="text"
              value={formData.manager_name}
              onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date *</label>
            <input
              type="date"
              required
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Onboarding Template</label>
            <select
              value={formData.template_id}
              onChange={(e) => setFormData({ ...formData, template_id: e.target.value || null })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No template</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Employee
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
