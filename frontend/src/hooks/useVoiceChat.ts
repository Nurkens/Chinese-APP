import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Lightweight wrapper around the browser's Web Speech APIs:
 *   - SpeechRecognition for STT (push-to-talk or continuous)
 *   - SpeechSynthesis for TTS (auto-picks best Chinese voice)
 *
 * No external deps. Falls back gracefully if either API is unavailable
 * (Firefox doesn't ship SpeechRecognition; Chrome/Edge/Safari do).
 */

// Minimal type declarations — Web Speech API isn't in TS lib.dom on all targets.
interface SRResult {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
}
interface SREvent {
  resultIndex: number;
  results: { length: number; [index: number]: SRResult };
}
interface SRErrorEvent {
  error: string;
  message?: string;
}
interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SRInstance };
    webkitSpeechRecognition?: { new (): SRInstance };
  }
}

export type VoiceLang = 'zh-CN' | 'en-US';

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'denied'
  | 'unsupported';

interface UseVoiceChatOptions {
  defaultLang?: VoiceLang;
  chineseOnly?: boolean; // TTS: speak only Chinese characters, skip pinyin/English
}

interface UseVoiceChatReturn {
  // capability flags
  sttSupported: boolean;
  ttsSupported: boolean;

  // state
  state: VoiceState;
  interimText: string;
  finalText: string;
  lang: VoiceLang;
  errorMessage: string | null;

  // controls
  setLang: (l: VoiceLang) => void;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  cancelSpeak: () => void;
  resetTranscripts: () => void;
}

const PUNCTUATION_FOR_NATURAL_SPEECH = /[*_`#>~]/g; // strip markdown markers

/** Keep Chinese characters + basic CJK punctuation; drop the rest. */
const stripToChinese = (text: string): string => {
  return text.replace(/[^㐀-鿿　-〿＀-￯\s。，！？、：；]/g, ' ').replace(/\s+/g, ' ').trim();
};

const stripMarkdown = (text: string): string => {
  return text
    .replace(/```[\s\S]*?```/g, ' ') // code fences
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(PUNCTUATION_FOR_NATURAL_SPEECH, '');
};

export function useVoiceChat(opts: UseVoiceChatOptions = {}): UseVoiceChatReturn {
  const [lang, setLang] = useState<VoiceLang>(opts.defaultLang || 'zh-CN');
  const [state, setState] = useState<VoiceState>('idle');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voicesReady, setVoicesReady] = useState(false);

  const recRef = useRef<SRInstance | null>(null);
  const chineseOnlyRef = useRef(opts.chineseOnly ?? false);
  chineseOnlyRef.current = opts.chineseOnly ?? false;

  const sttSupported = useMemo(
    () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    [],
  );

  const ttsSupported = useMemo(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    [],
  );

  // Some browsers populate voices async — wait for them so we can pick zh-CN.
  useEffect(() => {
    if (!ttsSupported) return;
    const synth = window.speechSynthesis;
    const populate = () => {
      if (synth.getVoices().length > 0) setVoicesReady(true);
    };
    populate();
    synth.addEventListener?.('voiceschanged', populate);
    return () => synth.removeEventListener?.('voiceschanged', populate);
  }, [ttsSupported]);

  const pickBestVoice = useCallback(
    (utterLang: string) => {
      if (!ttsSupported) return null;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return null;
      // Prefer exact lang match, then prefix match, then any zh-* for Chinese
      const exact = voices.find((v) => v.lang === utterLang);
      if (exact) return exact;
      const prefix = utterLang.split('-')[0];
      const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
      if (prefixMatch) return prefixMatch;
      return voices[0];
    },
    [ttsSupported],
  );

  // ---------- STT ----------

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const startListening = useCallback(() => {
    if (!sttSupported) {
      setState('unsupported');
      return;
    }
    setErrorMessage(null);
    setInterimText('');
    setFinalText('');

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    // Cancel any in-flight session before starting a new one
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch {
        /* ignore */
      }
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setState('listening');

    rec.onresult = (e: SREvent) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) final += text;
        else interim += text;
      }
      if (interim) setInterimText(interim);
      if (final) {
        setFinalText((prev) => (prev + ' ' + final).trim());
        setInterimText('');
      }
    };

    rec.onerror = (e: SRErrorEvent) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setState('denied');
        setErrorMessage('Microphone permission was blocked');
      } else if (e.error === 'no-speech') {
        // benign — user just didn't speak; reset to idle without surfacing
        setState('idle');
      } else if (e.error === 'aborted') {
        // user-initiated cancel
        setState('idle');
      } else {
        setErrorMessage(e.message || `Speech recognition error: ${e.error}`);
        setState('idle');
      }
    };

    rec.onend = () => {
      // Only reset to idle if we weren't already moved elsewhere by onerror
      setState((s) => (s === 'listening' ? 'idle' : s));
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not start microphone');
      setState('idle');
    }
  }, [sttSupported, lang]);

  // ---------- TTS ----------

  const cancelSpeak = useCallback(() => {
    if (!ttsSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    setState((s) => (s === 'speaking' ? 'idle' : s));
  }, [ttsSupported]);

  const speak = useCallback(
    (rawText: string) => {
      if (!ttsSupported || !rawText) return;

      // Stop any current utterance first to avoid queuing
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }

      const cleaned = chineseOnlyRef.current
        ? stripToChinese(rawText)
        : stripMarkdown(rawText);
      if (!cleaned) return;

      const utter = new SpeechSynthesisUtterance(cleaned);
      utter.lang = lang;
      utter.rate = 0.9; // slightly slower — easier for learners to follow
      utter.pitch = 1;
      utter.volume = 1;

      const voice = pickBestVoice(lang);
      if (voice) utter.voice = voice;

      utter.onstart = () => setState('speaking');
      utter.onend = () => setState((s) => (s === 'speaking' ? 'idle' : s));
      utter.onerror = (e: any) => {
        setState((s) => (s === 'speaking' ? 'idle' : s));
        if (e?.error !== 'interrupted' && e?.error !== 'canceled') {
          setErrorMessage(e?.error || 'TTS failed');
        }
      };

      try {
        window.speechSynthesis.speak(utter);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Could not speak');
        setState('idle');
      }
    },
    [ttsSupported, lang, pickBestVoice],
  );

  const resetTranscripts = useCallback(() => {
    setInterimText('');
    setFinalText('');
  }, []);

  // Cleanup on unmount: stop mic, cancel TTS
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      if (ttsSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* ignore */
        }
      }
    };
  }, [ttsSupported]);

  // If voices weren't ready on first render, recompute supported status
  // (this is just to suppress "unused" tooling warning; voicesReady is referenced)
  useEffect(() => {
    void voicesReady;
  }, [voicesReady]);

  return {
    sttSupported,
    ttsSupported,
    state,
    interimText,
    finalText,
    lang,
    errorMessage,
    setLang,
    startListening,
    stopListening,
    speak,
    cancelSpeak,
    resetTranscripts,
  };
}
