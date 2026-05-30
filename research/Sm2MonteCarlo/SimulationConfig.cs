namespace Sm2MonteCarlo;

/// <summary>
/// All tunable knobs for a simulation run. Defaults reflect the requested
/// experiment: 10,000 learners studying for 30 days.
/// </summary>
public sealed class SimulationConfig
{
    /// <summary>Number of virtual learners to simulate (the Monte Carlo sample size).</summary>
    public int Learners { get; set; } = 10_000;

    /// <summary>Length of the study period in days (configurable 7-30, but any positive value works).</summary>
    public int Days { get; set; } = 30;

    /// <summary>New cards introduced into each learner's deck per day.</summary>
    public int NewCardsPerDay { get; set; } = 10;

    /// <summary>Hard cap on a learner's deck size; new-card introduction stops once reached.</summary>
    public int MaxDeckSize { get; set; } = 150;

    /// <summary>
    /// Optional cap on reviews a learner will do per day (models limited study time).
    /// 0 or negative means "no cap" (review every due card). Overdue cards roll to the next day.
    /// </summary>
    public int DailyReviewLimit { get; set; } = 0;

    /// <summary>Master RNG seed for reproducibility. Each learner derives a deterministic sub-seed.</summary>
    public int Seed { get; set; } = 42;

    /// <summary>Directory into which CSV outputs are written.</summary>
    public string OutputDirectory { get; set; } = "output";

    /// <summary>The learner-profile population mix.</summary>
    public IReadOnlyList<LearnerProfile> Profiles { get; set; } = LearnerProfile.Defaults;

    /// <summary>Number of bins used for the ease-factor distribution histogram.</summary>
    public int EaseFactorHistogramBins { get; set; } = 24;

    /// <summary>Validates the configuration and throws if it is internally inconsistent.</summary>
    public void Validate()
    {
        if (Learners <= 0) throw new ArgumentException("Learners must be positive.");
        if (Days <= 0) throw new ArgumentException("Days must be positive.");
        if (NewCardsPerDay <= 0) throw new ArgumentException("NewCardsPerDay must be positive.");
        if (MaxDeckSize <= 0) throw new ArgumentException("MaxDeckSize must be positive.");
        if (Profiles.Count == 0) throw new ArgumentException("At least one learner profile is required.");

        double shareSum = Profiles.Sum(p => p.Share);
        if (Math.Abs(shareSum - 1.0) > 1e-6)
            throw new ArgumentException($"Profile shares must sum to 1.0 but sum to {shareSum:F4}.");
    }
}
