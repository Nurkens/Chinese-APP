import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { userAPI, UserSettings } from '../services/api';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'app:user-settings';

const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  reminderEnabled: false,
  reminderTime: '19:00',
  soundEnabled: true,
};

type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface SettingsContextType {
  settings: UserSettings;
  loading: boolean;
  saving: boolean;
  notificationPermission: NotificationPermissionState;
  requestNotificationPermission: () => Promise<NotificationPermissionState>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  playSound: (kind?: 'click' | 'success' | 'error') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const readLocalSettings = (): UserSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const writeLocalSettings = (s: UserSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
};

const getNotificationPermission = (): NotificationPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(readLocalSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>(getNotificationPermission());

  // Audio cache — one AudioContext lazily created on first use (browsers require gesture)
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Reminder timer
  const reminderTimerRef = useRef<number | null>(null);

  // Load settings from backend whenever user changes
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    setLoading(true);
    userAPI
      .getSettings()
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        writeLocalSettings(data);
      })
      .catch(() => {
        // fall back to local; not fatal
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  // Schedule daily reminder
  useEffect(() => {
    const clear = () => {
      if (reminderTimerRef.current !== null) {
        window.clearTimeout(reminderTimerRef.current);
        reminderTimerRef.current = null;
      }
    };
    clear();

    if (
      !settings.reminderEnabled ||
      !settings.notificationsEnabled ||
      notificationPermission !== 'granted'
    ) {
      return clear;
    }

    const schedule = () => {
      const [hh, mm] = settings.reminderTime.split(':').map(Number);
      if (Number.isNaN(hh) || Number.isNaN(mm)) return;
      const now = new Date();
      const next = new Date();
      next.setHours(hh, mm, 0, 0);
      if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1);
      }
      const delay = next.getTime() - now.getTime();
      reminderTimerRef.current = window.setTimeout(() => {
        try {
          if (Notification.permission === 'granted') {
            new Notification('Time to study Chinese! 学习时间到了 🐼', {
              body: 'Keep your streak alive — your daily review is waiting.',
              icon: '/favicon.png',
              tag: 'daily-reminder',
            });
          }
        } catch {
          /* ignore */
        }
        // Reschedule for next day
        schedule();
      }, delay);
    };

    schedule();
    return clear;
  }, [
    settings.reminderEnabled,
    settings.notificationsEnabled,
    settings.reminderTime,
    notificationPermission,
  ]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      return 'unsupported' as const;
    }
    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result as NotificationPermissionState);
      return result as NotificationPermissionState;
    } catch {
      const current = getNotificationPermission();
      setNotificationPermission(current);
      return current;
    }
  }, []);

  const updateSetting = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      // Optimistic update
      const prev = settings;
      const next = { ...prev, [key]: value };
      setSettings(next);
      writeLocalSettings(next);

      if (!isAuthenticated) return;

      setSaving(true);
      try {
        const saved = await userAPI.updateSettings({ [key]: value } as Partial<UserSettings>);
        setSettings(saved);
        writeLocalSettings(saved);
      } catch (err) {
        // Rollback on failure
        setSettings(prev);
        writeLocalSettings(prev);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [settings, isAuthenticated],
  );

  const playSound = useCallback(
    (kind: 'click' | 'success' | 'error' = 'click') => {
      if (!settings.soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const Ctor =
            (window as any).AudioContext || (window as any).webkitAudioContext;
          if (!Ctor) return;
          audioCtxRef.current = new Ctor();
        }
        const ctx = audioCtxRef.current!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freq = kind === 'success' ? 880 : kind === 'error' ? 220 : 600;
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {
        /* ignore audio errors */
      }
    },
    [settings.soundEnabled],
  );

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      loading,
      saving,
      notificationPermission,
      requestNotificationPermission,
      updateSetting,
      playSound,
    }),
    [settings, loading, saving, notificationPermission, requestNotificationPermission, updateSetting, playSound],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
};
