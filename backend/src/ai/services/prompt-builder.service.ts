import { Injectable } from '@nestjs/common';
import { XIAOMEI_PERSONA } from '../prompts/persona';
import { ChatMessage } from './ollama.service';

export interface UserFacts {
  username?: string | null;
  isGuest?: boolean;
  hskLevel?: number | null;
  totalWords?: number | null;
  currentStreak?: number | null;
  longestStreak?: number | null;
}

export interface RetrievedChunk {
  title: string;
  content: string;
  source: string;
  hskLevel?: number | null;
}

interface BuildOptions {
  userFacts?: UserFacts;
  retrieved?: RetrievedChunk[];
  conversationSummary?: string | null;
  history: ChatMessage[]; // recent messages (already trimmed)
  userMessage: string;
}

/**
 * Builds the message array sent to Ollama. Each block is composable so we can
 * unit-test or swap them independently.
 *
 *   [system: persona]
 *   [system: user facts]            (if present)
 *   [system: conversation summary]  (if present)
 *   [system: retrieved knowledge]   (if any)
 *   ...history (recent verbatim)...
 *   [user: latest message]
 */
@Injectable()
export class PromptBuilderService {
  build(opts: BuildOptions): ChatMessage[] {
    const messages: ChatMessage[] = [
      { role: 'system', content: XIAOMEI_PERSONA },
    ];

    const facts = this.formatUserFacts(opts.userFacts);
    if (facts) messages.push({ role: 'system', content: facts });

    if (opts.conversationSummary && opts.conversationSummary.trim().length > 0) {
      messages.push({
        role: 'system',
        content: `Memory of earlier in this conversation (do not mention this section to the user):\n${opts.conversationSummary.trim()}`,
      });
    }

    const knowledge = this.formatKnowledge(opts.retrieved);
    if (knowledge) messages.push({ role: 'system', content: knowledge });

    messages.push(...opts.history);
    messages.push({ role: 'user', content: opts.userMessage });
    return messages;
  }

  private formatUserFacts(facts?: UserFacts): string | null {
    if (!facts) return null;
    const lines: string[] = [];
    const name = facts.username && !facts.isGuest ? facts.username : null;
    if (name) lines.push(`The learner's name is ${name}.`);
    else lines.push(`The learner is signed in as a guest.`);
    if (facts.hskLevel) lines.push(`Currently studying at HSK level ${facts.hskLevel}.`);
    if (typeof facts.totalWords === 'number') lines.push(`Words learned so far: ${facts.totalWords}.`);
    if (typeof facts.currentStreak === 'number') {
      lines.push(`Current streak: ${facts.currentStreak} day${facts.currentStreak === 1 ? '' : 's'}.`);
    }
    if (typeof facts.longestStreak === 'number' && facts.longestStreak > 0) {
      lines.push(`Best streak: ${facts.longestStreak} days.`);
    }
    if (lines.length === 0) return null;
    return `About the learner (use naturally; do not list facts back at them):\n${lines.join(' ')}`;
  }

  private formatKnowledge(chunks?: RetrievedChunk[]): string | null {
    if (!chunks || chunks.length === 0) return null;
    const formatted = chunks
      .map((c, i) => {
        const lvl = c.hskLevel ? ` [HSK ${c.hskLevel}]` : '';
        return `[${i + 1}] ${c.title}${lvl}\n${c.content.trim()}`;
      })
      .join('\n\n');
    return `Reference material from the app's knowledge base. Use it when it helps; do not quote the [n] markers. If a fact is not in the references and you are unsure, say you don't know.\n\n${formatted}`;
  }
}
