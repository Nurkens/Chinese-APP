using System.Globalization;
using System.Text;

namespace Sm2MonteCarlo;

/// <summary>
/// Writes the simulation outputs as CSV files. All numbers use the invariant
/// culture (dot decimal separator) so the files load cleanly in Excel, pandas,
/// R, or any charting tool regardless of the host machine's locale.
/// </summary>
public sealed class CsvExporter
{
    private readonly string _dir;
    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

    public CsvExporter(string outputDirectory)
    {
        _dir = outputDirectory;
        Directory.CreateDirectory(_dir);
    }

    /// <summary>One row per learner with their headline metrics.</summary>
    public string WritePerLearner(IReadOnlyList<LearnerResult> results)
    {
        string path = Path.Combine(_dir, "per_learner.csv");
        var sb = new StringBuilder();
        sb.AppendLine("learner_id,profile,final_retention,average_retention,total_reviews,total_cards,reviews_per_card,average_interval_days,recall_success_rate,average_final_ease_factor,peak_daily_workload");

        foreach (LearnerResult r in results)
        {
            sb.Append(r.LearnerId).Append(',')
              .Append(r.Profile).Append(',')
              .Append(F(r.FinalRetention)).Append(',')
              .Append(F(r.AverageRetention)).Append(',')
              .Append(r.TotalReviews).Append(',')
              .Append(r.TotalCards).Append(',')
              .Append(F(r.ReviewsPerCard)).Append(',')
              .Append(F(r.AverageIntervalDays)).Append(',')
              .Append(F(r.RecallSuccessRate)).Append(',')
              .Append(F(r.AverageFinalEaseFactor)).Append(',')
              .Append(r.PeakDailyWorkload)
              .Append('\n');
        }

        File.WriteAllText(path, sb.ToString());
        return path;
    }

    /// <summary>The statistical summary table (one row per metric, optionally per profile).</summary>
    public string WriteSummary(IReadOnlyList<(string Scope, StatSummary Stat)> summaries)
    {
        string path = Path.Combine(_dir, "summary.csv");
        var sb = new StringBuilder();
        sb.AppendLine("scope,metric,count,mean,median,std_dev,min,max,p10,p25,p75,p90,p95");

        foreach (var (scope, s) in summaries)
        {
            sb.Append(scope).Append(',')
              .Append(s.Metric).Append(',')
              .Append(s.Count).Append(',')
              .Append(F(s.Mean)).Append(',')
              .Append(F(s.Median)).Append(',')
              .Append(F(s.StdDev)).Append(',')
              .Append(F(s.Min)).Append(',')
              .Append(F(s.Max)).Append(',')
              .Append(F(s.P10)).Append(',')
              .Append(F(s.P25)).Append(',')
              .Append(F(s.P75)).Append(',')
              .Append(F(s.P90)).Append(',')
              .Append(F(s.P95))
              .Append('\n');
        }

        File.WriteAllText(path, sb.ToString());
        return path;
    }

    /// <summary>Chart-ready time series: retention and workload per day, plus per profile.</summary>
    public string WriteTimeSeries(IReadOnlyList<(string Scope, TimeSeries Series)> seriesByScope)
    {
        string path = Path.Combine(_dir, "timeseries.csv");
        var sb = new StringBuilder();
        sb.AppendLine("scope,day,mean_retention,mean_reviews,cumulative_reviews");

        foreach (var (scope, ts) in seriesByScope)
            for (int d = 0; d < ts.Days; d++)
            {
                sb.Append(scope).Append(',')
                  .Append(d + 1).Append(',') // 1-based day for readability
                  .Append(F(ts.MeanRetentionByDay[d])).Append(',')
                  .Append(F(ts.MeanReviewsByDay[d])).Append(',')
                  .Append(F(ts.CumulativeReviewsByDay[d]))
                  .Append('\n');
            }

        File.WriteAllText(path, sb.ToString());
        return path;
    }

    /// <summary>The ease-factor distribution as a histogram.</summary>
    public string WriteEaseFactorDistribution(IReadOnlyList<HistogramBin> bins)
    {
        string path = Path.Combine(_dir, "ease_factor_distribution.csv");
        var sb = new StringBuilder();
        sb.AppendLine("bin_lower,bin_upper,count,frequency");

        foreach (HistogramBin b in bins)
        {
            sb.Append(F(b.LowerBound)).Append(',')
              .Append(F(b.UpperBound)).Append(',')
              .Append(b.Count).Append(',')
              .Append(F(b.Frequency))
              .Append('\n');
        }

        File.WriteAllText(path, sb.ToString());
        return path;
    }

    private static string F(double value) => value.ToString("0.######", Inv);
}
