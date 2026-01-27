import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { userAPI } from '../services/api';

interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  hskLevel: number;
  totalWords: number;
  targetWords: number;
}

interface LearnedWord {
  id: string;
  wordId: string;
  mastery: number;
  reviewCount: number;
  lastReview: string;
  word: {
    id: string;
    chinese: string;
    pinyin: string;
    translation: string;
    hskLevel: number;
  };
}

interface ProgressContextType {
  progress: UserProgress | null;
  learnedWords: LearnedWord[];
  learnedWordIds: Set<string>;
  loading: boolean;
  refreshProgress: () => Promise<void>;
  markWordAsLearned: (wordId: string) => Promise<boolean>;
  isWordLearned: (wordId: string) => boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [learnedWordIds, setLearnedWordIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refreshProgress = useCallback(async () => {
    try {
      setLoading(true);
      const [progressData, learnedData] = await Promise.all([
        userAPI.getProgress(),
        userAPI.getLearnedWords(),
      ]);

      setProgress(progressData);
      setLearnedWords(learnedData || []);

      // Build set of learned word IDs for quick lookup
      const ids = new Set<string>((learnedData || []).map((lw: LearnedWord) => lw.wordId));
      setLearnedWordIds(ids);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const markWordAsLearned = useCallback(async (wordId: string): Promise<boolean> => {
    try {
      await userAPI.markWordAsLearned(wordId);

      // Update local state immediately
      setLearnedWordIds(prev => new Set(prev).add(wordId));

      // Update progress
      if (progress && !learnedWordIds.has(wordId)) {
        setProgress({
          ...progress,
          totalWords: progress.totalWords + 1,
        });
      }

      // Refresh from server for accurate data
      await refreshProgress();

      return true;
    } catch (error) {
      console.error('Failed to mark word as learned:', error);
      return false;
    }
  }, [progress, learnedWordIds, refreshProgress]);

  const isWordLearned = useCallback((wordId: string): boolean => {
    return learnedWordIds.has(wordId);
  }, [learnedWordIds]);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        learnedWords,
        learnedWordIds,
        loading,
        refreshProgress,
        markWordAsLearned,
        isWordLearned,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
