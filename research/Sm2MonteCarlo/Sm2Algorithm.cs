namespace Sm2MonteCarlo;

/// <summary>
/// Immutable snapshot of an SM-2 scheduling state for a single card.
/// </summary>
/// <param name="EaseFactor">EF (easiness factor). Starts at 2.5, floored at 1.3.</param>
/// <param name="IntervalDays">Days until the next review.</param>
/// <param name="Repetitions">Number of consecutive successful reviews (quality &gt;= 3).</param>
public readonly record struct Sm2State(double EaseFactor, int IntervalDays, int Repetitions)
{
    /// <summary>The state of a brand-new, never-reviewed card.</summary>
    public static Sm2State New => new(Sm2Algorithm.DefaultEaseFactor, IntervalDays: 0, Repetitions: 0);
}

/// <summary>
/// Faithful implementation of the SuperMemo SM-2 spaced-repetition algorithm,
/// kept deliberately in lock-step with the production TypeScript implementation
/// in <c>backend/src/srs/srs.algorithm.ts</c> so that this simulation evaluates
/// the *actual* algorithm shipped in the app.
///
/// Quality ratings (0-5):
///   0 - complete blackout, no recall
///   1 - incorrect, but recognised after seeing the answer
///   2 - incorrect, but the answer felt easy to recall once seen
///   3 - correct, with serious difficulty
///   4 - correct, after some hesitation
///   5 - perfect recall
/// A rating &lt; 3 counts as a lapse (the repetition streak resets).
/// </summary>
public static class Sm2Algorithm
{
    /// <summary>EF is never allowed below this value (SM-2 specification).</summary>
    public const double MinEaseFactor = 1.3;

    /// <summary>EF assigned to a fresh card before any reviews.</summary>
    public const double DefaultEaseFactor = 2.5;

    /// <summary>
    /// Computes the next scheduling state from the current state and the quality
    /// of the just-completed recall attempt.
    /// </summary>
    /// <param name="current">The card's current SM-2 state.</param>
    /// <param name="quality">Recall quality in the range [0, 5]. Values outside the range are clamped.</param>
    /// <returns>The updated SM-2 state to persist for the card.</returns>
    public static Sm2State CalculateNextReview(Sm2State current, int quality)
    {
        // Clamp quality into the valid 0..5 band.
        quality = Math.Clamp(quality, 0, 5);

        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        // The ease factor is recomputed on every review (pass or fail) and floored at 1.3.
        int q5 = 5 - quality;
        double newEase = current.EaseFactor + (0.1 - q5 * (0.08 + q5 * 0.02));
        newEase = Math.Max(MinEaseFactor, newEase);

        int newRepetitions;
        int newInterval;

        if (quality < 3)
        {
            // Lapse: restart the schedule from the beginning, review again tomorrow.
            newRepetitions = 0;
            newInterval = 1;
        }
        else
        {
            newRepetitions = current.Repetitions + 1;
            newInterval = newRepetitions switch
            {
                1 => 1,                                                  // first success: 1 day
                2 => 6,                                                  // second success: 6 days
                _ => (int)Math.Round(current.IntervalDays * newEase),    // subsequently: interval * EF'
            };
        }

        // Round EF to two decimals to mirror the production implementation exactly.
        newEase = Math.Round(newEase * 100.0) / 100.0;

        return new Sm2State(newEase, newInterval, newRepetitions);
    }
}
