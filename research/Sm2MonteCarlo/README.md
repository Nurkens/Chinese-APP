# SM-2 Spaced Repetition — Monte Carlo Evaluation (C# / .NET)

A complete, reproducible Monte Carlo simulation that evaluates how effectively the
**SM-2 spaced-repetition algorithm** (the one shipped in this app's backend,
`backend/src/srs/srs.algorithm.ts`) maintains long-term retention while minimizing
review workload.

It simulates **10,000 virtual learners** over a configurable **7–30 day** period,
across three learner profiles (fast / average / slow), models memory with a
probabilistic forgetting curve, and produces a full statistical report plus
chart-ready CSV exports.

---

## 1. Research goal

> Determine how effectively SM-2 sustains long-term retention while minimizing
> review workload, and analyze the trade-off between *retention* and *review
> frequency*.

Memory is inherently probabilistic — whether a learner recalls a card on a given
day depends on chance and on how long ago they studied it. There is no closed-form
answer to "what retention will 10,000 learners reach in 30 days," so we use **Monte
Carlo**: simulate the random process many times and average the outcomes.

---

## 2. How to run

Requires the **.NET 8 SDK** (`dotnet --version` ≥ 8).

```bash
cd research/Sm2MonteCarlo

# Default experiment: 10,000 learners, 30 days
dotnet run -c Release

# Custom run
dotnet run -c Release -- --learners 10000 --days 14 --new-per-day 10 --out ./output

# All options
dotnet run -- --help
```

| Option | Default | Meaning |
|--------|---------|---------|
| `--learners <n>` | 10000 | Number of virtual learners (Monte Carlo sample size) |
| `--days <n>` | 30 | Length of the study period |
| `--new-per-day <n>` | 10 | New cards introduced per learner per day |
| `--max-deck <n>` | 150 | Deck-size cap per learner |
| `--daily-limit <n>` | 0 | Max reviews/day (0 = unlimited) — models limited study time |
| `--seed <n>` | 42 | Master RNG seed (results are fully reproducible) |
| `--out <dir>` | `./output` | Directory for CSV files |

The run prints a statistical report to the console and writes four CSV files.

---

## 3. The SM-2 algorithm (`Sm2Algorithm.cs`)

Implemented faithfully to match the production TypeScript version, so this
simulation evaluates the *actual* algorithm in the app.

**Quality ratings** `q ∈ [0,5]` — 0 = blackout … 5 = perfect recall. `q < 3` is a lapse.

**Ease factor update** (every review, floored at 1.3):

```
EF' = EF + (0.1 − (5 − q) · (0.08 + (5 − q) · 0.02))
EF' = max(1.3, EF')
```

**Interval & repetitions:**

```
if q < 3:                      # lapse → restart
    repetitions = 0
    interval    = 1
else:
    repetitions += 1
    interval = 1                       if repetitions == 1
             = 6                        if repetitions == 2
             = round(interval · EF')    otherwise
```

---

## 4. The memory model (`MemoryModel.cs`)

This is the **ground truth** the scheduler cannot see — it decides whether each
recall actually succeeds.

### 4.1 Forgetting curve (assumption)

Each card has a hidden **stability** `S` (days) — the time constant of its
forgetting curve. The probability of recall after `t` days (the *retrievability*):

```
R(t) = exp(−t / S)          (Ebbinghaus exponential forgetting curve)
```

### 4.2 Random recall outcome (Monte Carlo step)

For each review we draw `u ~ Uniform(0,1)` and the card is **recalled iff `u < R`**
— a Bernoulli trial with success probability `R`. This is the core random-sampling
step that makes each of the 10,000 simulations differ.

### 4.3 Outcome → quality rating

The learner's SM-2 quality rating is derived from the outcome and how confident the
recall was (with light stochastic jitter):

| Outcome | Condition | Quality |
|---------|-----------|---------|
| Recalled | `R ≥ 0.90` | 5 (−1 with 15% chance) |
| Recalled | `0.70 ≤ R < 0.90` | 4 (−1 with 15% chance) |
| Recalled | `R < 0.70` | 3 |
| Failed | `R ≥ 0.50` | 2 |
| Failed | `0.25 ≤ R < 0.50` | 1 |
| Failed | `R < 0.25` | 0 |

### 4.4 Stability update (learning)

```
on success:  S ← S · g · (1 + b·(1 − R))     # grows; bonus for "just-in-time" recall
on lapse:    S ← max(S_min, S · λ)           # shrinks toward a floor
```

`g` (growth), `λ` (lapse retention) and `b` (desirable-difficulty bonus) are
**profile-dependent**. The `(1 − R)` bonus encodes the **spacing effect**: recalling
a card *right before* you would have forgotten it strengthens memory more than an
easy review. This is what creates the central trade-off — review too early and each
review is wasted; review too late and you risk a lapse. SM-2's job is to find the
sweet spot.

---

## 5. Learner profiles (`LearnerProfile.cs`)

| Profile | Share | Initial S (days) | Growth `g` | Lapse `λ` | Difficulty bonus `b` |
|---------|-------|------------------|-----------|-----------|----------------------|
| Fast | 20% | 7.0 | 2.7 | 0.55 | 0.25 |
| Average | 60% | 4.0 | 2.4 | 0.45 | 0.20 |
| Slow | 20% | 2.5 | 2.0 | 0.35 | 0.20 |

> **Calibration around the ease-factor threshold.** SM-2 multiplies a card's interval
> by its ease factor (~2.5×) on every success. For retrievability to stay high, memory
> stability must grow at least that fast. The growth factors above straddle that ~2.5×
> threshold on purpose: **fast** learners exceed it (SM-2 works beautifully — long
> intervals, few reviews), **average** learners sit near it, and **slow** learners fall
> below it (periodic lapses, higher workload). This is the central mechanism behind the
> retention-vs-workload trade-off and the "optimal parameter range" research question.
>
> These values are deliberately *plausible*, not empirically fitted. Tune them against
> real review logs (e.g. Anki/SuperMemo/FSRS datasets) before treating any absolute
> number as a published result — the robust findings are the **relationships**, not the
> exact percentages.

---

## 6. Simulation process, step by step (`Simulator.cs`)

For each of the 10,000 learners (run in parallel, each with its own deterministic
RNG seed `seed·1_000_003 + i`):

1. **Each day `d = 0 … Days−1`:**
   1. Introduce `new-per-day` new cards (until the deck cap), each due immediately.
   2. Collect all **due** cards (`dueDay ≤ d`), most-overdue first; apply the optional daily limit.
   3. For each reviewed card:
      - `t = d − lastReviewDay`; `R = exp(−t/S)`
      - draw recall outcome; derive quality `q`
      - update SM-2 state → new `interval`; set `dueDay = d + interval`
      - update hidden stability `S`
   4. Record reviews done today (workload) and the day's **retention** =
      mean `R` over all introduced cards.
2. After the period, emit per-learner metrics.

Independence of learners makes this *embarrassingly parallel*; per-learner seeding
guarantees identical results regardless of thread scheduling.

---

## 7. Metrics collected

Per learner, then aggregated across the population (and per profile):

- **Average / final retention rate** — expected fraction of cards recalled
- **Number of reviews performed** (total)
- **Average interval length** (days)
- **Recall success rate** (fraction of reviews with `q ≥ 3`)
- **Reviews per card**
- **Daily workload** (reviews/day, as a time series)
- **Distribution of ease factors** (histogram over every card)

---

## 8. Outputs

Console: configuration, statistical summary (mean / median / std / p10 / p90),
per-profile comparison, unicode sparkline charts of retention & workload over time,
ease-factor histogram, and a plain-language interpretation.

CSV files (in `--out`, default `./output`):

| File | Contents |
|------|----------|
| `per_learner.csv` | One row per learner — all headline metrics |
| `summary.csv` | Mean, median, std, min, max, p10/p25/p75/p90/p95 per metric & profile |
| `timeseries.csv` | `scope, day, mean_retention, mean_reviews, cumulative_reviews` — **chart-ready** |
| `ease_factor_distribution.csv` | Histogram bins (`bin_lower, bin_upper, count, frequency`) |
| `charts.html` | **Interactive charts** — open directly in a browser (data embedded) |

**Interactive charts:** open `output/charts.html` in any browser (just double-click
it). The simulation data is embedded inline, so no local web server is needed; the
page renders retention-over-time, daily workload, cumulative reviews (each split by
profile), the ease-factor histogram, and the summary table. It loads the Chart.js
library from a CDN, so an internet connection is required the first time it renders.

**Or chart the CSVs yourself:** load `timeseries.csv` and plot `mean_retention` vs
`day` (retention curve) and `mean_reviews` vs `day` (workload curve), filtering by
`scope` (`all` / `Fast` / `Average` / `Slow`).

---

## 9. Statistical methods (`Statistics.cs`)

- **Mean** — arithmetic average.
- **Median / percentiles** — linear-interpolation method (Excel `PERCENTILE.INC`)
  over the sorted sample.
- **Standard deviation** — population std (`√(Σ(x−μ)²/N)`).
- **Histogram** — equal-width bins over `[min, max]`; frequencies sum to 1.

---

## 10. Key assumptions & limitations

1. **Exponential forgetting** with a single stability parameter per card (no
   per-item difficulty beyond what the profile and review history induce).
2. **Reviews happen exactly on the due day** (no procrastination/early-review noise;
   add a `--daily-limit` to model time-constrained study).
3. **Quality is inferred** from true retrievability rather than self-reported — a
   simplification of human metacognition.
4. **Profiles and their parameters are illustrative**, not fitted to a dataset.
5. Memory of distinct cards is **independent** (no interference between similar items).

These are reasonable first-order assumptions for evaluating *scheduling* behaviour;
they can be refined (e.g. swap in the DSR/FSRS memory model) without changing the
simulation harness.

---

## 11. Interpreting the result (research goal)

- A **high success rate (~85–90%)** with **growing intervals** indicates SM-2 is
  scheduling reviews near the retrieval sweet spot — retention stays high while
  reviews-per-card stays low.
- The **retention-vs-workload trade-off** is read directly from `timeseries.csv`:
  retention plateaus while cumulative workload grows sub-linearly as intervals
  expand — the hallmark benefit of spaced repetition.
- Sweep parameters (e.g. `--days`, `--new-per-day`, `--daily-limit`, or edit the
  profile growth factors) to find the regime where retention is maximized for a
  given daily workload budget.
