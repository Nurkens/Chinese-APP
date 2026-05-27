import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { home, book, location, person, flame, schoolOutline, peopleOutline, brushOutline, sparkles } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useXiaomei } from '../contexts/XiaomeiContext';
import { wordsAPI, userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import WordLibrary from './WordLibrary';
import Goals from './Goals';
import Profile from './Profile';
import ReviewSession from './ReviewSession';
import Friends from './Friends';
import HanziWriter from './anime/HanziPractice/HanziWriter';
import AdaptiveRecommendations from './AdaptiveRecommendations';
import DailyStory from './ai/DailyStory';
import type { HanziDrawingResult } from '../types/battle.types';


interface TodayWord {
  chinese: string;
  pinyin: string;
  translation: string;
  example?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { progress, refreshProgress, loading: progressLoading } = useProgress();
  const { showMessage } = useXiaomei();
  const [activeTab, setActiveTab] = useState('menu');
  const [todayWord, setTodayWord] = useState<TodayWord | null>(null);
  const [loading, setLoading] = useState(true);

  const [showHanziPractice, setShowHanziPractice] = useState(false);
  const [practiceChars, setPracticeChars] = useState<{ chinese: string; pinyin: string; translation: string }[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/welcome');
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load today's word
        const wordData = await wordsAPI.getTodayWord();
        setTodayWord(wordData);

        // Update streak when user opens dashboard
        await userAPI.updateStreak();

        // Refresh progress from context
        await refreshProgress();
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, navigate, refreshProgress]);

  // Trigger Xiaomei message when tab changes
  useEffect(() => {
    const messageMap: Record<string, any> = {
      'menu': 'tab:menu',
      'scroll': 'tab:scroll',
      'review': 'tab:review',
      'goals': 'tab:goals',
      'friends': 'tab:friends',
      'profile': 'tab:profile',
      'adaptive': 'tab:adaptive',
    };
    
    if (messageMap[activeTab]) {
      showMessage(messageMap[activeTab] as any);
    }
  }, [activeTab, showMessage]);

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  // Load practice characters when modal opens
  useEffect(() => {
    if (!showHanziPractice) return;
    const loadChars = async () => {
      try {
        const words = await wordsAPI.getWordsByHskLevel(progress?.hskLevel || 1);
        // Filter to single characters only (hanzi-writer works with single chars)
        const singleChars = words.filter((w: any) => w.chinese.length === 1);
        if (singleChars.length > 0) {
          setPracticeChars(singleChars);
          setPracticeIndex(0);
        }
      } catch (error) {
        console.error('Failed to load practice characters:', error);
      }
    };
    loadChars();
  }, [showHanziPractice, progress?.hskLevel]);

  // Handle hanzi practice completion
  const handlePracticeComplete = (_result: HanziDrawingResult) => {
    // Auto-advance to next character after completion
    setTimeout(() => {
      if (practiceIndex < practiceChars.length - 1) {
        setPracticeIndex((prev) => prev + 1);
      }
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-stone-900 via-amber-950 to-stone-900">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-950 via-amber-950 to-stone-950">
      {/* Decorative elements - Enhanced */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" style={{ transform: 'translate(-50%, -50%)' }}></div>

      {/* Desktop Layout Container */}
      <div className="relative min-h-screen max-w-7xl mx-auto p-8">
        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Top Navigation Bar - Enhanced */}
          <div className="flex items-center justify-between mb-12 bg-gradient-to-r from-stone-800/70 to-stone-900/70 backdrop-blur-xl rounded-2xl p-7 border border-primary/30 shadow-2xl hover:border-primary/50 transition-all duration-300">
            {/* Left: Logo & User */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/40 to-amber-600/40 rounded-full flex items-center justify-center shadow-lg border border-primary/30">
                  <span className="text-3xl">🐼</span>
                </div>
                <div>
                  <h2 className="text-primary text-2xl font-bold bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">Journey of Words</h2>
                  <p className="text-amber-200/70 text-sm font-medium">Welcome back, <span className="text-amber-300">{user?.username || 'Warrior'}</span></p>
                </div>
              </div>
            </div>

            {/* Right: Stats & Logout */}
            <div className="flex items-center gap-3">
              {/* Streak */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-600/20 backdrop-blur-md px-6 py-3 rounded-xl border border-orange-500/40 shadow-lg hover:shadow-orange-500/20 transition-all">
                <IonIcon icon={flame} className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="text-white font-bold">{progress?.currentStreak || 0}-day</span>
              </div>

              {/* HSK Level */}
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 backdrop-blur-md px-6 py-3 rounded-xl border border-blue-500/40 shadow-lg hover:shadow-blue-500/20 transition-all">
                <span className="text-white font-bold">HSK {progress?.hskLevel || 1}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/40 hover:to-red-600/40 text-amber-200 rounded-xl border border-red-500/30 transition-all font-medium shadow-lg"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Dynamic Content */}
            <div className="lg:col-span-2">
              {/* Dashboard/Menu Tab */}
              {activeTab === 'menu' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Today's Character Card - Enhanced */}
                  <div className="bg-gradient-to-br from-amber-900/40 via-stone-800/50 to-stone-900/60 backdrop-blur-xl rounded-3xl p-10 border border-primary/40 shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:border-primary/60">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-amber-400 text-xs font-bold tracking-widest">✨ TODAY'S CHARACTER</h2>
                      <div className="px-3 py-1 bg-primary/30 rounded-full text-primary text-xs font-bold">Daily Challenge</div>
                    </div>

                    {/* Character Display - Enhanced */}
                    <div className="mb-10">
                      <div className="text-amber-300 text-sm font-bold tracking-wider mb-4 uppercase">今天汉字 · Hanzi of the Day</div>
                      <div className="flex items-center gap-6">
                        <div className="text-7xl font-bold text-transparent bg-gradient-to-r from-primary via-amber-400 to-orange-500 bg-clip-text drop-shadow-lg">
                          {todayWord?.chinese || '...'}
                        </div>
                        <div className="flex-1">
                          <p className="text-primary text-xl font-bold mb-2">{todayWord?.pinyin || '...'}</p>
                          <p className="text-amber-200 text-lg">{todayWord?.translation || '...'}</p>
                          {todayWord?.example && (
                            <p className="text-amber-200/70 text-sm mt-3 italic border-l-2 border-primary/50 pl-3">
                              "{todayWord.example}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Review Button - Enhanced */}
                    <button
                      onClick={() => setActiveTab('review')}
                      className="w-full bg-gradient-to-r from-primary via-amber-500 to-orange-500 hover:from-primary hover:to-amber-600 text-white font-bold py-4 rounded-xl border border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:scale-105 transform text-lg"
                    >
                      🚀 START REVIEW SESSION
                    </button>
                  </div>

                  {/* Personalized AI-generated story */}
                  <DailyStory />

                  {/* Progress Section - Enhanced */}
                  <div className="bg-gradient-to-br from-stone-800/60 to-stone-900/60 backdrop-blur-md rounded-3xl p-8 border border-primary/30 shadow-xl hover:border-primary/50 transition-all">
                    <h3 className="text-primary text-lg font-bold tracking-widest mb-6 flex items-center gap-2">
                      📊 YOUR PROGRESS
                    </h3>

                    {/* Progress Info */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-amber-200 font-semibold">
                          {progress?.totalWords || 0} / {progress?.targetWords || 1200} words
                        </span>
                        <span className="text-primary font-bold text-lg">
                          {progress ? Math.round((progress.totalWords / progress.targetWords) * 100) : 0}%
                        </span>
                      </div>
                      
                      {/* Progress Bar - Enhanced */}
                      <div className="w-full bg-stone-700/60 rounded-full h-3 overflow-hidden border border-stone-600/40 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-primary via-amber-500 to-orange-500 h-full rounded-full transition-all duration-700 shadow-lg shadow-primary/50"
                          style={{
                            width: `${progress ? Math.round((progress.totalWords / progress.targetWords) * 100) : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-stone-700/40 rounded-lg p-3 border border-stone-600/30 text-center">
                        <p className="text-stone-400 text-xs font-medium mb-1">Words/Day</p>
                        <p className="text-amber-400 font-bold text-lg">{progress ? Math.round(progress.totalWords / Math.max(progress.currentStreak, 1)) : 0}</p>
                      </div>
                      <div className="bg-stone-700/40 rounded-lg p-3 border border-stone-600/30 text-center">
                        <p className="text-stone-400 text-xs font-medium mb-1">Days Active</p>
                        <p className="text-amber-400 font-bold text-lg">{progress?.currentStreak || 0}</p>
                      </div>
                      <div className="bg-stone-700/40 rounded-lg p-3 border border-stone-600/30 text-center">
                        <p className="text-stone-400 text-xs font-medium mb-1">Remaining</p>
                        <p className="text-amber-400 font-bold text-lg">{progress ? progress.targetWords - progress.totalWords : 1200}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Word Library Tab */}
              {activeTab === 'scroll' && <WordLibrary />}

              {/* Review Session Tab */}
              {activeTab === 'review' && <ReviewSession />}

              {/* Goals Tab */}
              {activeTab === 'goals' && <Goals />}

              {/* Friends Tab */}
              {activeTab === 'friends' && <Friends />}

              {/* Profile Tab */}
              {activeTab === 'profile' && <Profile />}

              {/* Adaptive Learning Tab */}
              {activeTab === 'adaptive' && <AdaptiveRecommendations />}
            </div>

            {/* Right Column - Navigation - Enhanced */}
            <div className="space-y-6">
              {/* Navigation Card */}
              <nav className="bg-gradient-to-br from-stone-800/80 to-stone-900/80 backdrop-blur-xl rounded-3xl p-6 border border-primary/30 shadow-xl hover:border-primary/50 transition-all">
                <h3 className="text-primary text-xs font-bold tracking-widest mb-6 flex items-center gap-2">🗺️ NAVIGATION</h3>
                <div className="space-y-2">
                  {/* Menu */}
                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${
                      activeTab === 'menu'
                        ? 'bg-gradient-to-r from-primary/40 to-amber-600/40 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                        : 'text-stone-300 hover:text-primary hover:bg-stone-700/40 border border-transparent'
                    }`}
                  >
                    <IonIcon icon={home} className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>

                  {/* Scroll */}
                  <button
                    onClick={() => setActiveTab('scroll')}
                    className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${
                      activeTab === 'scroll'
                        ? 'bg-gradient-to-r from-primary/40 to-amber-600/40 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                        : 'text-stone-300 hover:text-primary hover:bg-stone-700/40 border border-transparent'
                    }`}
                  >
                    <IonIcon icon={book} className="w-5 h-5" />
                    <span>Word Library</span>
                  </button>

                  {/* Review Session (SRS) */}
                  <button
                    onClick={() => setActiveTab('review')}
                    className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${
                      activeTab === 'review'
                        ? 'bg-gradient-to-r from-primary/40 to-amber-600/40 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                        : 'text-stone-300 hover:text-primary hover:bg-stone-700/40 border border-transparent'
                    }`}
                  >
                    <IonIcon icon={schoolOutline} className="w-5 h-5" />
                    <span>Review (SRS)</span>
                  </button>

                  {/* Goals */}
                  <button
                    onClick={() => setActiveTab('goals')}
                    className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${
                      activeTab === 'goals'
                        ? 'bg-gradient-to-r from-primary/40 to-amber-600/40 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                        : 'text-stone-300 hover:text-primary hover:bg-stone-700/40 border border-transparent'
                    }`}
                  >
                    <IonIcon icon={location} className="w-5 h-5" />
                    <span>Goals & Progress</span>
                  </button>

                  {/* Friends */}
                  <button
                    onClick={() => setActiveTab('friends')}
                    className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${
                      activeTab === 'friends'
                        ? 'bg-gradient-to-r from-primary/40 to-amber-600/40 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                        : 'text-stone-300 hover:text-primary hover:bg-stone-700/40 border border-transparent'
                    }`}
                  >
                    <IonIcon icon={peopleOutline} className="w-5 h-5" />
                    <span>Friends</span>
                  </button>

                  {/* Profile */}
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${
                      activeTab === 'profile'
                        ? 'bg-gradient-to-r from-primary/40 to-amber-600/40 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                        : 'text-stone-300 hover:text-primary hover:bg-stone-700/40 border border-transparent'
                    }`}
                  >
                    <IonIcon icon={person} className="w-5 h-5" />
                    <span>Profile</span>
                  </button>

                  {/* Hanzi Practice */}
                  <button
                    onClick={() => {
                      showMessage('tab:hanzi');
                      setShowHanziPractice(true);
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium text-stone-300 hover:text-primary hover:bg-stone-700/40 border border-transparent"
                  >
                    <IonIcon icon={brushOutline} className="w-5 h-5" />
                    <span>Hanzi Practice</span>
                  </button>

                  {/* Adaptive Learning */}
                  <button
                    onClick={() => setActiveTab('adaptive')}
                    className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${
                      activeTab === 'adaptive'
                        ? 'bg-gradient-to-r from-primary/40 to-amber-600/40 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                        : 'text-stone-300 hover:text-primary hover:bg-stone-700/40 border border-transparent'
                    }`}
                  >
                    <IonIcon icon={sparkles} className="w-5 h-5" />
                    <span>AI Learning Plan</span>
                  </button>
                </div>
              </nav>

              {/* Stats Card - Enhanced */}
              <div className="bg-gradient-to-br from-stone-800/80 to-stone-900/80 backdrop-blur-md rounded-3xl p-6 border border-primary/30 shadow-xl hover:border-primary/50 transition-all">
                <h3 className="text-primary text-xs font-bold tracking-widest mb-6 flex items-center gap-2">📈 STATS</h3>
                <div className="space-y-4">
                  {/* HSK Level */}
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/30">
                    <p className="text-stone-400 text-xs font-medium mb-1">Current Level</p>
                    <p className="text-blue-300 font-bold text-2xl">HSK {progress?.hskLevel || 1}</p>
                  </div>

                  {/* Current Streak */}
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-xl p-4 border border-orange-500/30">
                    <p className="text-stone-400 text-xs font-medium mb-1">Current Streak</p>
                    <p className="text-orange-300 font-bold text-2xl">{progress?.currentStreak || 0} 🔥</p>
                  </div>

                  {/* Words Learned */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30">
                    <p className="text-stone-400 text-xs font-medium mb-1">Words Learned</p>
                    <p className="text-purple-300 font-bold text-2xl">{progress?.totalWords || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hanzi Practice Modal */}
      {showHanziPractice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'auto',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
            {/* Close button */}
            <button
              onClick={() => setShowHanziPractice(false)}
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#D4AF37',
                color: '#1A0E2E',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                fontWeight: 'bold',
                zIndex: 10,
              }}
            >
              ✕
            </button>

            {/* Character info header */}
            {practiceChars.length > 0 && (
              <div style={{
                marginBottom: '16px',
                textAlign: 'center',
                color: '#FFD700',
              }}>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                  {practiceIndex + 1} / {practiceChars.length}
                </div>
                <div style={{ fontSize: '18px', marginTop: '4px' }}>
                  <span style={{ color: '#fff' }}>{practiceChars[practiceIndex].pinyin}</span>
                  <span style={{ color: '#A0AEC0', marginLeft: '12px' }}>{practiceChars[practiceIndex].translation}</span>
                </div>
              </div>
            )}

            {/* HanziWriter */}
            {practiceChars.length > 0 ? (
              <HanziWriter
                key={practiceChars[practiceIndex].chinese}
                character={practiceChars[practiceIndex].chinese}
                onComplete={handlePracticeComplete}
                showHints={true}
                showOutline={true}
                size={400}
              />
            ) : (
              <div style={{ color: '#A0AEC0', fontSize: '18px', padding: '40px' }}>
                Loading characters...
              </div>
            )}

            {/* Prev / Next buttons */}
            {practiceChars.length > 1 && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button
                  onClick={() => setPracticeIndex((prev) => Math.max(0, prev - 1))}
                  disabled={practiceIndex === 0}
                  style={{
                    padding: '10px 28px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: practiceIndex === 0 ? 'rgba(255,255,255,0.1)' : '#D4AF37',
                    color: practiceIndex === 0 ? '#666' : '#1A0E2E',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: practiceIndex === 0 ? 'default' : 'pointer',
                  }}
                >
                  Prev
                </button>
                <button
                  onClick={() => setPracticeIndex((prev) => Math.min(practiceChars.length - 1, prev + 1))}
                  disabled={practiceIndex === practiceChars.length - 1}
                  style={{
                    padding: '10px 28px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: practiceIndex === practiceChars.length - 1 ? 'rgba(255,255,255,0.1)' : '#D4AF37',
                    color: practiceIndex === practiceChars.length - 1 ? '#666' : '#1A0E2E',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: practiceIndex === practiceChars.length - 1 ? 'default' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
