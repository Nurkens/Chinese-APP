/**
 * AI configuration — all values overridable via environment variables.
 * Keep this as the single source of truth so we can swap models/limits
 * without touching service code.
 */
export interface AiConfig {
  ollamaBaseUrl: string;
  chatModel: string;
  embeddingModel: string;
  temperature: number;
  numPredict: number; // max tokens to generate per reply
  contextWindow: number; // num_ctx hint to Ollama (model-dependent)
  topKContext: number; // RAG: how many retrieved chunks to inject
  historyWindow: number; // recent messages kept verbatim
  summarizeAfter: number; // messages threshold to trigger summary
  autoIndexOnBoot: boolean;
  requestTimeoutMs: number;
  retries: number;
}

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

const bool = (v: string | undefined, d: boolean) => {
  if (v === undefined) return d;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
};

export const loadAiConfig = (): AiConfig => ({
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, ''),
  chatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.1',
  embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  temperature: num(process.env.AI_TEMPERATURE, 0.7),
  numPredict: num(process.env.AI_MAX_TOKENS, 512),
  contextWindow: num(process.env.AI_CONTEXT_WINDOW, 4096),
  topKContext: num(process.env.AI_TOP_K_CONTEXT, 4),
  historyWindow: num(process.env.AI_HISTORY_WINDOW, 14),
  summarizeAfter: num(process.env.AI_SUMMARIZE_AFTER, 24),
  autoIndexOnBoot: bool(process.env.AI_AUTO_INDEX_ON_BOOT, false),
  requestTimeoutMs: num(process.env.AI_REQUEST_TIMEOUT_MS, 120_000),
  retries: num(process.env.AI_RETRIES, 1),
});
