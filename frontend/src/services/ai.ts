import api from './api';
import { Capacitor } from '@capacitor/core';

const getApiBase = () =>
  Capacitor.isNativePlatform() ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  model?: string | null;
  _count: { messages: number };
}

export interface ConversationDetail {
  id: string;
  userId: string;
  title: string;
  summary: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
  }>;
}

export interface AiStatus {
  ollama: { ok: boolean; models: string[]; chatModel: string; embeddingModel: string };
  rag: {
    indexed: number;
    bySource: Record<string, number>;
    indexing: boolean;
    embeddingModel: string;
  };
  config: Record<string, unknown>;
}

export interface StreamHandlers {
  onMeta?: (meta: { conversationId: string; titleUpdated?: string }) => void;
  onToken?: (delta: string) => void;
  onDone?: (full: string) => void;
  onError?: (message: string) => void;
}

export const aiAPI = {
  status: async (): Promise<AiStatus> => {
    const res = await api.get('/ai/status');
    return res.data;
  },

  reindex: async (): Promise<{ added: number; total: number }> => {
    const res = await api.post('/ai/knowledge/reindex');
    return res.data;
  },

  listConversations: async (): Promise<ConversationSummary[]> => {
    const res = await api.get('/ai/conversations');
    return res.data;
  },

  createConversation: async (title?: string): Promise<ConversationSummary> => {
    const res = await api.post('/ai/conversations', { title });
    return res.data;
  },

  getConversation: async (id: string): Promise<ConversationDetail> => {
    const res = await api.get(`/ai/conversations/${id}`);
    return res.data;
  },

  deleteConversation: async (id: string): Promise<{ success: true }> => {
    const res = await api.delete(`/ai/conversations/${id}`);
    return res.data;
  },

  /**
   * Stream a chat reply. Uses fetch + ReadableStream (not EventSource) so we
   * can attach the JWT Authorization header. Returns an AbortController so the
   * caller can stop generation mid-stream.
   */
  streamChat: (
    payload: { message: string; conversationId?: string },
    handlers: StreamHandlers,
  ): AbortController => {
    const ctrl = new AbortController();
    const token = localStorage.getItem('token');

    (async () => {
      let response: Response;
      try {
        response = await fetch(`${getApiBase()}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handlers.onError?.(err?.message || 'Network error');
        }
        return;
      }

      if (!response.ok || !response.body) {
        let msg = `Request failed (${response.status})`;
        try {
          const j = await response.json();
          if (j?.message) msg = Array.isArray(j.message) ? j.message.join(', ') : j.message;
        } catch {
          /* ignore */
        }
        handlers.onError?.(msg);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by a blank line
          let idx: number;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const raw = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const event = parseSseBlock(raw);
            if (!event) continue;
            try {
              const data = event.data ? JSON.parse(event.data) : {};
              switch (event.event) {
                case 'meta':
                  handlers.onMeta?.(data);
                  break;
                case 'token':
                  if (typeof data.delta === 'string') handlers.onToken?.(data.delta);
                  break;
                case 'done':
                  handlers.onDone?.(data.full || '');
                  break;
                case 'error':
                  handlers.onError?.(data.message || 'Server error');
                  break;
              }
            } catch {
              /* ignore unparsable */
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handlers.onError?.(err?.message || 'Stream interrupted');
        }
      }
    })();

    return ctrl;
  },
};

function parseSseBlock(raw: string): { event: string; data: string } | null {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of raw.split('\n')) {
    if (line.startsWith(':')) continue; // comment / heartbeat
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  if (event === 'message' && dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}
