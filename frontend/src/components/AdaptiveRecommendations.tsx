import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { flame, bulb, trendingUp, warning, checkmark, shield } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { adaptiveAPI } from '../services/api';

interface AdaptiveRecommendation {
  wordId: string;
  word: any;
  recommendationScore: number;
  reason: string;
  category: 'review_soon' | 'at_risk' | 'master' | 'challenge';
}

interface PerformanceMetrics {
  accuracyRate: number;
  avgReviewsPerDay: number;
  cardsLearned: number;
  retentionRate: number;
  difficultWords: string[];
  easyWords: string[];
}

interface LearningInsight {
  type: string;
  level: string;
  message: string;
  suggestion: string;
}

export interface AdaptiveDashboardData {
  metrics: PerformanceMetrics;
  recommendations: AdaptiveRecommendation[];
  insights: LearningInsight[];
  levelAdjustment: {
    newLevel: number;
    reason: string;
  };
}

const AdaptiveRecommendations: React.FC = () => {
  const [data, setData] = useState<AdaptiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdaptiveData();
  }, []);

  const loadAdaptiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const adaptiveData = await adaptiveAPI.getDashboard();
      setData(adaptiveData);
    } catch (err) {
      console.error('Error loading adaptive data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load adaptive learning data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-stone-400 text-center py-8">
        <div className="animate-spin text-primary text-3xl mb-3">⚙️</div>
        Analyzing your learning...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-6 rounded-xl">
          <p className="font-semibold mb-2">⚠️ Error Loading Adaptive Data</p>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={loadAdaptiveData}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.metrics) return null;

  const { metrics, recommendations = [], insights = [], levelAdjustment } = data;

  return (
    <div className="space-y-8">
      {/* Performance Metrics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-stone-800/80 to-stone-900/80 backdrop-blur-xl rounded-3xl p-8 border border-primary/30 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
          📊 Your Learning Analytics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Accuracy */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-500/30">
            <p className="text-stone-400 text-xs font-medium mb-2">Accuracy Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-blue-300 font-bold text-3xl">{Math.round(metrics.accuracyRate * 100)}%</p>
              <IonIcon icon={checkmark} className="text-blue-400 w-5 h-5" />
            </div>
          </div>

          {/* Retention */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/30">
            <p className="text-stone-400 text-xs font-medium mb-2">Retention Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-green-300 font-bold text-3xl">{Math.round(metrics.retentionRate * 100)}%</p>
              <IonIcon icon={shield} className="text-green-400 w-5 h-5" />
            </div>
          </div>

          {/* Cards Learned */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-500/30">
            <p className="text-stone-400 text-xs font-medium mb-2">Words Learned</p>
            <p className="text-purple-300 font-bold text-3xl">{metrics.cardsLearned}</p>
          </div>

          {/* Daily Average */}
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl p-4 border border-orange-500/30">
            <p className="text-stone-400 text-xs font-medium mb-2">Reviews/Day</p>
            <p className="text-orange-300 font-bold text-3xl">{Math.round(metrics.avgReviewsPerDay)}</p>
          </div>
        </div>
      </motion.div>

      {/* Level Adjustment */}
      {levelAdjustment && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-500/50 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <IonIcon icon={trendingUp} className="w-6 h-6 text-amber-400 mt-1" />
            <div>
              <h3 className="text-amber-300 font-bold text-lg mb-1">Level Recommendation</h3>
              <p className="text-amber-200/80">{levelAdjustment.reason}</p>
              <p className="text-amber-300 font-bold mt-2">→ HSK Level {levelAdjustment.newLevel}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Learning Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-stone-800/80 to-stone-900/80 backdrop-blur-xl rounded-3xl p-8 border border-primary/30 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
          💡 Learning Insights
        </h2>

        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-xl p-4 border flex items-start gap-3 ${
                insight.level === 'excellent'
                  ? 'bg-green-500/10 border-green-500/30'
                  : insight.level === 'good'
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-orange-500/10 border-orange-500/30'
              }`}
            >
              <IonIcon
                icon={insight.level === 'warning' ? warning : bulb}
                className={`w-5 h-5 mt-1 ${
                  insight.level === 'excellent'
                    ? 'text-green-400'
                    : insight.level === 'good'
                    ? 'text-blue-400'
                    : 'text-orange-400'
                }`}
              />
              <div className="flex-1">
                <p className="font-semibold text-amber-100">{insight.message}</p>
                <p className="text-stone-400 text-sm mt-1">{insight.suggestion}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Smart Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-stone-800/80 to-stone-900/80 backdrop-blur-xl rounded-3xl p-8 border border-primary/30 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
          🎯 Personalized Recommendations
        </h2>

        {recommendations.length === 0 ? (
          <div className="bg-stone-800/40 rounded-xl p-8 text-center border border-stone-600/30">
            <p className="text-stone-400 mb-2">No recommendations yet</p>
            <p className="text-stone-500 text-sm">Keep reviewing words to get personalized recommendations based on the forgetting curve.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 8).map((rec, idx) => (
            <motion.div
              key={rec.wordId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-xl p-4 border-l-4 flex items-between justify-between ${
                rec.category === 'at_risk'
                  ? 'bg-red-500/10 border-l-red-500 border border-red-500/20'
                  : rec.category === 'challenge'
                  ? 'bg-yellow-500/10 border-l-yellow-500 border border-yellow-500/20'
                  : rec.category === 'master'
                  ? 'bg-green-500/10 border-l-green-500 border border-green-500/20'
                  : 'bg-blue-500/10 border-l-blue-500 border border-blue-500/20'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold text-amber-300">{rec.word.chinese}</p>
                  <div>
                    <p className="text-amber-100 font-semibold text-sm">{rec.word.pinyin}</p>
                    <p className="text-stone-400 text-xs">{rec.word.translation}</p>
                  </div>
                </div>
                <p className="text-stone-400 text-xs mt-2">{rec.reason}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-stone-700/50 rounded px-3 py-1">
                  <p className="text-primary font-bold text-sm">
                    {Math.round(rec.recommendationScore * 100)}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdaptiveRecommendations;
