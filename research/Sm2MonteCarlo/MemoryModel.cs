namespace Sm2MonteCarlo;

/// <summary>
/// The probabilistic memory model — the "ground truth" of the simulation that the
/// SM-2 scheduler is blind to. It answers three questions for every review:
///
///   1. How likely is the learner to recall this card right now?   (forgetting curve)
///   2. Did they actually recall it?                                 (random sampling)
///   3. How strong is the memory afterwards?                         (stability update)
///
/// Assumptions
/// -----------
/// * Forgetting follows the classic Ebbinghaus exponential curve
///       R(t) = exp(-t / S)
///   where t is days elapsed since the last review and S is the memory's
///   "stability" (its characteristic lifetime, in days). R is the retrievability,
///   i.e. the probability of successful recall at time t.
/// * A successful recall multiplies S by a growth factor (the memory lasts longer
///   next time). A lapse multiplies S by a shrink factor &lt; 1.
/// * The spacing effect (a.k.a. desirable difficulty) is modelled by giving extra
///   growth to recalls that succeed when R was already low: reviewing a card right
///   before you would have forgotten it strengthens it more than an easy review.
///   This is what creates the central trade-off SM-2 has to navigate.
/// </summary>
public static class MemoryModel
{
    /// <summary>
    /// Retrievability R(t) = exp(-t / S): the probability the learner recalls the
    /// card after <paramref name="elapsedDays"/> days, given memory stability
    /// <paramref name="stabilityDays"/>.
    /// </summary>
    public static double Retrievability(double elapsedDays, double stabilityDays)
    {
        if (stabilityDays <= 0) return 0.0;
        if (elapsedDays <= 0) return 1.0;
        return Math.Exp(-elapsedDays / stabilityDays);
    }

    /// <summary>Draws a recall outcome: true (recalled) with probability <paramref name="retrievability"/>.</summary>
    public static bool SampleRecall(double retrievability, Random rng) => rng.NextDouble() < retrievability;

    /// <summary>
    /// Maps a recall outcome and the retrievability at review time to an SM-2
    /// quality rating in [0, 5]. Confidence (high R) tends to produce higher
    /// ratings; a small amount of stochastic jitter keeps ratings realistic.
    /// </summary>
    public static int DeriveQuality(bool recalled, double retrievability, Random rng)
    {
        if (recalled)
        {
            // Successful recall -> quality 3, 4 or 5 depending on how comfortably it was recalled.
            int q = retrievability >= 0.90 ? 5
                  : retrievability >= 0.70 ? 4
                  : 3;
            // 15% chance to hesitate and rate one notch lower (never below the pass threshold of 3).
            if (q > 3 && rng.NextDouble() < 0.15) q -= 1;
            return q;
        }

        // Failed recall -> quality 0, 1 or 2 ("the closer R was to the threshold, the nearer the miss").
        return retrievability >= 0.50 ? 2
             : retrievability >= 0.25 ? 1
             : 0;
    }

    /// <summary>
    /// Updates a card's hidden stability after a review.
    /// On success: S grows, with a bonus for just-in-time recalls (low R).
    /// On failure: S shrinks toward (but never below) the profile's floor.
    /// </summary>
    public static double NextStability(LearnerProfile profile, double currentStability, bool recalled, double retrievability)
    {
        if (recalled)
        {
            double effectiveGrowth = profile.StabilityGrowth * (1.0 + profile.DesirableDifficultyBonus * (1.0 - retrievability));
            return currentStability * effectiveGrowth;
        }

        return Math.Max(LearnerProfile.MinStabilityDays, currentStability * profile.LapseRetention);
    }
}
