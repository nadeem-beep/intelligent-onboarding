import { useState } from 'react';
import api from '../api/client';
import { Zap, TrendingUp, Calendar, Brain } from 'lucide-react';

const paceIcons = {
  slow: '🐢',
  normal: '⚡',
  fast: '🚀'
};

const paceColors = {
  slow: { bg: '#fef3c7', text: '#92400e' },
  normal: { bg: '#dbeafe', text: '#075985' },
  fast: { bg: '#dcfce7', text: '#166534' }
};

export default function AdaptiveLearning({ employeeId, aiEnabled }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const generateRecommendations = async () => {
    if (!aiEnabled) return;

    setLoading(true);
    try {
      const response = await api.post('/chat/recommendations', { employeeId });
      setRecommendations(response.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (!aiEnabled) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-indigo-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Adaptive Learning Path</h3>
            <p className="text-sm text-slate-600">AI-powered personalized recommendations</p>
          </div>
        </div>
        <button
          onClick={generateRecommendations}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Zap size={16} />
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {recommendations && showDetails && (
        <div className="space-y-6">
          {/* Learning Pace */}
          {recommendations.learning_pace && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp size={16} />
                Recommended Learning Pace
              </h4>
              <div
                className="inline-block px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: paceColors[recommendations.learning_pace]?.bg,
                  color: paceColors[recommendations.learning_pace]?.text
                }}
              >
                {paceIcons[recommendations.learning_pace]} {recommendations.learning_pace.toUpperCase()}
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Based on your current completion rate and task complexity
              </p>
            </div>
          )}

          {/* Estimated Completion */}
          {recommendations.estimated_completion_date && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Estimated Completion
              </h4>
              <div className="text-lg font-semibold text-indigo-600">
                {new Date(recommendations.estimated_completion_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}

          {/* Focus Areas */}
          {recommendations.focus_areas && recommendations.focus_areas.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Focus Areas</h4>
              <div className="space-y-2">
                {recommendations.focus_areas.map((area, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
                  >
                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                    <span className="text-sm text-slate-700">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Tasks */}
          {recommendations.suggested_tasks && recommendations.suggested_tasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Priority Tasks to Complete</h4>
              <div className="space-y-2">
                {recommendations.suggested_tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg border border-indigo-200"
                  >
                    <div className="text-lg">✓</div>
                    <span className="text-sm text-slate-700 flex-1">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insights */}
          {recommendations.key_insights && (
            <div className="bg-white border-l-4 border-indigo-600 p-4 rounded">
              <p className="text-sm text-slate-700 leading-relaxed">
                💡 <span className="font-semibold">Insight:</span> {recommendations.key_insights}
              </p>
            </div>
          )}
        </div>
      )}

      {!recommendations && !showDetails && (
        <div className="text-center py-8">
          <p className="text-slate-600 text-sm mb-4">
            Get AI-powered personalized recommendations to optimize your learning path
          </p>
          <p className="text-xs text-slate-500">
            The system analyzes your progress and suggests the best way forward
          </p>
        </div>
      )}
    </div>
  );
}
