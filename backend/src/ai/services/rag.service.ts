import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OllamaService } from './ollama.service';
import { GRAMMAR_CORPUS } from '../data/grammar-corpus';
import { loadAiConfig } from '../ai.config';
import { RetrievedChunk } from './prompt-builder.service';

interface IndexedChunk {
  id: string;
  source: string;
  refId: string | null;
  title: string;
  content: string;
  hskLevel: number | null;
  embedding: Float32Array;
}

/**
 * Embedding-based retrieval over:
 *   - HSK vocabulary (Word table)
 *   - Curated grammar / app-help corpus (GRAMMAR_CORPUS)
 *
 * Embeddings are stored once in Postgres (KnowledgeChunk) and loaded into RAM
 * on startup for fast cosine search. Re-indexing is content-hash deduped, so
 * re-running is cheap and resumable.
 */
@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private readonly cfg = loadAiConfig();
  private index: IndexedChunk[] = [];
  private indexing = false;

  constructor(
    private prisma: PrismaService,
    private ollama: OllamaService,
  ) {}

  async onModuleInit() {
    await this.loadIndex();
    if (this.cfg.autoIndexOnBoot) {
      this.reindex().catch((e) => this.logger.warn(`Auto-index failed: ${e.message}`));
    }
  }

  isReady(): boolean {
    return this.index.length > 0;
  }

  stats() {
    return {
      indexed: this.index.length,
      bySource: this.index.reduce<Record<string, number>>((acc, c) => {
        acc[c.source] = (acc[c.source] || 0) + 1;
        return acc;
      }, {}),
      indexing: this.indexing,
      embeddingModel: this.cfg.embeddingModel,
    };
  }

  async loadIndex() {
    const rows = await this.prisma.knowledgeChunk.findMany({
      where: { model: this.cfg.embeddingModel },
    });
    this.index = rows.map((r) => ({
      id: r.id,
      source: r.source,
      refId: r.refId,
      title: r.title,
      content: r.content,
      hskLevel: r.hskLevel,
      embedding: Float32Array.from(r.embedding),
    }));
    this.logger.log(`RAG index loaded: ${this.index.length} chunks (${this.cfg.embeddingModel})`);
  }

  /**
   * Pull HSK words + corpus, embed any chunks not already stored, refresh the
   * in-memory index. Safe to run multiple times — dedupes by content hash.
   */
  async reindex(onProgress?: (done: number, total: number, phase: string) => void): Promise<{
    added: number;
    total: number;
  }> {
    if (this.indexing) {
      throw new Error('Re-index already in progress');
    }
    this.indexing = true;
    let added = 0;
    try {
      const existingHashes = new Set(
        (
          await this.prisma.knowledgeChunk.findMany({
            where: { model: this.cfg.embeddingModel },
            select: { hash: true },
          })
        ).map((r) => r.hash),
      );

      // Build candidate chunks from the two sources.
      const candidates: Array<{
        source: string;
        refId: string | null;
        title: string;
        content: string;
        hskLevel: number | null;
      }> = [];

      // HSK words
      const words = await this.prisma.word.findMany();
      for (const w of words) {
        const content = [
          `${w.chinese} (${w.pinyin}) — ${w.translation}.`,
          w.example ? `Example: ${w.example}${w.examplePinyin ? ` (${w.examplePinyin})` : ''}` : '',
          `HSK level ${w.hskLevel}${w.category ? `, ${w.category}` : ''}.`,
        ]
          .filter(Boolean)
          .join(' ');

        candidates.push({
          source: 'hsk_word',
          refId: w.id,
          title: `${w.chinese} (${w.pinyin}) — ${w.translation}`,
          content,
          hskLevel: w.hskLevel,
        });
      }

      // Grammar corpus
      for (const c of GRAMMAR_CORPUS) {
        candidates.push({
          source: 'grammar',
          refId: c.refId,
          title: c.title,
          content: c.content,
          hskLevel: c.hskLevel ?? null,
        });
      }

      const work = candidates
        .map((c) => ({ ...c, hash: this.hash(c.content) }))
        .filter((c) => !existingHashes.has(c.hash));

      this.logger.log(`Re-index: ${candidates.length} candidates, ${work.length} new to embed`);

      for (let i = 0; i < work.length; i++) {
        const c = work[i];
        try {
          const vector = await this.ollama.embed(c.content);
          await this.prisma.knowledgeChunk.upsert({
            where: { hash: c.hash },
            create: {
              source: c.source,
              refId: c.refId ?? undefined,
              title: c.title,
              content: c.content,
              hskLevel: c.hskLevel ?? undefined,
              hash: c.hash,
              embedding: vector,
              model: this.cfg.embeddingModel,
            },
            update: {
              // already exists by hash — nothing to update
              updatedAt: new Date(),
            },
          });
          added++;
        } catch (err: any) {
          this.logger.warn(`Embed failed for "${c.title}": ${err.message}`);
        }
        onProgress?.(i + 1, work.length, 'embedding');
      }

      await this.loadIndex();
      return { added, total: this.index.length };
    } finally {
      this.indexing = false;
    }
  }

  /**
   * Retrieve the top-K most relevant chunks for a query.
   * Optional hskCeiling filters out content above the learner's level when
   * we're confident about their level — keeps replies appropriately simple.
   */
  async retrieve(
    query: string,
    k = this.cfg.topKContext,
    hskCeiling?: number | null,
  ): Promise<RetrievedChunk[]> {
    if (this.index.length === 0) return [];

    let queryVec: number[];
    try {
      queryVec = await this.ollama.embed(query);
    } catch (err: any) {
      this.logger.warn(`Embed-query failed, skipping RAG: ${err.message}`);
      return [];
    }

    const q = Float32Array.from(queryVec);
    const qNorm = this.norm(q);
    if (qNorm === 0) return [];

    const scored: Array<{ chunk: IndexedChunk; score: number }> = [];
    for (const c of this.index) {
      if (
        hskCeiling &&
        c.hskLevel &&
        c.source === 'hsk_word' &&
        c.hskLevel > hskCeiling + 1 // allow one level above current
      ) {
        continue;
      }
      const score = this.cosine(q, qNorm, c.embedding);
      scored.push({ chunk: c, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(({ chunk }) => ({
      title: chunk.title,
      content: chunk.content,
      source: chunk.source,
      hskLevel: chunk.hskLevel,
    }));
  }

  // ---------- helpers ----------

  private hash(content: string): string {
    return createHash('sha256').update(`${this.cfg.embeddingModel}::${content}`).digest('hex');
  }

  private norm(v: Float32Array): number {
    let s = 0;
    for (let i = 0; i < v.length; i++) s += v[i] * v[i];
    return Math.sqrt(s);
  }

  private cosine(q: Float32Array, qNorm: number, v: Float32Array): number {
    const len = Math.min(q.length, v.length);
    let dot = 0;
    let vn = 0;
    for (let i = 0; i < len; i++) {
      dot += q[i] * v[i];
      vn += v[i] * v[i];
    }
    const denom = qNorm * Math.sqrt(vn);
    return denom === 0 ? 0 : dot / denom;
  }
}
