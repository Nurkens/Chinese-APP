import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type TutorTrigger =
  | 'login'
  | 'tab:menu'
  | 'tab:scroll'
  | 'tab:review'
  | 'tab:goals'
  | 'tab:friends'
  | 'tab:profile'
  | 'review:complete'
  | 'word:learned'
  | 'streak:updated'
  | 'idle';

interface TutorEvent {
  trigger: TutorTrigger;
  key: number; // incrementing key so same trigger still fires a new effect
}

interface TutorContextType {
  event: TutorEvent;
  username: string;
  streak: number;
  fire: (trigger: TutorTrigger, meta?: { username?: string; streak?: number }) => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export const TutorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [event, setEvent] = useState<TutorEvent>({ trigger: 'login', key: 0 });
  const [username, setUsername] = useState('');
  const [streak, setStreak] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(0);

  const fire = useCallback((trigger: TutorTrigger, meta?: { username?: string; streak?: number }) => {
    if (meta?.username) setUsername(meta.username);
    if (meta?.streak !== undefined) setStreak(meta.streak);

    // Debounce rapid fires (e.g. tab switching)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      keyRef.current += 1;
      setEvent({ trigger, key: keyRef.current });
    }, 150);
  }, []);

  return (
    <TutorContext.Provider value={{ event, username, streak, fire }}>
      {children}
    </TutorContext.Provider>
  );
};

export const useTutor = () => {
  const ctx = useContext(TutorContext);
  if (!ctx) throw new Error('useTutor must be inside TutorProvider');
  return ctx;
};
