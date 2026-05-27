/**
 * Curated grammar / learning-strategy / app-help snippets used as RAG corpus.
 * Each entry is short on purpose — the retriever surfaces the most relevant
 * 3–4 chunks, and the LLM expands on them.
 */

export interface CorpusEntry {
  refId: string;
  title: string;
  content: string;
  hskLevel?: number;
}

export const GRAMMAR_CORPUS: CorpusEntry[] = [
  {
    refId: 'tones-basics',
    title: 'The four tones of Mandarin',
    hskLevel: 1,
    content:
      'Mandarin has four tones plus a neutral tone. 1st tone (ā) is high and flat; 2nd tone (á) rises like a question; 3rd tone (ǎ) dips low then rises; 4th tone (à) falls sharply. The neutral tone (a) is short and unstressed. The same syllable changes meaning with the tone: mā (mother), má (hemp), mǎ (horse), mà (scold).',
  },
  {
    refId: 'measure-words',
    title: 'Measure words (量词)',
    hskLevel: 2,
    content:
      'Chinese uses measure words between numbers and nouns: 一个人 (yí ge rén — one person), 两本书 (liǎng běn shū — two books). 个 (ge) is the generic measure word and works for most nouns when you forget the specific one. Common: 本 for books, 张 for flat things, 只 for animals, 杯 for cups.',
  },
  {
    refId: 'particle-le',
    title: 'The particle 了 (le)',
    hskLevel: 2,
    content:
      '了 marks change or completion. After a verb it marks a completed action: 我吃了 (wǒ chī le — I ate). At the end of a sentence it marks a new situation: 下雨了 (xià yǔ le — it started raining). Do not use 了 for habitual past actions; use 以前 or 过 instead.',
  },
  {
    refId: 'particle-de',
    title: 'The three 的 / 得 / 地 (all "de")',
    hskLevel: 3,
    content:
      '的 links descriptions to nouns: 我的书 (my book). 得 follows a verb and introduces how it was done: 跑得快 (runs fast). 地 turns an adjective into an adverb before a verb: 慢慢地走 (slowly walk). They sound identical (de) but each is used in a different grammatical slot.',
  },
  {
    refId: 'word-order',
    title: 'Basic word order',
    hskLevel: 1,
    content:
      'Chinese sentences follow Subject-Verb-Object: 我喝水 (I drink water). Time and place expressions come before the verb: 我今天在家学习 (I today at-home study). Negation 不 goes before the verb (不去 — not go), and 没 goes before 有 or completed actions (没吃 — did not eat).',
  },
  {
    refId: 'question-ma',
    title: 'Yes/no questions with 吗',
    hskLevel: 1,
    content:
      'To turn any statement into a yes/no question, add 吗 at the end: 你好吗？(How are you?), 你是学生吗？(Are you a student?). Do not change word order. The 吗 question is the simplest and most common.',
  },
  {
    refId: 'question-words',
    title: 'Question words (谁 / 什么 / 哪里 / 为什么 / 怎么)',
    hskLevel: 2,
    content:
      'Chinese question words stay in the same position the answer would. 你是谁？(Who are you?), 这是什么？(What is this?), 你在哪里？(Where are you?), 为什么？(Why?), 怎么？(How?). No subject-verb inversion needed.',
  },
  {
    refId: 'ba-construction',
    title: 'The 把 (bǎ) construction',
    hskLevel: 4,
    content:
      '把 moves the object before the verb to emphasize what happens to it: 我把书放在桌子上 (I put the book on the table). Use it when the action *changes* or *handles* the object. The verb usually needs a complement (a result, direction, or 了).',
  },
  {
    refId: 'comparison-bi',
    title: 'Comparison with 比 (bǐ)',
    hskLevel: 2,
    content:
      'A 比 B + adjective means "A is more [adjective] than B": 我比他高 (I am taller than him). To say "much more", add 得多 or 多了: 她比我大得多 (she is much older than me). For "less", use 没有 ... 那么: 我没有他高 (I am not as tall as him).',
  },
  {
    refId: 'directional-complements',
    title: 'Directional complements (来 / 去)',
    hskLevel: 3,
    content:
      '来 (come, toward speaker) and 去 (go, away from speaker) attach to verbs of motion to show direction: 进来 (come in), 出去 (go out), 回来 (come back). Combined with 上/下/进/出/回/过 they form rich movement: 跑上去 (run up), 走过来 (walk over here).',
  },
  {
    refId: 'time-expressions',
    title: 'Telling time and dates',
    hskLevel: 1,
    content:
      'Time goes biggest-to-smallest: 2024年5月3日下午三点 (year-month-day-afternoon-3 o\'clock). For the clock: 点 (o\'clock), 分 (minute), 半 (half-past). 三点半 = 3:30. Days of the week: 星期一 ... 星期日 / 星期天.',
  },
  {
    refId: 'pinyin-tips',
    title: 'How to read pinyin',
    hskLevel: 1,
    content:
      'Pinyin uses Latin letters with tone marks. Tricky letters: q ~ "ch" (light), x ~ "sh" (light), zh/ch/sh = retroflex (tongue back), c ~ "ts", r ~ between English r and j. The vowel ü (written u after j/q/x/y) is the German ü — round your lips and say "ee".',
  },
  {
    refId: 'memorize-hanzi',
    title: 'How to memorize hanzi',
    hskLevel: 1,
    content:
      'Break each character into radicals — meaningful sub-components. 好 = 女 (woman) + 子 (child). Recognize the radical and a phonetic hint, write the character 5-10 times, then use the SRS review the next day. Spaced repetition beats long study sessions.',
  },
  {
    refId: 'srs-explained',
    title: 'How the app\'s spaced repetition (SRS) works',
    hskLevel: 1,
    content:
      'The app uses SM-2 spaced repetition. After you grade a word (Again / Hard / Good / Easy), the system schedules its next review at a longer interval if you got it right, or a shorter one if you struggled. Reviewing right before forgetting is what builds long-term memory — that is why "Hard" cards come back sooner than "Easy" ones.',
  },
  {
    refId: 'hsk-overview',
    title: 'HSK levels at a glance',
    hskLevel: 1,
    content:
      'HSK is the standard Chinese proficiency test. HSK 1 ~ 150 words (basics), HSK 2 ~ 300 (everyday phrases), HSK 3 ~ 600 (daily life conversation), HSK 4 ~ 1200 (newspapers and discussion), HSK 5 ~ 2500, HSK 6 ~ 5000+ (fluent). Focus on the HSK level the app is set to in your Profile.',
  },
  {
    refId: 'study-routine',
    title: 'A good daily routine',
    hskLevel: 1,
    content:
      'Aim for 15–20 minutes a day rather than long irregular sessions. Do the SRS review first (clearing what is due), learn 5 new words second, and read or listen to one short example sentence third. Consistency builds streaks; streaks build memory.',
  },
  {
    refId: 'pronunciation-practice',
    title: 'How to practice pronunciation',
    hskLevel: 1,
    content:
      'Always say each new word out loud — silent reading does not train your mouth. Record yourself on your phone, then compare with a native recording. Focus on the tone shape first, vowels second, consonants third. Five minutes of careful imitation beats an hour of passive listening.',
  },
  {
    refId: 'app-streaks',
    title: 'How streaks work in this app',
    hskLevel: 1,
    content:
      'Your streak goes up by one each day you complete at least one review. Missing a full day resets it to zero. Your best streak is saved on your Profile page. The Daily Reminder in Settings can ping you at a chosen time so you do not break the chain.',
  },
  {
    refId: 'app-features',
    title: 'What this app can do',
    hskLevel: 1,
    content:
      'The app has: a daily word, an HSK-leveled word library, an SRS review session, hanzi stroke practice, goals & achievements, a friends leaderboard, and adaptive recommendations based on your forgetting curve. Settings let you toggle notifications, daily reminders, and sound.',
  },
];
