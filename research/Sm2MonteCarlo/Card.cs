namespace Sm2MonteCarlo;

/// <summary>
/// Mutable state of a single flashcard for one learner during the simulation.
/// Combines the SM-2 scheduling state (visible to the algorithm) with the hidden
/// memory state (known only to the <see cref="MemoryModel"/>).
/// </summary>
public sealed class Card
{
    /// <summary>SM-2 scheduling state (ease factor, interval, repetitions).</summary>
    public Sm2State Sm2 { get; set; }

    /// <summary>Hidden memory stability S, in days (the forgetting-curve time constant).</summary>
    public double StabilityDays { get; set; }

    /// <summary>The simulation day on which this card was last reviewed (or introduced).</summary>
    public int LastReviewDay { get; set; }

    /// <summary>The simulation day on which this card next becomes due.</summary>
    public int DueDay { get; set; }

    /// <summary>Total number of reviews this card has received.</summary>
    public int ReviewCount { get; set; }

    /// <summary>Number of those reviews that were successful (quality &gt;= 3).</summary>
    public int SuccessfulReviews { get; set; }

    /// <summary>
    /// Creates a freshly-introduced card, due immediately, with profile-dependent
    /// starting stability and default SM-2 state.
    /// </summary>
    public Card(int introducedOnDay, double initialStabilityDays)
    {
        Sm2 = Sm2State.New;
        StabilityDays = initialStabilityDays;
        LastReviewDay = introducedOnDay;
        DueDay = introducedOnDay; // due the moment it is introduced
        ReviewCount = 0;
        SuccessfulReviews = 0;
    }

    /// <summary>Whether the card is due for review on the given simulation day.</summary>
    public bool IsDue(int day) => DueDay <= day;
}
