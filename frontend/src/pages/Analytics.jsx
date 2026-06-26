import { useState, useEffect } from 'react';
import api from '../api/client';
import StatCard from '../components/StatCard';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const departmentColors = ['#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [completionData, setCompletionData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [
          statsRes,
          completionRes,
          timelineRes,
          employeeRes,
          categoryRes
        ] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/completion'),
          api.get('/analytics/timeline'),
          api.get('/analytics/employees'),
          api.get('/analytics/categories')
        ]);

        setStats(statsRes.data);
        setCompletionData(completionRes.data);
        setTimelineData(timelineRes.data);
        setEmployeeData(employeeRes.data);
        setCategoryData(categoryRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  // Calculate funnel data
  const funnelData = employeeData.reduce((acc, emp) => {
    const brackets = ['0-25%', '25-50%', '50-75%', '75-100%', 'Completed'];
    let bracket;
    if (emp.completion_percentage === 100) {
      bracket = 'Completed';
    } else if (emp.completion_percentage >= 75) {
      bracket = '75-100%';
    } else if (emp.completion_percentage >= 50) {
      bracket = '50-75%';
    } else if (emp.completion_percentage >= 25) {
      bracket = '25-50%';
    } else {
      bracket = '0-25%';
    }

    const existing = acc.find(b => b.name === bracket);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: bracket, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => {
    const order = ['0-25%', '25-50%', '50-75%', '75-100%', 'Completed'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics</h1>
      <p className="text-slate-500 mb-8">Onboarding metrics and progress tracking.</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Onboarded"
          value={stats?.totalEmployees || 0}
          icon={TrendingUp}
          color="#6366f1"
        />
        <StatCard
          title="Currently Active"
          value={stats?.activeOnboarding || 0}
          icon={TrendingUp}
          color="#3b82f6"
        />
        <StatCard
          title="Avg Completion"
          value={`${stats?.avgCompletionRate || 0}%`}
          icon={TrendingUp}
          color="#22c55e"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks || 0}
          icon={TrendingUp}
          color="#ef4444"
        />
        <StatCard
          title="Avg Days"
          value={`${stats?.avgDaysToComplete || 0}`}
          subtitle="to complete"
          icon={TrendingUp}
          color="#f59e0b"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Completions (30 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="tasks_completed"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department Completion */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">By Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="department" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="completion_percentage" fill="#6366f1" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Categories Radar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={categoryData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis />
              <Radar
                name="Completion %"
                dataKey="completion_percentage"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Onboarding Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Progress Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Employee Progress</h3>
        </div>

        {employeeData.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No employee data
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Employee</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Progress</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Days Since Join</th>
              </tr>
            </thead>
            <tbody>
              {employeeData.map((emp, idx) => (
                <tr key={emp.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{emp.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.department}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600"
                          style={{ width: `${emp.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">{emp.completion_percentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.days_since_joining} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
