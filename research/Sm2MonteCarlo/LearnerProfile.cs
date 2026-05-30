namespace Sm2MonteCarlo;

/// <summary>The three learner archetypes the simulation models.</summary>
public enum LearnerType
{
    Fast,
    Average,
    Slow,
}

/// <summary>
/// Parameters that characterise how a class of learner forms and retains memories.
///
/// The memory model treats each card as having a hidden "stability" S (the time
/// constant of its forgetting curve, in days). These parameters control how S
/// behaves; they are the only thing that differs between a fast and a slow learner.
/// They are intentionally separate from the SM-2 scheduler — SM-2 never sees S,
/// it only sees the quality ratings the learner produces, exactly as in real life.
/// </summary>
/// <param name="Type">The archetype this profile represents.</param>
/// <param name="Share">Fraction of the simulated population with this profile (the shares sum to 1).</param>
/// <param name="InitialStabilityDays">
/// Stability S immediately after a card is first learned, in days. Higher = the
/// learner remembers new material longer before needing a review.
/// </param>
/// <param name="StabilityGrowth">
/// Multiplicative factor applied to S after a successful recall. A value of 2.0
/// means each correct review roughly doubles how long the memory will last.
/// </param>
/// <param name="LapseRetention">
/// Multiplicative factor applied to S after a failed recall (a lapse). Below 1.0;
/// a smaller value means forgetting sets the learner back further.
/// </param>
/// <param name="DesirableDifficultyBonus">
/// Strength of the "spacing / desirable-difficulty" effect: recalls that succeed
/// when retrievability was low (i.e. the review came just in time) consolidate the
/// memory more than easy recalls. Effective growth =
/// StabilityGrowth * (1 + DesirableDifficultyBonus * (1 - R)).
/// </param>
public sealed record LearnerProfile(
    LearnerType Type,
    double Share,
    double InitialStabilityDays,
    double StabilityGrowth,
    double LapseRetention,
    double DesirableDifficultyBonus)
{
    /// <summary>Lower bound on stability so a memory never fully collapses to zero.</summary>
    public const double MinStabilityDays = 0.5;

    /// <summary>
    /// The default population mix. Shares sum to 1.0 (20% fast, 60% average, 20% slow),
    /// a deliberately plausible spread rather than an empirically fitted one.
    ///
    /// Calibration note: SM-2 multiplies a card's interval by its ease factor (~2.5x)
    /// on every successful review. For retrievability to stay high, a learner's memory
    /// stability must grow at least as fast as that multiplier. The growth factors below
    /// straddle that ~2.5x threshold on purpose — fast learners exceed it (SM-2 works
    /// beautifully), average learners sit near it, slow learners fall below it (periodic
    /// lapses and higher workload). This makes the retention/workload trade-off visible.
    /// </summary>
    public static readonly IReadOnlyList<LearnerProfile> Defaults = new[]
    {
        new LearnerProfile(LearnerType.Fast,    Share: 0.20, InitialStabilityDays: 7.0, StabilityGrowth: 2.7, LapseRetention: 0.55, DesirableDifficultyBonus: 0.25),
        new LearnerProfile(LearnerType.Average, Share: 0.60, InitialStabilityDays: 4.0, StabilityGrowth: 2.4, LapseRetention: 0.45, DesirableDifficultyBonus: 0.20),
        new LearnerProfile(LearnerType.Slow,    Share: 0.20, InitialStabilityDays: 2.5, StabilityGrowth: 2.0, LapseRetention: 0.35, DesirableDifficultyBonus: 0.20),
    };
}
