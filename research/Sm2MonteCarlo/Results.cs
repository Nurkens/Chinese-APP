namespace Sm2MonteCarlo;

/// <summary>Per-learner outcome of a single simulated study period.</summary>
public sealed class LearnerResult
{
    public required int LearnerId { get; init; }
    public required LearnerType Profile { get; init; }

    /// <summary>Expected fraction of all introduced cards recalled on the final day.</summary>
    public required double FinalRetention { get; init; }

    /// <summary>Mean of daily retention across the whole period (area under the retention curve).</summary>
    public required double AverageRetention { get; init; }

    /// <summary>Total reviews this learner performed.</summary>
    public required int TotalReviews { get; init; }

    /// <summary>Total cards introduced into this learner's deck.</summary>
    public required int TotalCards { get; init; }

    /// <summary>TotalReviews / TotalCards.</summary>
    public required double ReviewsPerCard { get; init; }

    /// <summary>Mean SM-2 interval (in days) assigned across all of this learner's reviews.</summary>
    public required double AverageIntervalDays { get; init; }

    /// <summary>Fraction of this learner's reviews that succeeded (quality &gt;= 3).</summary>
    public required double RecallSuccessRate { get; init; }

    /// <summary>Mean ease factor across this learner's cards at the end of the run.</summary>
    public required double AverageFinalEaseFactor { get; init; }

    /// <summary>Peak number of reviews this learner had to do in a single day.</summary>
    public required int PeakDailyWorkload { get; init; }

    /// <summary>Final ease factor of every card (used to build the population EF distribution).</summary>
    public required double[] FinalEaseFactors { get; init; }

    /// <summary>Per-day retention (length == Days), used for time-series charts.</summary>
    public required double[] DailyRetention { get; init; }

    /// <summary>Per-day review counts (length == Days), used for workload charts.</summary>
    public required int[] DailyReviews { get; init; }
}

/// <summary>
/// Aggregated, chart-ready time series averaged across the whole population
/// (and broken down per profile by the caller).
/// </summary>
public sealed class TimeSeries
{
    public required int Days { get; init; }
    public required double[] MeanRetentionByDay { get; init; }
    public required double[] MeanReviewsByDay { get; init; }
    public required double[] CumulativeReviewsByDay { get; init; }
}
