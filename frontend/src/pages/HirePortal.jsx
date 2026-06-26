import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import ProgressRing from '../components/ProgressRing';
import TaskCard from '../components/TaskCard';
import ChatBot from '../components/ChatBot';

export default function HirePortal() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const [empRes, aiRes] = await Promise.all([
          api.get(`/employees/${employeeId}`),
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

    fetchEmployee();
  }, [employeeId]);

  useEffect(() => {
    if (employee && employee.completionPercentage === 100 && !confetti) {
      setConfetti(true);
      launchConfetti();
    }
  }, [employee, confetti]);

  const launchConfetti = () => {
    for (let i = 0; i < 50; i++) {
      const div = document.createElement('div');
      div.className = 'confetti';
      div.textContent = ['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)];
      div.style.left = Math.random() * 100 + '%';
      div.style.top = '-10px';
      div.style.fontSize = Math.random() * 10 + 20 + 'px';
      div.style.opacity = Math.random() * 0.7 + 0.3;
      div.style.transform = `rotateZ(${Math.random() * 360}deg)`;
      document.body.appendChild(div);

      setTimeout(() => div.remove(), 3000);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus, notes) => {
    try {
      await api.patch(`/tasks/employee/${employeeId}/task/${taskId}`, {
        status: newStatus,
        notes
      });
      const res = await api.get(`/employees/${employeeId}`);
      setEmployee(res.data);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleTaskNoteSave = async (taskId, notes) => {
    try {
      await api.patch(`/tasks/employee/${employeeId}/task/${taskId}`, {
        notes
      });
      const res = await api.get(`/employees/${employeeId}`);
      setEmployee(res.data);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center text-red-600 h-screen flex items-center justify-center">
        Employee not found
      </div>
    );
  }

  const daysSinceJoining = Math.floor((new Date() - new Date(employee.joining_date)) / (1000 * 60 * 60 * 24));

  return (
    <>
    <ChatBot employeeId={employeeId} aiEnabled={aiEnabled} />
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Welcome, {employee.name}! 👋</h1>
          <p className="text-indigo-100 text-lg">
            You joined {new Date(employee.joining_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {daysSinceJoining > 0 && ` • ${daysSinceJoining} days in`}
          </p>
          <p className="text-indigo-100 mt-2">
            {employee.role} • {employee.department}
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="col-span-1 flex justify-center">
            <ProgressRing
              percentage={employee.completionPercentage}
              size={160}
              strokeWidth={10}
              color="#6366f1"
            />
          </div>

          <div className="col-span-2 bg-white rounded-xl shadow-lg p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Onboarding Progress</h2>
            <div className="space-y-4">
              <p className="text-slate-600">
                You've completed <span className="font-bold text-indigo-600">{employee.completedTasks}</span> of <span className="font-bold">{employee.totalTasks}</span> tasks
              </p>

              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${employee.completionPercentage}%` }}
                />
              </div>

              <p className="text-slate-500 text-sm">
                {employee.completionPercentage === 100
                  ? '🎉 Congratulations! You\'ve completed your onboarding!'
                  : `Keep going! ${100 - employee.completionPercentage}% remaining`}
              </p>
            </div>
          </div>
        </div>

        {/* Task Checklist */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Your Tasks</h2>
            <p className="text-slate-500 mt-2">Click on tasks to update your progress and add notes</p>
          </div>

          <div className="p-6 space-y-2">
            {Object.entries(employee.tasksByCategory || {}).length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tasks assigned yet</p>
            ) : (
              Object.entries(employee.tasksByCategory || {}).map(([category, tasks]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-3 first:mt-0">{category}</h3>
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
              ))
            )}
          </div>
        </div>

        {/* Footer Message */}
        {employee.completionPercentage === 100 && (
          <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 text-center">
            <p className="text-3xl mb-4">🎉 Congratulations! 🎉</p>
            <p className="text-2xl font-bold text-green-700 mb-2">Welcome to the Team!</p>
            <p className="text-slate-600 text-lg">
              You've successfully completed your onboarding journey. We're excited to have you here!
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
