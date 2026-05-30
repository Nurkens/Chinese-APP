namespace Sm2MonteCarlo;

/// <summary>A standard descriptive-statistics summary of one metric across the population.</summary>
public sealed record StatSummary(
    string Metric,
    int Count,
    double Mean,
    double Median,
    double StdDev,
    double Min,
    double Max,
    double P10,
    double P25,
    double P75,
    double P90,
    double P95)
{
    public static StatSummary Compute(string metric, IEnumerable<double> values)
    {
        double[] data = values.ToArray();
        if (data.Length == 0)
            return new StatSummary(metric, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

        Array.Sort(data);
        double mean = data.Average();

        // Population standard deviation.
        double variance = data.Sum(v => (v - mean) * (v - mean)) / data.Length;
        double std = Math.Sqrt(variance);

        return new StatSummary(
            Metric: metric,
            Count: data.Length,
            Mean: mean,
            Median: Statistics.Percentile(data, 50),
            StdDev: std,
            Min: data[0],
            Max: data[^1],
            P10: Statistics.Percentile(data, 10),
            P25: Statistics.Percentile(data, 25),
            P75: Statistics.Percentile(data, 75),
            P90: Statistics.Percentile(data, 90),
            P95: Statistics.Percentile(data, 95));
    }
}

/// <summary>One bucket of a histogram.</summary>
public sealed record HistogramBin(double LowerBound, double UpperBound, int Count, double Frequency);

/// <summary>Descriptive-statistics utilities operating on sorted/unsorted sample arrays.</summary>
public static class Statistics
{
    /// <summary>
    /// Linear-interpolation percentile (the "C = 1" / Excel PERCENTILE.INC method) over a
    /// <b>pre-sorted</b> ascending array. <paramref name="percentile"/> is in [0, 100].
    /// </summary>
    public static double Percentile(double[] sortedAscending, double percentile)
    {
        if (sortedAscending.Length == 0) return 0.0;
        if (sortedAscending.Length == 1) return sortedAscending[0];

        double rank = percentile / 100.0 * (sortedAscending.Length - 1);
        int lower = (int)Math.Floor(rank);
        int upper = (int)Math.Ceiling(rank);
        double weight = rank - lower;

        if (upper >= sortedAscending.Length) return sortedAscending[^1];
        return sortedAscending[lower] * (1 - weight) + sortedAscending[upper] * weight;
    }

    /// <summary>
    /// Builds an equal-width histogram over <paramref name="values"/> using
    /// <paramref name="bins"/> buckets spanning [min, max]. Frequencies sum to 1.
    /// </summary>
    public static IReadOnlyList<HistogramBin> Histogram(IEnumerable<double> values, int bins)
    {
        double[] data = values.ToArray();
        var result = new List<HistogramBin>(bins);
        if (data.Length == 0 || bins <= 0) return result;

        double min = data.Min();
        double max = data.Max();
        double width = (max - min) / bins;
        if (width <= 0) width = 1.0; // all values identical -> single meaningful bucket

        var counts = new int[bins];
        foreach (double v in data)
        {
            int idx = (int)((v - min) / width);
            if (idx >= bins) idx = bins - 1; // include the max value in the last bin
            if (idx < 0) idx = 0;
            counts[idx]++;
        }

        for (int b = 0; b < bins; b++)
        {
            double lo = min + b * width;
            double hi = lo + width;
            result.Add(new HistogramBin(lo, hi, counts[b], (double)counts[b] / data.Length));
        }

        return result;
    }
}
