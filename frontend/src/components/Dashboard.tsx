import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { home, book, location, person, flame, schoolOutline, peopleOutline, brushOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { wordsAPI, userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import WordLibrary from './WordLibrary';
import Goals from './Goals';
import Profile from './Profile';
import ReviewSession from './ReviewSession';
import Friends from './Friends';
import HanziWriter from './anime/HanziPractice/HanziWriter';
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
    <div className="min-h-screen bg-linear-to-br from-stone-900 via-amber-950 to-stone-900">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl"></div>

      {/* Desktop Layout Container */}
      <div className="relative min-h-screen max-w-7xl mx-auto p-8">
        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between mb-12 bg-stone-900/50 backdrop-blur-xl rounded-2xl p-6 border border-amber-700/20">
            {/* Left: Logo & User */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🐼</span>
                </div>
                <div>
                  <h2 className="text-primary text-xl font-medium">Journey of Words</h2>
                  <p className="text-amber-200/60 text-sm">Welcome back, {user?.username || 'Warrior'}</p>
                </div>
              </div>
            </div>

            {/* Right: Stats & Logout */}
            <div className="flex items-center gap-4">
              {/* Streak */}
              <div className="flex items-center gap-2 bg-stone-800/60 backdrop-blur-md px-5 py-3 rounded-xl border border-amber-700/30">
                <IonIcon icon={flame} className="w-5 h-5 text-orange-500" />
                <span className="text-white font-medium">{progress?.currentStreak || 0}-day streak</span>
              </div>

              {/* HSK Level */}
              <div className="bg-stone-800/60 backdrop-blur-md px-5 py-3 rounded-xl border border-amber-700/30">
                <span className="text-white font-medium">HSK {progress?.hskLevel || 1}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-5 py-3 bg-stone-800/60 hover:bg-stone-700/60 text-amber-200 rounded-xl border border-amber-700/30 transition-all"
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
                <div className="space-y-8">
                  {/* Today's Character Card */}
                  <div className="bg-linear-to-br from-stone-800/80 to-stone-900/80 backdrop-blur-xl rounded-3xl p-10 border border-amber-700/20 shadow-2xl">
                    <h2 className="text-amber-600 text-sm font-medium tracking-widest mb-6">
                      TODAY'S CHARACTER
                    </h2>

                    {/* Character Display */}
                    <div className="mb-8">
                      <div className="text-2xl text-amber-500 mb-4">今天汉字</div>
                      <div className="flex items-baseline gap-4">
                        <IonIcon icon={flame} className="w-6 h-6 text-orange-500" />
                        <span className="text-white text-4xl font-light">
                          {todayWord?.chinese || '...'} - {todayWord?.pinyin || '...'} / {todayWord?.translation || '...'}
                        </span>
                      </div>
                      {todayWord?.example && (
                        <p className="text-amber-200/60 text-base mt-4 ml-10">
                          Example: {todayWord.example}
                        </p>
                      )}
                    </div>

                    {/* Character Visual Placeholder */}
                    <div className="w-24 h-24 bg-stone-700/50 rounded-2xl border border-amber-700/30 mb-8"></div>

                    {/* Review Button */}
                    <button
                      onClick={() => setActiveTab('review')}
                      className="w-full bg-linear-to-r from-primary/80 to-amber-600/80 hover:from-primary hover:to-amber-600 text-white font-medium py-4 rounded-xl border border-amber-700/30 transition-all duration-200 hover:shadow-lg"
                    >
                      START REVIEW SESSION
                    </button>
                  </div>

                  {/* Progress Section */}
                  <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-8 border border-amber-700/20">
                    <h3 className="text-primary text-lg font-medium tracking-widest mb-6">
                      YOUR PROGRESS
                    </h3>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-stone-700/50 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-linear-to-r from-primary to-amber-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress ? Math.round((progress.totalWords / progress.targetWords) * 100) : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white text-lg font-medium">
                        {progress?.totalWords || 0}/{progress?.targetWords || 1200} words
                      </span>
                      <span className="text-amber-500 text-base">
                        {progress ? Math.round((progress.totalWords / progress.targetWords) * 100) : 0}% Complete
                      </span>
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
            </div>

            {/* Right Column - Navigation */}
            <div className="space-y-6">
              <nav className="bg-stone-800/80 backdrop-blur-xl rounded-3xl p-6 border border-amber-700/20">
                <h3 className="text-primary text-sm font-medium tracking-widest mb-6">NAVIGATION</h3>
                <div className="space-y-3">
                  {/* Menu */}
                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${
                      activeTab === 'menu'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-stone-400 hover:text-stone-300 hover:bg-stone-700/30'
                    }`}
                  >
                    <IonIcon icon={home} className="w-6 h-6" />
                    <span className="font-medium">Dashboard</span>
                  </button>

                  {/* Scroll */}
                  <button
                    onClick={() => setActiveTab('scroll')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${
                      activeTab === 'scroll'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-stone-400 hover:text-stone-300 hover:bg-stone-700/30'
                    }`}
                  >
                    <IonIcon icon={book} className="w-6 h-6" />
                    <span className="font-medium">Word Library</span>
                  </button>

                  {/* Review Session (SRS) */}
                  <button
                    onClick={() => setActiveTab('review')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${
                      activeTab === 'review'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-stone-400 hover:text-stone-300 hover:bg-stone-700/30'
                    }`}
                  >
                    <IonIcon icon={schoolOutline} className="w-6 h-6" />
                    <span className="font-medium">Review (SRS)</span>
                  </button>

                  {/* Goals */}
                  <button
                    onClick={() => setActiveTab('goals')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${
                      activeTab === 'goals'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-stone-400 hover:text-stone-300 hover:bg-stone-700/30'
                    }`}
                  >
                    <IonIcon icon={location} className="w-6 h-6" />
                    <span className="font-medium">Goals & Progress</span>
                  </button>

                  {/* Friends */}
                  <button
                    onClick={() => setActiveTab('friends')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${
                      activeTab === 'friends'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-stone-400 hover:text-stone-300 hover:bg-stone-700/30'
                    }`}
                  >
                    <IonIcon icon={peopleOutline} className="w-6 h-6" />
                    <span className="font-medium">Friends</span>
                  </button>

                  {/* Profile */}
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${
                      activeTab === 'profile'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-stone-400 hover:text-stone-300 hover:bg-stone-700/30'
                    }`}
                  >
                    <IonIcon icon={person} className="w-6 h-6" />
                    <span className="font-medium">Profile</span>
                  </button>

                  {/* Hanzi Practice */}
                  <button
                    onClick={() => setShowHanziPractice(true)}
                    className="w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all text-stone-400 hover:text-stone-300 hover:bg-stone-700/30"
                  >
                    <IonIcon icon={brushOutline} className="w-6 h-6" />
                    <span className="font-medium">Hanzi Practice</span>
                  </button>
                </div>
              </nav>

              {/* Stats Card */}
              <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20">
                <h3 className="text-primary text-sm font-medium tracking-widest mb-4">STATS</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Current Level</span>
                    <span className="text-white font-medium">HSK {progress?.hskLevel || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Current Streak</span>
                    <span className="text-white font-medium">{progress?.currentStreak || 0} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Words Learned</span>
                    <span className="text-white font-medium">{progress?.totalWords || 0}</span>
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
