using System.Diagnostics;
using System.Globalization;
using Sm2MonteCarlo;

internal static class Program
{
    /// <summary>The metrics we summarise across the population, with their accessors.</summary>
    private static readonly (string Name, Func<LearnerResult, double> Select)[] Metrics =
    {
        ("final_retention",            r => r.FinalRetention),
        ("average_retention",          r => r.AverageRetention),
        ("total_reviews",              r => r.TotalReviews),
        ("reviews_per_card",           r => r.ReviewsPerCard),
        ("average_interval_days",      r => r.AverageIntervalDays),
        ("recall_success_rate",        r => r.RecallSuccessRate),
        ("average_final_ease_factor",  r => r.AverageFinalEaseFactor),
        ("peak_daily_workload",        r => r.PeakDailyWorkload),
    };

    private static int Main(string[] args)
    {
        if (args.Contains("--help") || args.Contains("-h"))
        {
            PrintUsage();
            return 0;
        }

        SimulationConfig config;
        try
        {
            config = ParseArgs(args);
            config.Validate();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Configuration error: {ex.Message}");
            PrintUsage();
            return 1;
        }

        PrintHeader(config);

        var sw = Stopwatch.StartNew();
        LearnerResult[] results = Simulator.Run(config);
        sw.Stop();
        Console.WriteLine($"Completed {results.Length:N0} learner simulations in {sw.Elapsed.TotalSeconds:F2}s.\n");

        // ---- Statistical summaries (overall + per profile) ----
        var summaries = new List<(string Scope, StatSummary Stat)>();
        foreach (var (name, select) in Metrics)
            summaries.Add(("all", StatSummary.Compute(name, results.Select(select))));

        foreach (LearnerType profile in Enum.GetValues<LearnerType>())
        {
            LearnerResult[] subset = results.Where(r => r.Profile == profile).ToArray();
            if (subset.Length == 0) continue;
            foreach (var (name, select) in Metrics)
                summaries.Add((profile.ToString(), StatSummary.Compute(name, subset.Select(select))));
        }

        // ---- Ease-factor distribution across every card of every learner ----
        IEnumerable<double> allEaseFactors = results.SelectMany(r => r.FinalEaseFactors);
        IReadOnlyList<HistogramBin> easeHistogram = Statistics.Histogram(allEaseFactors, config.EaseFactorHistogramBins);

        // ---- Chart-ready time series (overall + per profile) ----
        var timeSeries = new List<(string Scope, TimeSeries Series)>
        {
            ("all", Simulator.AggregateTimeSeries(results, config.Days)),
        };
        foreach (LearnerType profile in Enum.GetValues<LearnerType>())
        {
            LearnerResult[] subset = results.Where(r => r.Profile == profile).ToArray();
            if (subset.Length == 0) continue;
            timeSeries.Add((profile.ToString(), Simulator.AggregateTimeSeries(subset, config.Days)));
        }

        // ---- Console report ----
        PrintOverallSummary(summaries);
        PrintProfileComparison(results);
        PrintTimeSeriesCharts(timeSeries.First(t => t.Scope == "all").Series);
        PrintEaseFactorHistogram(easeHistogram);
        PrintResearchInterpretation(results, config);

        // ---- CSV export ----
        var exporter = new CsvExporter(config.OutputDirectory);
        string perLearner = exporter.WritePerLearner(results);
        string summaryCsv = exporter.WriteSummary(summaries);
        string tsCsv = exporter.WriteTimeSeries(timeSeries);
        string efCsv = exporter.WriteEaseFactorDistribution(easeHistogram);

        var htmlExporter = new HtmlReportExporter(config.OutputDirectory);
        string chartsHtml = htmlExporter.Write(config, timeSeries, easeHistogram, summaries);

        Console.WriteLine("Outputs written:");
        Console.WriteLine($"  - {perLearner}   (one row per learner)");
        Console.WriteLine($"  - {summaryCsv}        (mean/median/std/percentiles per metric & profile)");
        Console.WriteLine($"  - {tsCsv}     (retention & workload per day — chart-ready)");
        Console.WriteLine($"  - {efCsv}  (ease-factor histogram — chart-ready)");
        Console.WriteLine($"  - {chartsHtml}            (interactive charts — open in a browser)");
        Console.WriteLine();

        return 0;
    }

    // ----------------------------------------------------------------------
    // Argument parsing
    // ----------------------------------------------------------------------
    private static SimulationConfig ParseArgs(string[] args)
    {
        var config = new SimulationConfig();
        for (int i = 0; i < args.Length; i++)
        {
            string key = args[i];
            string Next() => i + 1 < args.Length ? args[++i] : throw new ArgumentException($"Missing value for {key}");
            switch (key)
            {
                case "--learners":    config.Learners = int.Parse(Next(), CultureInfo.InvariantCulture); break;
                case "--days":        config.Days = int.Parse(Next(), CultureInfo.InvariantCulture); break;
                case "--new-per-day": config.NewCardsPerDay = int.Parse(Next(), CultureInfo.InvariantCulture); break;
                case "--max-deck":    config.MaxDeckSize = int.Parse(Next(), CultureInfo.InvariantCulture); break;
                case "--daily-limit": config.DailyReviewLimit = int.Parse(Next(), CultureInfo.InvariantCulture); break;
                case "--seed":        config.Seed = int.Parse(Next(), CultureInfo.InvariantCulture); break;
                case "--out":         config.OutputDirectory = Next(); break;
                default: throw new ArgumentException($"Unknown argument: {key}");
            }
        }
        return config;
    }

    private static void PrintUsage()
    {
        Console.WriteLine(@"
SM-2 Spaced-Repetition Monte Carlo Simulator

Usage: dotnet run -- [options]

Options:
  --learners <n>      Number of virtual learners            (default 10000)
  --days <n>          Length of study period in days        (default 30)
  --new-per-day <n>   New cards introduced per day          (default 10)
  --max-deck <n>      Maximum deck size per learner          (default 150)
  --daily-limit <n>   Max reviews per day, 0 = unlimited     (default 0)
  --seed <n>          Master RNG seed (reproducibility)      (default 42)
  --out <dir>         Output directory for CSV files         (default ./output)
  -h, --help          Show this help

Example:
  dotnet run -c Release -- --learners 10000 --days 30 --out ./output
");
    }

    // ----------------------------------------------------------------------
    // Console reporting
    // ----------------------------------------------------------------------
    private static void PrintHeader(SimulationConfig config)
    {
        Console.WriteLine("============================================================");
        Console.WriteLine("  SM-2 Spaced Repetition — Monte Carlo Evaluation");
        Console.WriteLine("============================================================");
        Console.WriteLine($"  Learners        : {config.Learners:N0}");
        Console.WriteLine($"  Study period    : {config.Days} days");
        Console.WriteLine($"  New cards/day   : {config.NewCardsPerDay}  (deck cap {config.MaxDeckSize})");
        Console.WriteLine($"  Daily limit     : {(config.DailyReviewLimit > 0 ? config.DailyReviewLimit.ToString() : "unlimited")}");
        Console.WriteLine($"  RNG seed        : {config.Seed}");
        Console.WriteLine($"  Population mix  : {string.Join(", ", config.Profiles.Select(p => $"{p.Type} {p.Share:P0}"))}");
        Console.WriteLine("------------------------------------------------------------\n");
    }

    private static void PrintOverallSummary(IReadOnlyList<(string Scope, StatSummary Stat)> summaries)
    {
        Console.WriteLine("STATISTICAL SUMMARY (whole population)");
        Console.WriteLine($"{"metric",-26}{"mean",10}{"median",10}{"std",10}{"p10",10}{"p90",10}");
        Console.WriteLine(new string('-', 76));
        foreach (var (scope, s) in summaries.Where(x => x.Scope == "all"))
            Console.WriteLine($"{s.Metric,-26}{s.Mean,10:F3}{s.Median,10:F3}{s.StdDev,10:F3}{s.P10,10:F3}{s.P90,10:F3}");
        Console.WriteLine();
    }

    private static void PrintProfileComparison(IReadOnlyList<LearnerResult> results)
    {
        Console.WriteLine("BY LEARNER PROFILE  (retention vs. workload trade-off)");
        Console.WriteLine($"{"profile",-10}{"final ret.",12}{"success",10}{"reviews",10}{"rev/card",10}{"avg int.",10}{"peak/day",10}");
        Console.WriteLine(new string('-', 72));
        foreach (LearnerType profile in Enum.GetValues<LearnerType>())
        {
            LearnerResult[] s = results.Where(r => r.Profile == profile).ToArray();
            if (s.Length == 0) continue;
            Console.WriteLine($"{profile,-10}" +
                              $"{s.Average(r => r.FinalRetention),12:P1}" +
                              $"{s.Average(r => r.RecallSuccessRate),10:P1}" +
                              $"{s.Average(r => r.TotalReviews),10:F0}" +
                              $"{s.Average(r => r.ReviewsPerCard),10:F2}" +
                              $"{s.Average(r => r.AverageIntervalDays),10:F2}" +
                              $"{s.Average(r => r.PeakDailyWorkload),10:F1}");
        }
        Console.WriteLine();
    }

    private static void PrintTimeSeriesCharts(TimeSeries ts)
    {
        Console.WriteLine("RETENTION OVER TIME (population mean, per day)");
        Console.WriteLine("  " + Sparkline(ts.MeanRetentionByDay, 0.0, 1.0));
        Console.WriteLine($"  day 1 = {ts.MeanRetentionByDay[0]:P1}  ->  day {ts.Days} = {ts.MeanRetentionByDay[^1]:P1}\n");

        Console.WriteLine("DAILY REVIEW WORKLOAD (population mean reviews/day)");
        Console.WriteLine("  " + Sparkline(ts.MeanReviewsByDay, 0.0, ts.MeanReviewsByDay.Max()));
        Console.WriteLine($"  day 1 = {ts.MeanReviewsByDay[0]:F1}  ->  day {ts.Days} = {ts.MeanReviewsByDay[^1]:F1}" +
                          $"   (total {ts.CumulativeReviewsByDay[^1]:F0} reviews/learner)\n");
    }

    private static void PrintEaseFactorHistogram(IReadOnlyList<HistogramBin> bins)
    {
        Console.WriteLine("EASE-FACTOR DISTRIBUTION (all cards, all learners)");
        int maxCount = bins.Count == 0 ? 1 : Math.Max(1, bins.Max(b => b.Count));
        foreach (HistogramBin b in bins.Where(b => b.Count > 0))
        {
            int barLen = (int)Math.Round(40.0 * b.Count / maxCount);
            Console.WriteLine($"  {b.LowerBound,5:F2}-{b.UpperBound,4:F2} | {new string('#', barLen)} {b.Frequency,6:P1}");
        }
        Console.WriteLine();
    }

    private static void PrintResearchInterpretation(IReadOnlyList<LearnerResult> results, SimulationConfig config)
    {
        double meanRetention = results.Average(r => r.FinalRetention);
        double meanReviewsPerCard = results.Average(r => r.ReviewsPerCard);
        double meanInterval = results.Average(r => r.AverageIntervalDays);
        double meanSuccess = results.Average(r => r.RecallSuccessRate);

        Console.WriteLine("RESEARCH INTERPRETATION");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine($"  Over {config.Days} days, SM-2 sustained an average knowledge-state");
        Console.WriteLine($"  retention of {meanRetention:P1}, with a recall-success rate at review");
        Console.WriteLine($"  (retention-at-due) of {meanSuccess:P1}, at a cost of {meanReviewsPerCard:F2} reviews");
        Console.WriteLine($"  per card and a mean interval of {meanInterval:F1} days.");
        Console.WriteLine();
        // SM-2's design target is ~90% retrievability at review time. Compare against it.
        string verdict = meanSuccess >= 0.85 ? "at/above SM-2's ~90% design target — efficient scheduling"
                       : meanSuccess >= 0.70 ? "slightly below the ~90% target — workload climbs as intervals reset"
                       : "well below target — frequent lapses force short intervals and heavy review load";
        Console.WriteLine($"  Trade-off: a recall-success rate of {meanSuccess:P0} is {verdict}.");
        Console.WriteLine("  Key driver (see per-profile table): when memory-stability growth exceeds");
        Console.WriteLine("  the SM-2 ease-factor multiplier (~2.5x/success), intervals lengthen and");
        Console.WriteLine("  workload stays low; when it lags, cards lapse and reviews pile up.");
        Console.WriteLine("  Inspect summary.csv / timeseries.csv for the full retention-vs-workload curve.");
        Console.WriteLine();
    }

    /// <summary>Renders a numeric series as a unicode block sparkline scaled to [min, max].</summary>
    private static string Sparkline(IReadOnlyList<double> values, double min, double max)
    {
        const string blocks = " ▁▂▃▄▅▆▇█";
        if (values.Count == 0) return string.Empty;
        double range = max - min;
        var chars = new char[values.Count];
        for (int i = 0; i < values.Count; i++)
        {
            double norm = range <= 0 ? 0 : Math.Clamp((values[i] - min) / range, 0, 1);
            int idx = (int)Math.Round(norm * (blocks.Length - 1));
            chars[i] = blocks[idx];
        }
        return new string(chars);
    }
}
