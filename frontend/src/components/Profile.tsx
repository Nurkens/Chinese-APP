import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  mailOutline,
  calendarOutline,
  trophyOutline,
  flameOutline,
  bookOutline,
  settingsOutline,
  logOutOutline,
  notificationsOutline,
  alarmOutline,
  volumeHighOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from './EditProfileModal';

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onToggle, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    aria-label={label}
    disabled={disabled}
    onClick={onToggle}
    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
      enabled ? 'bg-primary' : 'bg-stone-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
        enabled ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </button>
);

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { progress, loading, refreshProgress } = useProgress();
  const { settings, saving, notificationPermission, requestNotificationPermission, updateSetting, playSound } =
    useSettings();
  const toast = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  const handleNotificationsToggle = async () => {
    const next = !settings.notificationsEnabled;
    try {
      if (next && notificationPermission !== 'granted') {
        const result = await requestNotificationPermission();
        if (result === 'denied') {
          toast.error('Notifications were blocked in your browser settings');
          return;
        }
        if (result === 'unsupported') {
          toast.error('Notifications are not supported on this device');
          return;
        }
      }
      await updateSetting('notificationsEnabled', next);
      playSound('click');
      toast.success(next ? 'Notifications enabled' : 'Notifications disabled');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const handleReminderToggle = async () => {
    const next = !settings.reminderEnabled;
    try {
      if (next) {
        if (!settings.notificationsEnabled) {
          toast.error('Enable notifications first');
          return;
        }
        if (notificationPermission !== 'granted') {
          const result = await requestNotificationPermission();
          if (result !== 'granted') {
            toast.error('Notification permission is required for reminders');
            return;
          }
        }
      }
      await updateSetting('reminderEnabled', next);
      playSound('click');
      toast.success(next ? 'Daily reminder enabled' : 'Daily reminder disabled');
    } catch {
      toast.error('Failed to update reminder');
    }
  };

  const handleReminderTimeChange = async (time: string) => {
    try {
      await updateSetting('reminderTime', time);
    } catch {
      toast.error('Failed to update reminder time');
    }
  };

  const handleSoundToggle = async () => {
    const next = !settings.soundEnabled;
    try {
      await updateSetting('soundEnabled', next);
      if (next) playSound('success');
      toast.success(next ? 'Sound effects enabled' : 'Sound effects disabled');
    } catch {
      toast.error('Failed to update sound');
    }
  };

  const stats = [
    { label: 'Words Learned', value: progress?.totalWords || 0, icon: bookOutline, color: 'primary' },
    { label: 'Current Streak', value: `${progress?.currentStreak || 0} days`, icon: flameOutline, color: 'orange-500' },
    { label: 'Best Streak', value: `${progress?.longestStreak || 0} days`, icon: trophyOutline, color: 'green-500' },
    { label: 'HSK Level', value: progress?.hskLevel || 1, icon: calendarOutline, color: 'blue-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const avatar = user?.avatar || '🐼';
  const isImageAvatar = avatar.startsWith('data:') || avatar.startsWith('http');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary">Profile</h1>
          <p className="text-amber-200/60 mt-1">Manage your account and view your statistics</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-linear-to-br from-stone-800/80 to-stone-900/80 backdrop-blur-xl rounded-3xl p-8 border border-amber-700/20 shadow-2xl animate-slideUp">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 bg-linear-to-br from-primary/20 to-amber-600/20 rounded-full flex items-center justify-center border-4 border-primary/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 overflow-hidden">
              {isImageAvatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">{avatar}</span>
              )}
            </div>
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-3xl font-light text-white">{user?.username || 'Guest User'}</h2>
              {user?.isGuest && (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-lg">Guest</span>
              )}
            </div>

            <div className="space-y-3">
              {!user?.isGuest && user?.email && (
                <div className="flex items-center gap-3 text-stone-300">
                  <IonIcon icon={mailOutline} className="w-5 h-5 text-primary" />
                  <span>{user.email}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-stone-300">
                <IonIcon icon={calendarOutline} className="w-5 h-5 text-primary" />
                <span>
                  Member since{' '}
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  playSound('click');
                  setIsEditOpen(true);
                }}
                className="px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition-all duration-200 hover:scale-105"
              >
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <IonIcon icon={logOutOutline} className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-stone-800/60 backdrop-blur-md rounded-2xl p-6 border border-stone-700 hover:border-primary/30 transition-all duration-300 hover:scale-105 animate-slideUp"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <IonIcon icon={stat.icon} className={`w-8 h-8 text-${stat.color}`} />
              <div className="text-right">
                <div className="text-2xl font-light text-white">{stat.value}</div>
              </div>
            </div>
            <div className="text-stone-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Overview */}
      <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-8 border border-amber-700/20 animate-slideUp" style={{ animationDelay: '400ms' }}>
        <h3 className="text-xl font-light text-primary mb-6">Learning Progress</h3>

        <div className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-stone-300">Overall Progress to HSK {progress?.hskLevel || 1}</span>
              <span className="text-white font-medium">
                {progress?.totalWords || 0} / {progress?.targetWords || 1200} words
              </span>
            </div>
            <div className="relative w-full bg-stone-700/50 rounded-full h-4 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-linear-to-r from-primary to-amber-500 rounded-full transition-all duration-1000 animate-progressBar"
                style={{
                  width: `${progress ? Math.min(Math.round((progress.totalWords / progress.targetWords) * 100), 100) : 0}%`
                }}
              ></div>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            </div>
            <div className="text-right text-xs text-amber-500 mt-1">
              {progress ? Math.min(Math.round((progress.totalWords / progress.targetWords) * 100), 100) : 0}% Complete
            </div>
          </div>

          {/* Next Milestone */}
          <div className="bg-stone-900/50 rounded-2xl p-6 border border-stone-700">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <IonIcon icon={trophyOutline} className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="text-white font-medium">Next Milestone</h4>
                <p className="text-stone-400 text-sm">
                  {progress && progress.totalWords < progress.targetWords
                    ? `${progress.targetWords - progress.totalWords} words to complete HSK ${progress.hskLevel}`
                    : 'Ready for next level!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-stone-800/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/20 animate-slideUp" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <IonIcon icon={settingsOutline} className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-light text-primary">Settings</h3>
        </div>

        <div className="space-y-3">
          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-stone-900/50 hover:bg-stone-900/70 rounded-xl transition-all">
            <div className="flex items-center gap-3">
              <IonIcon icon={notificationsOutline} className="w-5 h-5 text-primary" />
              <div>
                <div className="text-white">Notifications</div>
                {notificationPermission === 'denied' && (
                  <div className="text-xs text-red-400 mt-0.5">Blocked in browser settings</div>
                )}
                {notificationPermission === 'unsupported' && (
                  <div className="text-xs text-stone-500 mt-0.5">Not supported on this device</div>
                )}
              </div>
            </div>
            <Toggle
              enabled={settings.notificationsEnabled}
              onToggle={handleNotificationsToggle}
              disabled={saving || notificationPermission === 'unsupported'}
              label="Toggle notifications"
            />
          </div>

          {/* Daily Reminder */}
          <div className="p-4 bg-stone-900/50 hover:bg-stone-900/70 rounded-xl transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IonIcon icon={alarmOutline} className="w-5 h-5 text-primary" />
                <span className="text-white">Daily Reminder</span>
              </div>
              <Toggle
                enabled={settings.reminderEnabled}
                onToggle={handleReminderToggle}
                disabled={saving || notificationPermission === 'unsupported'}
                label="Toggle daily reminder"
              />
            </div>
            {settings.reminderEnabled && (
              <div className="mt-3 flex items-center justify-between gap-3 pl-8 animate-fadeIn">
                <label className="text-sm text-stone-400" htmlFor="reminder-time">
                  Remind me at
                </label>
                <input
                  id="reminder-time"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => handleReminderTimeChange(e.target.value)}
                  disabled={saving}
                  className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-primary focus:outline-none transition-all disabled:opacity-60"
                />
              </div>
            )}
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between p-4 bg-stone-900/50 hover:bg-stone-900/70 rounded-xl transition-all">
            <div className="flex items-center gap-3">
              <IonIcon icon={volumeHighOutline} className="w-5 h-5 text-primary" />
              <span className="text-white">Sound Effects</span>
            </div>
            <Toggle
              enabled={settings.soundEnabled}
              onToggle={handleSoundToggle}
              disabled={saving}
              label="Toggle sound effects"
            />
          </div>
        </div>
      </div>

      <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </div>
  );
};

export default Profile;
