import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AiConfig, loadAiConfig } from '../ai.config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onDone?: (full: string, meta: { promptEvalCount?: number; evalCount?: number }) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

interface OllamaChatChunk {
  model: string;
  created_at?: string;
  message?: { role: string; content: string };
  done?: boolean;
  done_reason?: string;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Thin, dependency-free Ollama HTTP client.
 * Uses Node's native fetch (Node 18+). Streams via the NDJSON body.
 */
@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private cfg: AiConfig;

  constructor() {
    this.cfg = loadAiConfig();
  }

  getConfig(): AiConfig {
    return this.cfg;
  }

  /** Lightweight health check — returns the list of installed models, or throws. */
  async health(): Promise<{ ok: boolean; models: string[]; chatModel: string; embeddingModel: string }> {
    try {
      const res = await this.fetchWithTimeout(`${this.cfg.ollamaBaseUrl}/api/tags`, { method: 'GET' }, 5000);
      if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);
      const body = await res.json();
      const models: string[] = (body?.models || []).map((m: any) => m.name);
      return {
        ok: true,
        models,
        chatModel: this.cfg.chatModel,
        embeddingModel: this.cfg.embeddingModel,
      };
    } catch (err: any) {
      this.logger.warn(`Ollama health check failed: ${err.message}`);
      return { ok: false, models: [], chatModel: this.cfg.chatModel, embeddingModel: this.cfg.embeddingModel };
    }
  }

  /** Non-streaming chat — used for short utility tasks like summarization & title generation. */
  async chat(
    messages: ChatMessage[],
    opts: { model?: string; temperature?: number; numPredict?: number; json?: boolean } = {},
  ): Promise<string> {
    const body = {
      model: opts.model || this.cfg.chatModel,
      messages,
      stream: false,
      ...(opts.json ? { format: 'json' } : {}),
      options: {
        temperature: opts.temperature ?? this.cfg.temperature,
        num_predict: opts.numPredict ?? this.cfg.numPredict,
        num_ctx: this.cfg.contextWindow,
      },
    };

    const res = await this.requestWithRetry(`${this.cfg.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ServiceUnavailableException(`Ollama chat failed (${res.status}): ${text || res.statusText}`);
    }

    const json = (await res.json()) as OllamaChatChunk;
    return json?.message?.content ?? '';
  }

  /** Stream a chat response. Invokes onToken for each delta. */
  async streamChat(
    messages: ChatMessage[],
    cb: StreamCallbacks,
    opts: { model?: string; temperature?: number; numPredict?: number } = {},
  ): Promise<void> {
    const body = {
      model: opts.model || this.cfg.chatModel,
      messages,
      stream: true,
      options: {
        temperature: opts.temperature ?? this.cfg.temperature,
        num_predict: opts.numPredict ?? this.cfg.numPredict,
        num_ctx: this.cfg.contextWindow,
      },
    };

    let res: Response;
    try {
      res = await fetch(`${this.cfg.ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: cb.signal,
      });
    } catch (err: any) {
      const wrapped = new Error(
        err?.name === 'AbortError'
          ? 'aborted'
          : `Could not reach Ollama at ${this.cfg.ollamaBaseUrl}: ${err.message}`,
      );
      cb.onError?.(wrapped);
      throw wrapped;
    }

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      const err = new Error(`Ollama chat stream failed (${res.status}): ${text || res.statusText}`);
      cb.onError?.(err);
      throw err;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    let promptEvalCount: number | undefined;
    let evalCount: number | undefined;

    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        // NDJSON: each chunk is delimited by a newline
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let chunk: OllamaChatChunk;
          try {
            chunk = JSON.parse(line);
          } catch {
            continue;
          }
          if (chunk.message?.content) {
            full += chunk.message.content;
            cb.onToken?.(chunk.message.content);
          }
          if (chunk.done) {
            promptEvalCount = chunk.prompt_eval_count;
            evalCount = chunk.eval_count;
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        cb.onError?.(new Error('aborted'));
        return;
      }
      cb.onError?.(err);
      throw err;
    }

    cb.onDone?.(full, { promptEvalCount, evalCount });
  }

  /** Compute embedding vector(s). Ollama returns one vector per request. */
  async embed(text: string, model?: string): Promise<number[]> {
    const m = model || this.cfg.embeddingModel;
    const res = await this.requestWithRetry(`${this.cfg.ollamaBaseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: m, prompt: text }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new ServiceUnavailableException(`Ollama embeddings failed (${res.status}): ${t}`);
    }
    const json = (await res.json()) as { embedding: number[] };
    if (!Array.isArray(json?.embedding)) {
      throw new Error(`Ollama returned no embedding for model ${m}`);
    }
    return json.embedding;
  }

  /** Batched embedding helper — runs requests serially to avoid hammering Ollama. */
  async embedBatch(
    texts: string[],
    model?: string,
    onProgress?: (done: number, total: number) => void,
  ): Promise<number[][]> {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i++) {
      out.push(await this.embed(texts[i], model));
      onProgress?.(i + 1, texts.length);
    }
    return out;
  }

  // ---------- internals ----------

  private async requestWithRetry(
    url: string,
    init: RequestInit,
    timeoutMs = this.cfg.requestTimeoutMs,
  ): Promise<Response> {
    let lastErr: any;
    for (let attempt = 0; attempt <= this.cfg.retries; attempt++) {
      try {
        return await this.fetchWithTimeout(url, init, timeoutMs);
      } catch (err: any) {
        lastErr = err;
        if (attempt < this.cfg.retries) {
          const delay = 300 * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw new ServiceUnavailableException(`Ollama request failed: ${lastErr?.message || lastErr}`);
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}
