/**
 * Monte Carlo simulation: does our SM-2 spaced-repetition scheduler retain
 * vocabulary better than a naive "review every N days" baseline?
 *
 * Idea (Monte Carlo = run a random process many times and average):
 *   1. Spawn THOUSANDS of virtual learners.
 *   2. Simulate each one studying for 30 days.
 *   3. Whether a learner recalls a word on a given day is decided RANDOMLY,
 *      weighted by a forgetting curve (Ebbinghaus): p = e^(-t / stability).
 *   4. Each learner has a limited number of reviews per day (a budget) — this
 *      is what makes spacing matter.
 *   5. Compare two schedulers and average retention across all learners.
 *
 * Run:  npx ts-node scripts/monte-carlo-srs.ts
 *
 * NOTE: the absolute numbers depend on the model parameters below. Tune them
 * against real data if you want to publish them — don't just fish for a number
 * you like. The robust, honest finding is the *direction*: adaptive spacing
 * beats fixed spacing under a fixed daily review budget.
 */

import { SM2Algorithm } from '../src/srs/srs.algorithm';

// ---------------------------------------------------------------------------
// Simulation parameters
// ---------------------------------------------------------------------------
const NUM_LEARNERS = 10_000;     // how many virtual learners to average over
const DAYS = 30;                 // length of the study period
const NEW_WORDS_PER_DAY = 5;     // new vocabulary introduced each day
const DAILY_REVIEW_BUDGET = 30;  // max reviews a learner can do per day
const FIXED_INTERVAL = 3;        // baseline: review every 3 days
const CHECKPOINTS = [7, 30];     // days at which we measure retention

// ---------------------------------------------------------------------------
// Memory model (the "ground truth", hidden from the scheduler)
// ---------------------------------------------------------------------------
const START_STABILITY = 1.0;     // a brand-new word lasts ~1 day
const SUCCESS_GROWTH = 2.0;      // a correct recall doubles how long it lasts
const LAPSE_PENALTY = 0.4;       // forgetting knocks stability back down

// p(recall) = e^(-daysSinceReview / stability)
function recallProbability(daysSinceReview: number, stability: number): number {
  return Math.exp(-daysSinceReview / stability);
}

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) so runs are reproducible
// ---------------------------------------------------------------------------
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Strategy = 'sm2' | 'fixed';

interface SimCard {
  // SM-2 scheduler state (what our algorithm tracks)
  easeFactor: number;
  interval: number;
  repetitions: number;
  // memory-model state (the hidden truth the scheduler is trying to estimate)
  stability: number;
  lastReviewDay: number;
  dueDay: number; // the day the scheduler wants the next review
}

/** Simulate one learner for the whole period under one strategy. */
function simulateLearner(
  strategy: Strategy,
  rng: () => number,
): Record<number, number> {
  const cards: SimCard[] = [];
  const retentionAt: Record<number, number> = {};

  for (let day = 0; day <= DAYS; day++) {
    // 1) Introduce the day's new words (each is due immediately).
    if (day < DAYS) {
      for (let i = 0; i < NEW_WORDS_PER_DAY; i++) {
        cards.push({
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          stability: START_STABILITY,
          lastReviewDay: day,
          dueDay: day,
        });
      }
    }

    // 2) Find cards the scheduler considers "due", most overdue first.
    const due = cards
      .filter((c) => c.dueDay <= day)
      .sort((a, b) => a.dueDay - b.dueDay);

    // 3) Review up to the daily budget. Leftover due cards stay overdue and
    //    keep decaying — this is where a bad schedule loses.
    const toReview = due.slice(0, DAILY_REVIEW_BUDGET);

    for (const card of toReview) {
      // Did the learner actually recall it? (forgetting curve + randomness)
      const elapsed = day - card.lastReviewDay;
      const p = recallProbability(elapsed, card.stability);
      const success = rng() < p;

      // Update the hidden memory strength.
      card.stability = success
        ? card.stability * SUCCESS_GROWTH
        : Math.max(START_STABILITY, card.stability * LAPSE_PENALTY);
      card.lastReviewDay = day;

      // Update the scheduler.
      if (strategy === 'sm2') {
        // Map the outcome to a quality rating our SM-2 understands.
        const quality = success ? (p > 0.85 ? 'easy' : 'good') : 'again';
        const result = SM2Algorithm.calculateNextReview(
          { easeFactor: card.easeFactor, interval: card.interval, repetitions: card.repetitions },
          SM2Algorithm.qualityFromString(quality as 'again' | 'hard' | 'good' | 'easy'),
        );
        card.easeFactor = result.easeFactor;
        card.interval = result.interval;
        card.repetitions = result.repetitions;
        card.dueDay = day + result.interval;
      } else {
        // Baseline: always come back in a fixed number of days.
        card.dueDay = day + FIXED_INTERVAL;
      }
    }

    // 4) At each checkpoint, measure retention = expected fraction of all
    //    introduced words the learner would recall if tested right now.
    if (CHECKPOINTS.includes(day) && cards.length > 0) {
      const totalP = cards.reduce(
        (sum, c) => sum + recallProbability(day - c.lastReviewDay, c.stability),
        0,
      );
      retentionAt[day] = totalP / cards.length;
    }
  }

  return retentionAt;
}

/** Run the full Monte Carlo experiment for one strategy. */
function runExperiment(strategy: Strategy): Record<number, number> {
  const totals: Record<number, number> = {};
  for (const cp of CHECKPOINTS) totals[cp] = 0;

  for (let learner = 0; learner < NUM_LEARNERS; learner++) {
    // Same seed per learner index across strategies => fair comparison.
    const rng = makeRng(learner + 1);
    const result = simulateLearner(strategy, rng);
    for (const cp of CHECKPOINTS) totals[cp] += result[cp] ?? 0;
  }

  const averaged: Record<number, number> = {};
  for (const cp of CHECKPOINTS) averaged[cp] = totals[cp] / NUM_LEARNERS;
  return averaged;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(
  `Monte Carlo: ${NUM_LEARNERS.toLocaleString()} virtual learners, ${DAYS} days, ` +
    `budget ${DAILY_REVIEW_BUDGET} reviews/day\n`,
);

const sm2 = runExperiment('sm2');
const fixed = runExperiment('fixed');

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

console.log('Day | SM-2 (ours) | Fixed every 3d | Improvement');
console.log('----+-------------+----------------+------------');
for (const cp of CHECKPOINTS) {
  const improvement = ((sm2[cp] - fixed[cp]) / fixed[cp]) * 100;
  console.log(
    `${String(cp).padStart(3)} | ${pct(sm2[cp]).padStart(11)} | ` +
      `${pct(fixed[cp]).padStart(14)} | ${improvement >= 0 ? '+' : ''}${improvement.toFixed(0)}%`,
  );
}
