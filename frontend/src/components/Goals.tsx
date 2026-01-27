import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import {
  trophyOutline,
  flameOutline,
  checkmarkCircle,
  addCircle,
  closeCircle,
  trashOutline,
  createOutline,
  flame,
  trophy,
  calendar,
  checkmark,
  star,
  ribbon
} from 'ionicons/icons';
import { goalsAPI } from '../services/api';
import { useProgress } from '../contexts/ProgressContext';

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'daily' | 'weekly' | 'monthly';
  completed: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const Goals: React.FC = () => {
  const { progress, refreshProgress } = useProgress();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target: 10,
    type: 'daily' as 'daily' | 'weekly' | 'monthly'
  });

  // Icon mapping for achievements
  const iconMap: { [key: string]: string } = {
    flame: flame,
    trophy: trophy,
    calendar: calendar,
    checkmark: checkmark,
    star: star,
    ribbon: ribbon
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Refresh progress from context and load goals/achievements
      await refreshProgress();
      const [goalsData, achievementsData] = await Promise.all([
        goalsAPI.getUserGoals(),
        goalsAPI.getUserAchievements(),
      ]);
      setGoals(goalsData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set default values on error
      setGoals([]);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return;

    try {
      const createdGoal = await goalsAPI.createGoal(newGoal);
      setGoals([...goals, { ...createdGoal, current: 0, completed: false }]);
      setShowNewGoalModal(false);
      setNewGoal({ title: '', description: '', target: 10, type: 'daily' });
    } catch (error) {
      console.error('Failed to create goal:', error);
      // Add locally anyway for demo
      const localGoal: Goal = {
        id: Date.now().toString(),
        ...newGoal,
        current: 0,
        completed: false
      };
      setGoals([...goals, localGoal]);
      setShowNewGoalModal(false);
      setNewGoal({ title: '', description: '', target: 10, type: 'daily' });
    }
  };

  const handleUpdateProgress = async (goalId: string, increment: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newCurrent = Math.min(Math.max(0, goal.current + increment), goal.target);
    const completed = newCurrent >= goal.target;

    try {
      await goalsAPI.updateGoalProgress(goalId, newCurrent);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }

    // Update locally
    setGoals(goals.map(g =>
      g.id === goalId
        ? { ...g, current: newCurrent, completed }
        : g
    ));
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      // Try to delete on backend
      await fetch(`http://localhost:3000/goals/${goalId}?userId=guest`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
    // Remove locally
    setGoals(goals.filter(g => g.id !== goalId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary">Goals & Progress</h1>
          <p className="text-amber-200/60 mt-1">Track your achievements and set new goals</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/20 to-amber-600/20 backdrop-blur-md rounded-2xl p-6 border border-primary/30 animate-slideUp">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
              <IonIcon icon={flameOutline} className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="text-stone-400 text-sm">Current Streak</div>
              <div className="text-white text-3xl font-light">{progress?.currentStreak || 0}</div>
              <div className="text-amber-500 text-xs">days</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-md rounded-2xl p-6 border border-green-500/30 animate-slideUp" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
              <IonIcon icon={trophyOutline} className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <div className="text-stone-400 text-sm">HSK Level</div>
              <div className="text-white text-3xl font-light">{progress?.hskLevel || 1}</div>
              <div className="text-green-400 text-xs">current level</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-md rounded-2xl p-6 border border-blue-500/30 animate-slideUp" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <IonIcon icon={checkmarkCircle} className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <div className="text-stone-400 text-sm">Words Learned</div>
              <div className="text-white text-3xl font-light">{progress?.totalWords || 0}</div>
              <div className="text-blue-400 text-xs">total words</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-primary">Active Goals</h2>
          <button
            onClick={() => setShowNewGoalModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition-all hover:scale-105"
          >
            <IonIcon icon={addCircle} className="w-5 h-5" />
            <span className="text-sm">New Goal</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <IonIcon icon={trophyOutline} className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No active goals yet.</p>
            <p className="text-sm mt-2">Click "New Goal" to create your first goal!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <div
                key={goal.id}
                className={`bg-stone-900/50 rounded-2xl p-6 border transition-all animate-slideUp ${
                  goal.completed
                    ? 'border-green-500/50 bg-green-900/20'
                    : 'border-stone-700 hover:border-primary/30'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {goal.completed && (
                      <IonIcon icon={checkmarkCircle} className="w-6 h-6 text-green-400" />
                    )}
                    <div>
                      <h3 className={`font-medium text-lg ${goal.completed ? 'text-green-400' : 'text-white'}`}>
                        {goal.title}
                      </h3>
                      <p className="text-stone-400 text-sm mt-1">{goal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs ${
                      goal.type === 'daily' ? 'bg-blue-500/20 text-blue-400' :
                      goal.type === 'weekly' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {goal.type}
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 text-stone-500 hover:text-red-400 transition-colors"
                      title="Delete goal"
                    >
                      <IonIcon icon={trashOutline} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Progress</span>
                    <span className="text-white">{goal.current} / {goal.target}</span>
                  </div>
                  <div className="w-full bg-stone-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal.completed
                          ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                          : 'bg-gradient-to-r from-primary to-amber-500'
                      }`}
                      style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-amber-500">
                      {goal.completed ? '✓ Completed!' : `${Math.round((goal.current / goal.target) * 100)}% Complete`}
                    </div>
                    {!goal.completed && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateProgress(goal.id, -1)}
                          className="px-3 py-1 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-sm transition-colors"
                          disabled={goal.current <= 0}
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleUpdateProgress(goal.id, 1)}
                          className="px-3 py-1 bg-primary/80 hover:bg-primary text-white rounded-lg text-sm transition-colors"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleUpdateProgress(goal.id, 5)}
                          className="px-3 py-1 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                        >
                          +5
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
        <h2 className="text-xl font-light text-primary mb-6">Achievements</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement, index) => (
            <div
              key={achievement.id}
              className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:scale-105 animate-slideUp ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-primary/20 to-amber-600/20 border-primary/30 cursor-pointer'
                  : 'bg-stone-900/30 border-stone-700 opacity-60'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {achievement.unlocked && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
              )}

              <div className="relative flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  achievement.unlocked ? 'bg-primary/20' : 'bg-stone-800/50'
                }`}>
                  <IonIcon
                    icon={iconMap[achievement.icon] || trophyOutline}
                    className={`w-8 h-8 ${achievement.unlocked ? 'text-primary' : 'text-stone-600'}`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${achievement.unlocked ? 'text-white' : 'text-stone-500'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm ${achievement.unlocked ? 'text-amber-200/60' : 'text-stone-600'}`}>
                    {achievement.description}
                  </p>
                </div>
                {achievement.unlocked && (
                  <IonIcon icon={checkmarkCircle} className="w-6 h-6 text-green-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Goal Modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-stone-800 rounded-3xl p-8 w-full max-w-md border border-amber-700/30 animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-primary">Create New Goal</h3>
              <button
                onClick={() => setShowNewGoalModal(false)}
                className="p-2 text-stone-400 hover:text-white transition-colors"
              >
                <IonIcon icon={closeCircle} className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-stone-400 text-sm mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Learn 10 new words"
                  className="w-full px-4 py-3 bg-stone-700/50 text-white placeholder-stone-500 rounded-xl border border-stone-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-stone-400 text-sm mb-2">Description</label>
                <input
                  type="text"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="e.g., Practice vocabulary daily"
                  className="w-full px-4 py-3 bg-stone-700/50 text-white placeholder-stone-500 rounded-xl border border-stone-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-stone-400 text-sm mb-2">Target</label>
                <input
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="1000"
                  className="w-full px-4 py-3 bg-stone-700/50 text-white rounded-xl border border-stone-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-stone-400 text-sm mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewGoal({ ...newGoal, type })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        newGoal.type === type
                          ? type === 'daily' ? 'bg-blue-500 text-white' :
                            type === 'weekly' ? 'bg-purple-500 text-white' :
                            'bg-orange-500 text-white'
                          : 'bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateGoal}
                disabled={!newGoal.title.trim()}
                className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-primary to-amber-600 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
