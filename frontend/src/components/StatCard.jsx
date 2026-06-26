import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = '#6366f1' }) {
  const trendColor = trend && trend.value > 0 ? '#22c55e' : '#ef4444';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div style={{ backgroundColor: `${color}15` }} className="p-2 rounded-lg">
            <Icon size={20} style={{ color }} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <div className="flex items-center gap-1">
            {trend.value > 0 ? (
              <TrendingUp size={16} color={trendColor} />
            ) : (
              <TrendingDown size={16} color={trendColor} />
            )}
            <span style={{ color: trendColor }} className="text-sm font-medium">
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
