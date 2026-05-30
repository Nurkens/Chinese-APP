import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  closeOutline,
  sendOutline,
  addOutline,
  trashOutline,
  refreshOutline,
  stopCircleOutline,
  warningOutline,
  menuOutline,
  serverOutline,
  micOutline,
  micOffOutline,
  volumeHighOutline,
  volumeMuteOutline,
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  aiAPI,
  AiStatus,
  ConversationDetail,
  ConversationSummary,
} from '../../services/ai';
import MiniMarkdown from './MiniMarkdown';
import { useVoiceChat, VoiceLang } from '../../hooks/useVoiceChat';

const VOICE_PREFS_KEY = 'app:xiaomei-voice-prefs';
interface VoicePrefs {
  enabled: boolean;
  lang: VoiceLang;
  autoSend: boolean; // auto-send after final transcript
  chineseOnlyTts: boolean; // speak only Chinese chars (skip pinyin/English)
  continuous: boolean; // re-arm mic after Xiao Mei finishes speaking
}

const loadVoicePrefs = (): VoicePrefs => {
  try {
    const raw = localStorage.getItem(VOICE_PREFS_KEY);
    if (raw) {
      return {
        enabled: false,
        lang: 'zh-CN',
        autoSend: true,
        chineseOnlyTts: true,
        continuous: true,
        ...JSON.parse(raw),
      };
    }
  } catch {
    /* ignore */
  }
  return { enabled: false, lang: 'zh-CN', autoSend: true, chineseOnlyTts: true, continuous: true };
};

const saveVoicePrefs = (p: VoicePrefs) => {
  try {
    localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  pending?: boolean;
  failed?: boolean;
}

const xiaomeiSrc = `${import.meta.env.BASE_URL}xiaomei.png`;

const XiaomeiChat: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [status, setStatus] = useState<AiStatus | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ---------- Voice chat ----------
  const [voicePrefs, setVoicePrefs] = useState<VoicePrefs>(loadVoicePrefs);
  const updatePrefs = (patch: Partial<VoicePrefs>) => {
    setVoicePrefs((prev) => {
      const next = { ...prev, ...patch };
      saveVoicePrefs(next);
      return next;
    });
  };

  const voice = useVoiceChat({
    defaultLang: voicePrefs.lang,
    chineseOnly: voicePrefs.chineseOnlyTts,
  });

  // Keep hook's lang in sync with prefs
  useEffect(() => {
    if (voice.lang !== voicePrefs.lang) voice.setLang(voicePrefs.lang);
  }, [voicePrefs.lang, voice]);

  // Auto-send countdown when final transcript arrives in voice mode
  const autoSendTimerRef = useRef<number | null>(null);
  const [autoSendIn, setAutoSendIn] = useState(0);

  const cancelAutoSend = useCallback(() => {
    if (autoSendTimerRef.current !== null) {
      window.clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendIn(0);
  }, []);

  // Push final transcript → textarea, optionally schedule auto-send
  useEffect(() => {
    if (!voicePrefs.enabled) return;
    if (!voice.finalText) return;
    setInput(voice.finalText);
    voice.resetTranscripts();

    if (voicePrefs.autoSend) {
      cancelAutoSend();
      let remaining = 1.5;
      setAutoSendIn(remaining);
      autoSendTimerRef.current = window.setInterval(() => {
        remaining -= 0.1;
        if (remaining <= 0) {
          cancelAutoSend();
          // Send the latest input value
          setInput((current) => {
            if (current.trim()) sendMessage(current);
            return current;
          });
        } else {
          setAutoSendIn(Math.max(0, remaining));
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.finalText]);

  // Cancel countdown on unmount / mode-off
  useEffect(() => {
    if (!voicePrefs.enabled) cancelAutoSend();
    return cancelAutoSend;
  }, [voicePrefs.enabled, cancelAutoSend]);

  // Continuous voice loop: when TTS finishes speaking and voice mode is on,
  // re-arm the mic for the next user turn.
  const prevVoiceStateRef = useRef(voice.state);
  useEffect(() => {
    const prev = prevVoiceStateRef.current;
    prevVoiceStateRef.current = voice.state;
    if (
      voicePrefs.enabled &&
      voicePrefs.continuous &&
      prev === 'speaking' &&
      voice.state === 'idle' &&
      !streaming
    ) {
      // small delay so the mic doesn't pick up the tail of TTS audio
      const t = window.setTimeout(() => voice.startListening(), 350);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [voice.state, voicePrefs.enabled, voicePrefs.continuous, streaming, voice]);

  // If voice mode is turned off mid-session, cancel any in-flight TTS / mic
  useEffect(() => {
    if (!voicePrefs.enabled) {
      voice.cancelSpeak();
      voice.stopListening();
    }
  }, [voicePrefs.enabled, voice]);

  // ---------- Loaders ----------

  const refreshConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await aiAPI.listConversations();
      setConversations(list);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  const loadConversation = useCallback(
    async (id: string) => {
      setLoadingConv(true);
      setActiveId(id);
      try {
        const conv: ConversationDetail = await aiAPI.getConversation(id);
        setMessages(conv.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })));
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to load conversation');
      } finally {
        setLoadingConv(false);
      }
    },
    [toast],
  );

  const checkStatus = useCallback(async () => {
    try {
      const s = await aiAPI.status();
      setStatus(s);
    } catch {
      setStatus((prev) =>
        prev || {
          ollama: { ok: false, models: [], chatModel: '?', embeddingModel: '?' },
          rag: { indexed: 0, bySource: {}, indexing: false, embeddingModel: '?' },
          config: {},
        },
      );
    }
  }, []);

  // ---------- Effects ----------

  useEffect(() => {
    if (!isOpen) return;
    refreshConversations();
    checkStatus();
    // Reset input focus when opened
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [isOpen, refreshConversations, checkStatus]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !streaming) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, streaming]);

  // Auto-scroll on message growth
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea up to 5 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  // Abort streaming if the modal is closed
  useEffect(() => {
    if (!isOpen && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setStreaming(false);
    }
  }, [isOpen]);

  // ---------- Actions ----------

  const handleNew = useCallback(() => {
    if (streaming) return;
    setActiveId(null);
    setMessages([]);
    setSidebarOpenMobile(false);
    setTimeout(() => textareaRef.current?.focus(), 30);
  }, [streaming]);

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm('Delete this conversation?')) return;
      try {
        await aiAPI.deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) {
          setActiveId(null);
          setMessages([]);
        }
        toast.success('Conversation deleted');
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Delete failed');
      }
    },
    [activeId, toast],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: ChatMessage = { id: `local-u-${Date.now()}`, role: 'user', content: trimmed };
      const assistantMsg: ChatMessage = {
        id: `local-a-${Date.now()}`,
        role: 'assistant',
        content: '',
        pending: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput('');
      setStreaming(true);

      let createdConvId: string | null = activeId;

      abortRef.current = aiAPI.streamChat(
        { message: trimmed, conversationId: activeId ?? undefined },
        {
          onMeta: (meta) => {
            if (meta.conversationId && !createdConvId) {
              createdConvId = meta.conversationId;
              setActiveId(meta.conversationId);
            }
            if (meta.titleUpdated) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === meta.conversationId ? { ...c, title: meta.titleUpdated! } : c,
                ),
              );
            }
          },
          onToken: (delta) => {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === 'assistant') {
                copy[copy.length - 1] = {
                  ...last,
                  content: last.content + delta,
                  pending: true,
                };
              }
              return copy;
            });
          },
          onDone: (full) => {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === 'assistant') {
                copy[copy.length - 1] = { ...last, pending: false };
              }
              return copy;
            });
            setStreaming(false);
            abortRef.current = null;
            refreshConversations();

            // Voice mode: speak the reply, then auto-rearm mic when speaking finishes
            if (voicePrefs.enabled && voice.ttsSupported && full) {
              voice.speak(full);
            }
          },
          onError: (msg) => {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === 'assistant') {
                copy[copy.length - 1] = {
                  ...last,
                  pending: false,
                  failed: true,
                  content: last.content || `⚠️ ${msg}`,
                };
              }
              return copy;
            });
            setStreaming(false);
            abortRef.current = null;
            if (msg !== 'aborted') toast.error(msg);
          },
        },
      );
    },
    [activeId, streaming, toast, refreshConversations],
  );

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === 'assistant' && last.pending) {
        copy[copy.length - 1] = { ...last, pending: false };
      }
      return copy;
    });
  };

  const handleRetry = () => {
    // Pop the last failed assistant + the user message, resend the user message
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[copy.length - 1]?.role === 'assistant') copy.pop();
      const lastUser = copy[copy.length - 1];
      if (lastUser?.role === 'user') {
        const text = lastUser.content;
        copy.pop();
        // schedule resend after state update commits
        setTimeout(() => sendMessage(text), 0);
      }
      return copy;
    });
  };

  const handleReindex = async () => {
    toast.info('Re-indexing knowledge base — this may take a minute…');
    try {
      const result = await aiAPI.reindex();
      toast.success(`Indexed ${result.total} chunks (${result.added} new)`);
      checkStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Re-index failed');
    }
  };

  const greeting = useMemo(() => {
    const name = user?.username && !user?.isGuest ? user.username : 'friend';
    return `Hi ${name}! I'm Xiao Mei 小美. Ask me anything — vocabulary, grammar, or just chat in Chinese 加油!`;
  }, [user]);

  if (!isOpen) return null;

  const ollamaDown = status && !status.ollama.ok;
  const noIndex = status && status.rag.indexed === 0;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full h-full sm:h-[88vh] sm:max-w-5xl sm:rounded-3xl overflow-hidden bg-linear-to-br from-stone-900 to-stone-950 border border-amber-700/30 shadow-2xl flex flex-col sm:flex-row animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpenMobile ? 'flex' : 'hidden'
          } sm:flex flex-col w-full sm:w-72 border-r border-stone-700/60 bg-stone-950/60 backdrop-blur-md`}
        >
          <div className="flex items-center justify-between p-4 border-b border-stone-700/60">
            <div className="flex items-center gap-2">
              <img src={xiaomeiSrc} alt="Xiaomei" className="w-8 h-8 rounded-full object-cover" />
              <div>
                <div className="text-sm text-amber-300 font-semibold leading-tight">Xiao Mei</div>
                <div className="text-[10px] text-stone-500 uppercase tracking-wider">小美 · AI tutor</div>
              </div>
            </div>
            <button
              className="sm:hidden p-1.5 rounded-lg hover:bg-stone-800"
              onClick={() => setSidebarOpenMobile(false)}
            >
              <IonIcon icon={closeOutline} className="w-5 h-5 text-stone-400" />
            </button>
          </div>

          <button
            onClick={handleNew}
            disabled={streaming}
            className="m-3 flex items-center justify-center gap-2 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition-all disabled:opacity-50"
          >
            <IonIcon icon={addOutline} className="w-5 h-5" />
            New chat
          </button>

          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {loadingList && (
              <div className="text-stone-500 text-xs px-3 py-2">Loading…</div>
            )}
            {!loadingList && conversations.length === 0 && (
              <div className="text-stone-500 text-xs px-3 py-2">No conversations yet.</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  if (streaming) return;
                  loadConversation(c.id);
                  setSidebarOpenMobile(false);
                }}
                className={`group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                  activeId === c.id
                    ? 'bg-primary/15 text-primary'
                    : 'hover:bg-stone-800/60 text-stone-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{c.title}</div>
                  <div className="text-[10px] text-stone-500">
                    {c._count.messages} message{c._count.messages === 1 ? '' : 's'}
                  </div>
                </div>
                <span
                  onClick={(e) => handleDelete(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                  aria-label="Delete"
                >
                  <IonIcon icon={trashOutline} className="w-4 h-4 text-red-400" />
                </span>
              </button>
            ))}
          </div>

          {/* Status footer */}
          <div className="p-3 border-t border-stone-700/60 text-[11px] text-stone-500 space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  status?.ollama.ok ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span className="truncate">
                Ollama: {status?.ollama.ok ? status.ollama.chatModel : 'unreachable'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IonIcon icon={serverOutline} className="w-3.5 h-3.5" />
              <span>Knowledge: {status?.rag.indexed ?? 0} chunks</span>
              <button
                onClick={handleReindex}
                className="ml-auto text-amber-400 hover:text-amber-300"
                title="Re-index knowledge"
              >
                <IonIcon icon={refreshOutline} className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main pane */}
        <section className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-700/60 bg-stone-900/40">
            <div className="flex items-center gap-2">
              <button
                className="sm:hidden p-1.5 rounded-lg hover:bg-stone-800"
                onClick={() => setSidebarOpenMobile(true)}
              >
                <IonIcon icon={menuOutline} className="w-5 h-5 text-stone-300" />
              </button>
              <h3 className="text-lg font-light text-primary">
                {activeId
                  ? conversations.find((c) => c.id === activeId)?.title || 'Chat'
                  : 'New chat with Xiao Mei'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice mode toggle */}
              {(voice.sttSupported || voice.ttsSupported) && (
                <button
                  onClick={() => {
                    const next = !voicePrefs.enabled;
                    updatePrefs({ enabled: next });
                    if (!next) {
                      voice.stopListening();
                      voice.cancelSpeak();
                    }
                  }}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    voicePrefs.enabled
                      ? 'bg-primary/25 text-primary border border-primary/50'
                      : 'bg-stone-800/60 text-stone-400 border border-stone-700 hover:bg-stone-700/60'
                  }`}
                  title="Voice conversation mode"
                >
                  <IonIcon icon={micOutline} className="w-4 h-4" />
                  Voice
                </button>
              )}
              <button
                onClick={onClose}
                disabled={streaming}
                className="p-2 rounded-xl hover:bg-stone-700/50 transition-all disabled:opacity-50"
                aria-label="Close chat"
              >
                <IonIcon icon={closeOutline} className="w-6 h-6 text-stone-300" />
              </button>
            </div>
          </header>

          {/* Status warnings */}
          {ollamaDown && (
            <div className="px-4 sm:px-6 py-2 bg-red-500/10 border-b border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <IonIcon icon={warningOutline} className="w-4 h-4 flex-shrink-0" />
              Ollama is unreachable. Make sure it's running and the model
              (<code className="px-1 rounded bg-stone-900/60">{status?.ollama.chatModel}</code>) is pulled.
            </div>
          )}
          {!ollamaDown && noIndex && (
            <div className="px-4 sm:px-6 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-sm flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <IonIcon icon={warningOutline} className="w-4 h-4 flex-shrink-0" />
                Knowledge base is empty — Xiao Mei will answer without retrieved context.
              </span>
              <button
                onClick={handleReindex}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg"
              >
                Build index
              </button>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4"
            style={{ scrollBehavior: 'smooth' }}
          >
            {loadingConv && (
              <div className="text-stone-500 text-sm text-center py-8">Loading conversation…</div>
            )}

            {!loadingConv && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-8 sm:py-16 animate-fadeIn">
                <img
                  src={xiaomeiSrc}
                  alt="Xiao Mei"
                  className="w-24 h-24 sm:w-32 sm:h-32 mb-4 drop-shadow-[0_0_30px_rgba(217,119,6,0.4)]"
                />
                <h4 className="text-2xl font-light text-primary mb-2">你好! Hi there!</h4>
                <p className="text-stone-400 max-w-md mx-auto leading-relaxed">{greeting}</p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
                  {[
                    'Teach me how to greet someone in Chinese',
                    'Explain the tones with examples',
                    'Quiz me on HSK 1 words',
                    'How do I use 了 in a sentence?',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left text-sm px-4 py-3 bg-stone-800/50 hover:bg-stone-800 border border-stone-700/60 rounded-xl text-stone-200 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
                >
                  {m.role === 'assistant' && (
                    <img
                      src={xiaomeiSrc}
                      alt="Xiao Mei"
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-1 border border-amber-700/40"
                    />
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl ${
                      m.role === 'user'
                        ? 'bg-primary/90 text-stone-900 rounded-br-sm'
                        : m.failed
                          ? 'bg-red-500/10 border border-red-500/40 text-red-200 rounded-bl-sm'
                          : 'bg-stone-800/70 border border-stone-700/60 text-stone-100 rounded-bl-sm'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <>
                        {m.pending && m.content === '' ? (
                          <TypingDots />
                        ) : (
                          <MiniMarkdown text={m.content} />
                        )}
                        {m.pending && m.content !== '' && (
                          <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-primary/70 animate-pulse" />
                        )}
                      </>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {messages.length > 0 &&
              messages[messages.length - 1]?.role === 'assistant' &&
              messages[messages.length - 1]?.failed && (
                <div className="flex justify-center">
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-stone-200 text-sm"
                  >
                    <IonIcon icon={refreshOutline} className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}
          </div>

          {/* Composer */}
          <div className="border-t border-stone-700/60 bg-stone-950/60 backdrop-blur-md p-3 sm:p-4">
            {/* Voice-mode banner: interim transcript / TTS state / countdown */}
            {voicePrefs.enabled && (
              <div className="mb-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-900/60 border border-stone-700/60 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {voice.state === 'listening' && (
                    <>
                      <span className="flex items-center gap-1.5 text-red-300">
                        <span className="relative flex w-2 h-2">
                          <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
                        </span>
                        Listening…
                      </span>
                      {voice.interimText && (
                        <span className="text-stone-400 italic truncate">"{voice.interimText}"</span>
                      )}
                    </>
                  )}
                  {voice.state === 'speaking' && (
                    <span className="flex items-center gap-1.5 text-primary">
                      <IonIcon icon={volumeHighOutline} className="w-3.5 h-3.5 animate-pulse" />
                      Xiao Mei is speaking…
                    </span>
                  )}
                  {voice.state === 'denied' && (
                    <span className="text-red-300">Microphone permission blocked — enable it in your browser.</span>
                  )}
                  {voice.state === 'unsupported' && (
                    <span className="text-stone-500">Voice input not supported in this browser.</span>
                  )}
                  {voice.state === 'idle' && autoSendIn > 0 && (
                    <span className="text-amber-300">
                      Sending in {autoSendIn.toFixed(1)}s · tap to cancel
                    </span>
                  )}
                  {voice.state === 'idle' && autoSendIn === 0 && !voice.errorMessage && (
                    <span className="text-stone-500">Tap the mic to talk · Xiao Mei will reply by voice</span>
                  )}
                </div>

                {/* Voice controls */}
                <div className="flex items-center gap-1.5">
                  {/* Cancel auto-send */}
                  {autoSendIn > 0 && (
                    <button
                      onClick={cancelAutoSend}
                      className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                    >
                      Cancel
                    </button>
                  )}
                  {/* Stop TTS while speaking */}
                  {voice.state === 'speaking' && (
                    <button
                      onClick={voice.cancelSpeak}
                      className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-200 hover:bg-red-500/30 flex items-center gap-1"
                    >
                      <IonIcon icon={volumeMuteOutline} className="w-3 h-3" />
                      Stop
                    </button>
                  )}
                  {/* Language toggle */}
                  <button
                    onClick={() =>
                      updatePrefs({ lang: voicePrefs.lang === 'zh-CN' ? 'en-US' : 'zh-CN' })
                    }
                    className="px-2 py-0.5 rounded text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
                    title="Voice input/output language"
                  >
                    {voicePrefs.lang === 'zh-CN' ? '中文' : 'EN'}
                  </button>
                  {/* Chinese-only TTS toggle */}
                  <button
                    onClick={() => updatePrefs({ chineseOnlyTts: !voicePrefs.chineseOnlyTts })}
                    className={`px-2 py-0.5 rounded text-xs border transition-all ${
                      voicePrefs.chineseOnlyTts
                        ? 'bg-primary/20 border-primary/40 text-primary'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                    title="Speak only Chinese characters (skip pinyin/English)"
                  >
                    汉字 only
                  </button>
                  {/* Continuous toggle */}
                  <button
                    onClick={() => updatePrefs({ continuous: !voicePrefs.continuous })}
                    className={`px-2 py-0.5 rounded text-xs border transition-all ${
                      voicePrefs.continuous
                        ? 'bg-primary/20 border-primary/40 text-primary'
                        : 'bg-stone-800 border-stone-700 text-stone-400'
                    }`}
                    title="Auto-rearm mic after Xiao Mei finishes speaking"
                  >
                    ↻ Auto
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-end gap-2 bg-stone-900/70 border border-stone-700 focus-within:border-primary/60 rounded-2xl p-2 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (autoSendIn > 0) cancelAutoSend();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                disabled={streaming}
                placeholder={
                  ollamaDown
                    ? 'Ollama is offline — start it to chat.'
                    : voicePrefs.enabled
                      ? 'Tap the mic, or type here…'
                      : 'Ask Xiao Mei anything in English or Chinese…'
                }
                rows={1}
                className="flex-1 bg-transparent text-white placeholder:text-stone-500 focus:outline-none resize-none px-2 py-1.5 text-[15px]"
                style={{ maxHeight: 160 }}
              />

              {/* Mic button — only when voice mode on + STT supported */}
              {voicePrefs.enabled && voice.sttSupported && !streaming && (
                <button
                  onClick={() => {
                    if (voice.state === 'listening') {
                      voice.stopListening();
                    } else {
                      if (voice.state === 'speaking') voice.cancelSpeak();
                      cancelAutoSend();
                      voice.startListening();
                    }
                  }}
                  disabled={!!ollamaDown}
                  className={`p-2.5 rounded-xl transition-all ${
                    voice.state === 'listening'
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-stone-800 hover:bg-stone-700 text-primary'
                  } disabled:opacity-40`}
                  aria-label={voice.state === 'listening' ? 'Stop listening' : 'Start listening'}
                  title={voice.state === 'listening' ? 'Stop listening' : 'Start listening'}
                >
                  <IonIcon
                    icon={voice.state === 'listening' ? micOffOutline : micOutline}
                    className="w-5 h-5"
                  />
                </button>
              )}

              {streaming ? (
                <button
                  onClick={handleStop}
                  className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all"
                  aria-label="Stop generating"
                >
                  <IonIcon icon={stopCircleOutline} className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || !!ollamaDown}
                  className="p-2.5 bg-primary hover:bg-primary/90 text-stone-900 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <IonIcon icon={sendOutline} className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mt-1.5 px-2 text-[10px] text-stone-600 flex justify-between">
              <span>Enter to send · Shift+Enter for newline</span>
              {status?.ollama.ok && <span>{status.ollama.chatModel}</span>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1.5 py-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 bg-primary/70 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 120}ms`, animationDuration: '900ms' }}
      />
    ))}
  </div>
);

export default XiaomeiChat;
