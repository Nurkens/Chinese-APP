namespace Sm2MonteCarlo;

/// <summary>
/// Drives the Monte Carlo experiment: simulates each virtual learner's study
/// period day by day, then exposes aggregation helpers over the results.
/// </summary>
public static class Simulator
{
    /// <summary>
    /// Runs the full experiment across <see cref="SimulationConfig.Learners"/> learners.
    /// Learners are independent, so the work is parallelised; each learner gets its
    /// own deterministically-seeded RNG, so results are fully reproducible regardless
    /// of thread scheduling.
    /// </summary>
    public static LearnerResult[] Run(SimulationConfig config)
    {
        config.Validate();

        LearnerType[] assignment = BuildProfileAssignment(config);
        var profilesByType = config.Profiles.ToDictionary(p => p.Type);
        var results = new LearnerResult[config.Learners];

        int completed = 0;
        Parallel.For(0, config.Learners, i =>
        {
            // Deterministic per-learner seed (avoids HashCode, which is randomised per process).
            int seed = unchecked(config.Seed * 1_000_003 + i);
            var rng = new Random(seed);

            LearnerProfile profile = profilesByType[assignment[i]];
            results[i] = RunLearner(i, profile, config, rng);

            int done = Interlocked.Increment(ref completed);
            if (done % 1000 == 0)
                Console.Error.Write($"\r  simulated {done:N0}/{config.Learners:N0} learners...");
        });
        Console.Error.WriteLine($"\r  simulated {config.Learners:N0}/{config.Learners:N0} learners.   ");

        return results;
    }

    /// <summary>
    /// Simulates a single learner over the configured study period.
    /// Each day: introduce new cards, then review every due card (subject to an
    /// optional daily limit), updating both the SM-2 schedule and the hidden memory.
    /// </summary>
    public static LearnerResult RunLearner(int learnerId, LearnerProfile profile, SimulationConfig config, Random rng)
    {
        var cards = new List<Card>(config.MaxDeckSize);
        var dailyRetention = new double[config.Days];
        var dailyReviews = new int[config.Days];

        long totalReviews = 0;
        long totalSuccesses = 0;
        double intervalSum = 0;

        for (int day = 0; day < config.Days; day++)
        {
            // 1) Introduce the day's new cards (up to the deck cap). Each is due immediately.
            int room = config.MaxDeckSize - cards.Count;
            int toIntroduce = Math.Min(config.NewCardsPerDay, room);
            for (int k = 0; k < toIntroduce; k++)
                cards.Add(new Card(day, profile.InitialStabilityDays));

            // 2) Collect due cards, most overdue first (matters when a daily limit applies).
            List<Card> due = cards.Where(c => c.IsDue(day)).ToList();
            due.Sort((a, b) => a.DueDay.CompareTo(b.DueDay));
            if (config.DailyReviewLimit > 0 && due.Count > config.DailyReviewLimit)
                due = due.GetRange(0, config.DailyReviewLimit);

            // 3) Review each selected card.
            foreach (Card card in due)
            {
                int elapsed = day - card.LastReviewDay;
                double r = MemoryModel.Retrievability(elapsed, card.StabilityDays);
                bool recalled = MemoryModel.SampleRecall(r, rng);
                int quality = MemoryModel.DeriveQuality(recalled, r, rng);

                card.Sm2 = Sm2Algorithm.CalculateNextReview(card.Sm2, quality);
                card.StabilityDays = MemoryModel.NextStability(profile, card.StabilityDays, recalled, r);
                card.LastReviewDay = day;
                card.DueDay = day + card.Sm2.IntervalDays;
                card.ReviewCount++;
                if (recalled) card.SuccessfulReviews++;

                totalReviews++;
                if (recalled) totalSuccesses++;
                intervalSum += card.Sm2.IntervalDays;
            }

            dailyReviews[day] = due.Count;

            // 4) Snapshot retention: expected fraction of all introduced cards recalled
            //    if tested at the end of this day.
            dailyRetention[day] = cards.Count == 0
                ? 0.0
                : cards.Average(c => MemoryModel.Retrievability(day - c.LastReviewDay, c.StabilityDays));
        }

        var finalEaseFactors = cards.Select(c => c.Sm2.EaseFactor).ToArray();

        return new LearnerResult
        {
            LearnerId = learnerId,
            Profile = profile.Type,
            FinalRetention = dailyRetention[^1],
            AverageRetention = dailyRetention.Average(),
            TotalReviews = (int)totalReviews,
            TotalCards = cards.Count,
            ReviewsPerCard = cards.Count == 0 ? 0.0 : (double)totalReviews / cards.Count,
            AverageIntervalDays = totalReviews == 0 ? 0.0 : intervalSum / totalReviews,
            RecallSuccessRate = totalReviews == 0 ? 0.0 : (double)totalSuccesses / totalReviews,
            AverageFinalEaseFactor = finalEaseFactors.Length == 0 ? 0.0 : finalEaseFactors.Average(),
            PeakDailyWorkload = dailyReviews.Length == 0 ? 0 : dailyReviews.Max(),
            FinalEaseFactors = finalEaseFactors,
            DailyRetention = dailyRetention,
            DailyReviews = dailyReviews,
        };
    }

    /// <summary>
    /// Builds the per-learner profile assignment from the population shares, rounding
    /// fairly so the counts sum exactly to the learner count.
    /// </summary>
    private static LearnerType[] BuildProfileAssignment(SimulationConfig config)
    {
        var assignment = new LearnerType[config.Learners];
        int index = 0;

        // Largest-remainder rounding so the per-profile counts sum to exactly Learners.
        var counts = config.Profiles
            .Select(p => new { p.Type, Exact = p.Share * config.Learners })
            .Select(x => new { x.Type, Floor = (int)Math.Floor(x.Exact), Frac = x.Exact - Math.Floor(x.Exact) })
            .ToList();

        int assigned = counts.Sum(c => c.Floor);
        int remainder = config.Learners - assigned;
        var order = counts.OrderByDescending(c => c.Frac).Select(c => c.Type).ToList();
        var finalCounts = counts.ToDictionary(c => c.Type, c => c.Floor);
        for (int r = 0; r < remainder; r++)
            finalCounts[order[r % order.Count]]++;

        foreach (var (type, count) in finalCounts.Select(kv => (kv.Key, kv.Value)))
            for (int c = 0; c < count && index < assignment.Length; c++)
                assignment[index++] = type;

        return assignment;
    }

    /// <summary>Averages the daily retention / workload series across a set of learners (chart-ready).</summary>
    public static TimeSeries AggregateTimeSeries(IReadOnlyCollection<LearnerResult> results, int days)
    {
        var meanRetention = new double[days];
        var meanReviews = new double[days];
        var cumulative = new double[days];

        if (results.Count == 0)
            return new TimeSeries { Days = days, MeanRetentionByDay = meanRetention, MeanReviewsByDay = meanReviews, CumulativeReviewsByDay = cumulative };

        foreach (LearnerResult r in results)
            for (int d = 0; d < days; d++)
            {
                meanRetention[d] += r.DailyRetention[d];
                meanReviews[d] += r.DailyReviews[d];
            }

        double runningCumulative = 0;
        for (int d = 0; d < days; d++)
        {
            meanRetention[d] /= results.Count;
            meanReviews[d] /= results.Count;
            runningCumulative += meanReviews[d];
            cumulative[d] = runningCumulative;
        }

        return new TimeSeries
        {
            Days = days,
            MeanRetentionByDay = meanRetention,
            MeanReviewsByDay = meanReviews,
            CumulativeReviewsByDay = cumulative,
        };
    }
}
