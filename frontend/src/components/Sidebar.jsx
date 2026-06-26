import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, BarChart3 } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employees', icon: Users, label: 'Employees' },
    { to: '/templates', icon: FileText, label: 'Templates' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-indigo-600">Ekfrazo</h1>
        <p className="text-xs text-slate-500">Onboarding System</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive(to)
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon size={20} />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">© 2024 Ekfrazo Technologies</p>
      </div>
    </aside>
  );
}
