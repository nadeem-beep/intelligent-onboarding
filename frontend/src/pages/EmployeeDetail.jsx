import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import ProgressRing from '../components/ProgressRing';
import TaskCard from '../components/TaskCard';
import ChatBot from '../components/ChatBot';
import AdaptiveLearning from '../components/AdaptiveLearning';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const categoryColors = {
  'IT Setup': '#6366f1',
  'HR Compliance': '#22c55e',
  'Training': '#3b82f6',
  'Meet the Team': '#f59e0b',
  'Product Knowledge': '#ec4899',
  'Other': '#64748b'
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, aiRes] = await Promise.all([
          api.get(`/employees/${id}`),
          api.get('/ai')
        ]);
        setEmployee(empRes.data);
        setAiEnabled(aiRes.data.aiEnabled);
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleTaskStatusChange = async (taskId, newStatus, notes) => {
    try {
      await api.patch(`/tasks/employee/${id}/task/${taskId}`, {
        status: newStatus,
        notes
      });
      const res = await api.get(`/employees/${id}`);
      setEmployee(res.data);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleTaskNoteSave = async (taskId, notes) => {
    try {
      await api.patch(`/tasks/employee/${id}/task/${taskId}`, {
        notes
      });
      const res = await api.get(`/employees/${id}`);
      setEmployee(res.data);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  const generateAiSummary = async () => {
    setGeneratingAi(true);
    try {
      const res = await api.post('/ai/task-summary', { employeeId: id });
      setAiSummary(res.data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary');
    } finally {
      setGeneratingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8">
        <p className="text-red-600">Employee not found</p>
      </div>
    );
  }

  const categoryData = Object.entries(employee.tasksByCategory || {}).map(([category, tasks]) => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    return {
      category,
      percentage: Math.round((completed / tasks.length) * 100)
    };
  });

  const completedTasks = employee.tasks.filter(t => t.status === 'completed');
  const completedTasksSorted = completedTasks.sort((a, b) =>
    new Date(b.completed_at) - new Date(a.completed_at)
  );

  return (
    <>
    <ChatBot employeeId={id} aiEnabled={aiEnabled} />
    <div className="p-8">
      {/* Header */}
      <div className="flex gap-8 mb-8">
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-2xl"
              style={{ backgroundColor: employee.avatar_color }}
            >
              {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">{employee.name}</h1>
              <p className="text-slate-600 mt-1">{employee.role} • {employee.department}</p>
              <div className="flex gap-6 mt-3 text-sm text-slate-500">
                <span>Joined: {new Date(employee.joining_date).toLocaleDateString()}</span>
                {employee.manager_name && <span>Manager: {employee.manager_name}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <ProgressRing
            percentage={employee.completionPercentage}
            size={140}
            strokeWidth={10}
            color="#6366f1"
          />
          <p className="text-sm text-slate-500 mt-4 text-center">
            {employee.completedTasks} of {employee.totalTasks} tasks
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`py-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'category'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            By Category
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && (
        <div>
          {Object.entries(employee.tasksByCategory || {}).map(([category, tasks]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{category}</h3>
              <div className="space-y-2">
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                    onNoteSave={handleTaskNoteSave}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'category' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Completion by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {aiEnabled && (
            <>
              <AdaptiveLearning employeeId={id} aiEnabled={aiEnabled} />

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Progress Summary</h3>
                  <button
                    onClick={generateAiSummary}
                    disabled={generatingAi}
                    className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {generatingAi ? 'Generating...' : 'Generate AI Summary'}
                  </button>
                </div>
                {aiSummary && (
                  <p className="text-slate-600 leading-relaxed">{aiSummary}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Completed Tasks</h3>
          {completedTasksSorted.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No completed tasks yet</p>
          ) : (
            <div className="space-y-3">
              {completedTasksSorted.map(task => (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 flex items-start justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500 mt-1">{task.category}</p>
                  </div>
                  <p className="text-sm text-green-600 font-medium">
                    {new Date(task.completed_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
