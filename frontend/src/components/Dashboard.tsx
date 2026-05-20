import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { 
  home, book, location, person, flame, schoolOutline, 
  peopleOutline, brushOutline, sparkles, menu, close 
} from 'ionicons/icons';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        const wordData = await wordsAPI.getTodayWord();
        setTodayWord(wordData);
        await userAPI.updateStreak();
        await refreshProgress();
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, navigate, refreshProgress]);

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

  useEffect(() => {
    if (!showHanziPractice) return;
    const loadChars = async () => {
      try {
        const words = await wordsAPI.getWordsByHskLevel(progress?.hskLevel || 1);
        const singleChars = words.filter((w: any) => w.chinese.length === 1);
        if (singleChars.length > 0) {
          setPracticeChars(singleChars);
          setPracticeIndex(0);
        }
      } catch (error) {
        console.error('Failed to load characters:', error);
      }
    };
    loadChars();
  }, [showHanziPractice, progress?.hskLevel]);

  const handleHanziResult = (result: HanziDrawingResult) => {
    if (result.isCorrect) {
      if (practiceIndex < practiceChars.length - 1) {
        setPracticeIndex(practiceIndex + 1);
      } else {
        setShowHanziPractice(false);
        showMessage('hanzi:complete' as any);
      }
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Navigation menu items
  const menuItems = [
    { id: 'menu', label: 'Menu', icon: home },
    { id: 'scroll', label: 'Words', icon: book },
    { id: 'review', label: 'Review', icon: brushOutline },
    { id: 'goals', label: 'Goals', icon: location },
    { id: 'friends', label: 'Friends', icon: peopleOutline },
    { id: 'profile', label: 'Profile', icon: person },
    { id: 'adaptive', label: 'Adaptive', icon: sparkles },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'scroll':
        return <WordLibrary />;
      case 'review':
        return <ReviewSession />;
      case 'goals':
        return <Goals />;
      case 'friends':
        return <Friends />;
      case 'profile':
        return <Profile />;
      case 'adaptive':
        return <AdaptiveRecommendations />;
      case 'menu':
      default:
        return (
          <div className="space-y-6">
            {/* Today's Character Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 sm:p-8 border border-purple-100 shadow-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-purple-900 mb-4">Today's Character</h2>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl md:text-7xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text mb-4">
                  {todayWord?.chinese || '字'}
                </div>
                <p className="text-base sm:text-lg text-purple-700 mb-2">{todayWord?.pinyin || 'pínyīn'}</p>
                <p className="text-sm sm:text-base text-purple-600">{todayWord?.translation || 'Translation'}</p>
                {todayWord?.example && (
                  <p className="text-xs sm:text-sm text-purple-500 mt-4 italic">Example: {todayWord.example}</p>
                )}
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Your Progress</h2>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm font-bold text-indigo-600">{Math.round((progress?.wordsLearned || 0) / (progress?.totalWords || 1) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((progress?.wordsLearned || 0) / (progress?.totalWords || 1) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Words Learned</p>
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{progress?.wordsLearned || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Current Streak</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                    <span className="mr-2">🔥</span>
                    {progress?.streak || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">HSK Level</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{progress?.hskLevel || 1}</p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setActiveTab('scroll');
                  setMobileMenuOpen(false);
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <IonIcon icon={book} className="text-xl" />
                <span className="text-sm sm:text-base">Browse Words</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('review');
                  setMobileMenuOpen(false);
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <IonIcon icon={brushOutline} className="text-xl" />
                <span className="text-sm sm:text-base">Review</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* ==================== NAVBAR ==================== */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">🐼</span>
              <span className="font-bold text-base sm:text-lg text-gray-800">Journey of Words</span>
            </div>

            {/* Desktop Navigation - Hidden on Mobile */}
            <div className="hidden md:flex items-center gap-8">
              <span className="text-sm text-gray-600">Welcome, {user?.name || 'Learner'}!</span>
              <div className="flex items-center gap-2 text-orange-600 font-semibold">
                <IonIcon icon={flame} className="text-xl" />
                <span>{progress?.streak || 0}</span>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                HSK {progress?.hskLevel || 1}
              </div>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-semibold transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-2xl text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IonIcon icon={mobileMenuOpen ? close : menu} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
              <p className="px-4 text-sm text-gray-600 font-medium">Welcome, {user?.name || 'Learner'}!</p>
              <div className="flex gap-2 px-4 mb-4">
                <div className="flex items-center gap-2 text-orange-600 font-semibold bg-orange-50 px-3 py-2 rounded-lg">
                  <IonIcon icon={flame} className="text-lg" />
                  <span className="text-sm">{progress?.streak || 0} Streak</span>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-semibold">
                  HSK {progress?.hskLevel || 1}
                </div>
              </div>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === item.id
                      ? 'bg-indigo-100 text-indigo-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IonIcon icon={item.icon} className="text-xl" />
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition-colors flex items-center gap-3"
              >
                <IonIcon icon={person} className="text-xl" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ==================== MAIN CONTENT GRID ==================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* ==================== LEFT COLUMN (Main Content) ==================== */}
          <div className="lg:col-span-2">
            {renderContent()}
          </div>

          {/* ==================== RIGHT SIDEBAR (Navigation + Stats) ==================== */}
          <div className="hidden md:block space-y-6">
            {/* Navigation Sidebar */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-4">Navigation</h3>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg scale-105'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IonIcon icon={item.icon} className="text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 sm:p-6 border border-indigo-100 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-indigo-200">
                  <span className="text-gray-700 text-sm">Words Learned</span>
                  <span className="font-bold text-indigo-600">{progress?.wordsLearned || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-indigo-200">
                  <span className="text-gray-700 text-sm">Streak</span>
                  <span className="font-bold text-orange-600 flex items-center gap-1">
                    🔥 {progress?.streak || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm">HSK Level</span>
                  <span className="font-bold text-green-600">{progress?.hskLevel || 1}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ==================== HANZI PRACTICE MODAL ==================== */}
      {showHanziPractice && practiceChars.length > 0 && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Hanzi Practice</h2>
              <button
                onClick={() => setShowHanziPractice(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <HanziWriter
              character={practiceChars[practiceIndex].chinese}
              pinyin={practiceChars[practiceIndex].pinyin}
              translation={practiceChars[practiceIndex].translation}
              onResult={handleHanziResult}
            />
            <p className="text-center text-gray-600 mt-4">
              Character {practiceIndex + 1} of {practiceChars.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
