import React, { useCallback, useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  refreshOutline,
  sparklesOutline,
  warningOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI, DailyStory as Story } from '../../services/ai';
import { useToast } from '../../contexts/ToastContext';

const STORAGE_REVEAL_KEY = 'app:story-reveal-prefs';

interface RevealPrefs {
  pinyin: boolean;
  translation: boolean;
}

const loadReveal = (): RevealPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_REVEAL_KEY);
    if (raw) return { pinyin: true, translation: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { pinyin: true, translation: false };
};

const saveReveal = (r: RevealPrefs) => {
  try {
    localStorage.setItem(STORAGE_REVEAL_KEY, JSON.stringify(r));
  } catch {
    /* ignore */
  }
};

const DailyStory: React.FC = () => {
  const toast = useToast();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<RevealPrefs>(loadReveal);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await aiAPI.storyToday();
      setStory(s);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not load today\'s story';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleReveal = (key: keyof RevealPrefs) => {
    const next = { ...reveal, [key]: !reveal[key] };
    setReveal(next);
    saveReveal(next);
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    if (story && story.remainingRegens <= 0) {
      toast.info('Daily regenerate limit reached — come back tomorrow.');
      return;
    }
    setRegenerating(true);
    try {
      const fresh = await aiAPI.storyRegenerate();
      setStory(fresh);
      toast.success('Fresh story baked! 🥟');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Regeneration failed';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setRegenerating(false);
    }
  };

  // ---------- render ----------

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-stone-800/60 to-stone-900/60 backdrop-blur-md rounded-3xl p-8 border border-primary/30 shadow-xl">
        <SkeletonStory />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-stone-800/60 to-stone-900/60 backdrop-blur-md rounded-3xl p-6 border border-amber-700/30 shadow-xl">
        <div className="flex items-start gap-3 text-amber-300 text-sm">
          <IonIcon icon={warningOutline} className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium mb-1">Today's story isn't ready</div>
            <div className="text-amber-200/70">{error}</div>
          </div>
          <button
            onClick={load}
            className="px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-lg"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="bg-gradient-to-br from-amber-900/30 via-stone-800/60 to-stone-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-primary/30 shadow-xl hover:border-primary/50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <IonIcon icon={sparklesOutline} className="w-5 h-5 text-primary" />
          <h3 className="text-primary text-xs font-bold tracking-widest uppercase">
            Story Made For You
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleReveal('pinyin')}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
              reveal.pinyin
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'bg-stone-800/60 border-stone-700 text-stone-400'
            }`}
            aria-pressed={reveal.pinyin}
          >
            Pinyin
          </button>
          <button
            onClick={() => toggleReveal('translation')}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
              reveal.translation
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'bg-stone-800/60 border-stone-700 text-stone-400'
            }`}
            aria-pressed={reveal.translation}
          >
            English
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating || story.remainingRegens <= 0}
            className="p-1.5 rounded-lg bg-stone-800/60 hover:bg-stone-700/80 text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title={
              story.remainingRegens > 0
                ? `Regenerate (${story.remainingRegens} left today)`
                : 'No regenerations left today'
            }
          >
            <IonIcon
              icon={refreshOutline}
              className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-light text-white mb-1">{story.title}</h2>
      <div className="text-xs text-stone-500 mb-5">
        Generated for you · {new Date(story.createdAt).toLocaleDateString()}
        {story.hskLevel ? ` · HSK ${story.hskLevel}` : ''}
      </div>

      {/* Story lines */}
      <AnimatePresence mode="wait">
        <motion.div
          key={story.id + (story.isNew ? '-new' : '')}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {story.lines.map((line, i) => (
            <div
              key={i}
              className="bg-stone-900/40 border border-stone-700/40 rounded-xl px-4 py-3"
            >
              <div className="text-xl sm:text-2xl text-white leading-relaxed">
                {highlightWords(line.chinese, story.wordsUsed.map((w) => w.chinese))}
              </div>
              {reveal.pinyin && (
                <div className="text-primary/90 text-sm mt-1.5 italic">{line.pinyin}</div>
              )}
              {reveal.translation && (
                <div className="text-stone-300 text-sm mt-1">{line.translation}</div>
              )}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Words used chip rail */}
      {story.wordsUsed.length > 0 && (
        <div className="mt-5 pt-4 border-t border-stone-700/40">
          <div className="text-xs text-stone-500 mb-2">
            Words from your study list in this story:
          </div>
          <div className="flex flex-wrap gap-2">
            {story.wordsUsed.map((w) => (
              <div
                key={w.wordId + w.chinese}
                className="group relative px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm transition-all cursor-default"
                title={`${w.pinyin} — ${w.translation}`}
              >
                <span className="text-amber-200 font-medium">{w.chinese}</span>
                <span className="ml-2 text-primary/80 text-xs">{w.pinyin}</span>
                <span className="ml-2 text-stone-400 text-xs hidden sm:inline">
                  {w.translation}
                </span>
                {w.source === 'srs_weak' && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] uppercase bg-red-500/30 text-red-300 rounded-full border border-red-500/40">
                    weak
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Highlight target focus words within a Chinese sentence. Replaces matches with
 * amber-tinted spans. Operates on raw string; no XSS risk because we never
 * inject HTML — we split into React children.
 */
function highlightWords(text: string, targets: string[]): React.ReactNode {
  if (targets.length === 0) return text;
  // Sort longest-first so multi-character words win over single overlaps
  const sorted = [...new Set(targets)].filter(Boolean).sort((a, b) => b.length - a.length);
  if (sorted.length === 0) return text;

  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  outer: while (i < text.length) {
    for (const w of sorted) {
      if (text.startsWith(w, i)) {
        out.push(
          <span
            key={key++}
            className="text-amber-300 underline decoration-amber-500/40 underline-offset-4 decoration-2"
          >
            {w}
          </span>,
        );
        i += w.length;
        continue outer;
      }
    }
    out.push(text[i]);
    i++;
    key++;
  }
  return out;
}

const SkeletonStory: React.FC = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-3 w-32 bg-stone-700/60 rounded" />
    <div className="h-7 w-2/3 bg-stone-700/60 rounded mt-2" />
    <div className="space-y-2 mt-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 bg-stone-700/40 rounded-xl" />
      ))}
    </div>
  </div>
);

export default DailyStory;
