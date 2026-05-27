export const SUMMARIZER_PROMPT = `You compress conversations between Xiao Mei (a Chinese tutor) and a learner into a short factual memory.

Output rules:
- Maximum 8 short bullet points, each one line.
- Capture: what the learner is studying, words/grammar already covered, weak areas, goals, tone preferences, and any personal facts they shared.
- Do NOT include greetings, jokes, or Xiao Mei's encouragement — only useful long-term memory.
- Plain text. No headings, no preface.`;

export const TITLE_PROMPT = `You generate a 3-6 word title summarizing the topic of this Chinese-learning conversation.

Rules:
- 3 to 6 words, Title Case.
- No quotes, no punctuation at the end.
- Be specific (e.g. "HSK 2 Family Vocabulary", "Tone Practice Drill"), not generic ("Chinese Chat").
- Return only the title — nothing else.`;
