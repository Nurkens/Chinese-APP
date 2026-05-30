using System.Text.Json;

namespace Sm2MonteCarlo;

/// <summary>
/// Writes a single self-contained <c>charts.html</c> with the simulation data
/// embedded inline as JSON. Opens directly in any browser (double-click) — no local
/// web server needed, because the data is in the file rather than fetched from the
/// CSVs (browsers block <c>file://</c> fetches). The Chart.js library is pulled from
/// a CDN, so an internet connection is needed the first time it renders.
/// </summary>
public sealed class HtmlReportExporter
{
    private readonly string _dir;

    public HtmlReportExporter(string outputDirectory)
    {
        _dir = outputDirectory;
        Directory.CreateDirectory(_dir);
    }

    public string Write(
        SimulationConfig config,
        IReadOnlyList<(string Scope, TimeSeries Series)> timeSeries,
        IReadOnlyList<HistogramBin> easeHistogram,
        IReadOnlyList<(string Scope, StatSummary Stat)> summaries)
    {
        // System.Text.Json always formats numbers with the invariant culture, so the
        // embedded payload is locale-safe regardless of the host machine.
        var payload = new
        {
            learners = config.Learners,
            days = config.Days,
            newPerDay = config.NewCardsPerDay,
            scopes = timeSeries.Select(t => t.Scope).ToArray(),
            timeseries = timeSeries.ToDictionary(
                t => t.Scope,
                t => new
                {
                    retention = t.Series.MeanRetentionByDay,
                    reviews = t.Series.MeanReviewsByDay,
                    cumulative = t.Series.CumulativeReviewsByDay,
                }),
            ease = easeHistogram.Select(b => new
            {
                label = $"{b.LowerBound:F2}",
                freq = b.Frequency,
                count = b.Count,
            }).ToArray(),
            summary = summaries
                .Where(s => s.Scope == "all")
                .Select(s => new
                {
                    metric = s.Stat.Metric,
                    mean = s.Stat.Mean,
                    median = s.Stat.Median,
                    std = s.Stat.StdDev,
                    p10 = s.Stat.P10,
                    p90 = s.Stat.P90,
                }).ToArray(),
        };

        string json = JsonSerializer.Serialize(payload);
        string html = Template.Replace("/*__DATA__*/", json);

        string path = Path.Combine(_dir, "charts.html");
        File.WriteAllText(path, html);
        return path;
    }

    private const string Template = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SM-2 Monte Carlo — Results</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  :root { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  body { margin: 0; background: #0f172a; color: #e2e8f0; }
  header { padding: 24px 32px; background: #1e293b; border-bottom: 1px solid #334155; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  header p { margin: 0; color: #94a3b8; font-size: 14px; }
  main { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 32px; max-width: 1400px; margin: 0 auto; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
  .card.wide { grid-column: 1 / -1; }
  .card h2 { margin: 0 0 12px; font-size: 15px; color: #f1f5f9; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: right; padding: 6px 10px; border-bottom: 1px solid #334155; }
  th:first-child, td:first-child { text-align: left; }
  thead th { color: #94a3b8; font-weight: 600; }
  @media (max-width: 900px) { main { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<header>
  <h1>SM-2 Spaced Repetition — Monte Carlo Results</h1>
  <p id="subtitle"></p>
</header>
<main>
  <div class="card"><h2>Retention over time (% recalled if tested)</h2><canvas id="retention"></canvas></div>
  <div class="card"><h2>Daily review workload (reviews / learner / day)</h2><canvas id="workload"></canvas></div>
  <div class="card"><h2>Cumulative reviews per learner</h2><canvas id="cumulative"></canvas></div>
  <div class="card"><h2>Ease-factor distribution (all cards)</h2><canvas id="ease"></canvas></div>
  <div class="card wide"><h2>Statistical summary (whole population)</h2><div id="summary"></div></div>
</main>

<script>
  const DATA = /*__DATA__*/;
  const COLORS = { all: "#f8fafc", Fast: "#22c55e", Average: "#3b82f6", Slow: "#ef4444" };
  const dayLabels = Array.from({ length: DATA.days }, (_, i) => i + 1);

  document.getElementById("subtitle").textContent =
    DATA.learners.toLocaleString() + " learners · " + DATA.days + " days · " +
    DATA.newPerDay + " new cards/day";

  const gridColor = "rgba(148,163,184,0.15)";
  const baseOptions = (yLabel, yMax) => ({
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { labels: { color: "#cbd5e1" } } },
    scales: {
      x: { title: { display: true, text: "day", color: "#94a3b8" }, ticks: { color: "#94a3b8" }, grid: { color: gridColor } },
      y: { title: { display: true, text: yLabel, color: "#94a3b8" }, ticks: { color: "#94a3b8" }, grid: { color: gridColor }, beginAtZero: true, max: yMax },
    },
  });

  function lineDatasets(key, scale) {
    return DATA.scopes.map((s) => ({
      label: s,
      data: DATA.timeseries[s][key].map((v) => v * scale),
      borderColor: COLORS[s] || "#a78bfa",
      backgroundColor: "transparent",
      borderWidth: s === "all" ? 3 : 1.5,
      tension: 0.25,
      pointRadius: 0,
    }));
  }

  new Chart(document.getElementById("retention"), {
    type: "line",
    data: { labels: dayLabels, datasets: lineDatasets("retention", 100) },
    options: baseOptions("retention %", 100),
  });

  new Chart(document.getElementById("workload"), {
    type: "line",
    data: { labels: dayLabels, datasets: lineDatasets("reviews", 1) },
    options: baseOptions("reviews / day", undefined),
  });

  new Chart(document.getElementById("cumulative"), {
    type: "line",
    data: { labels: dayLabels, datasets: lineDatasets("cumulative", 1) },
    options: baseOptions("cumulative reviews", undefined),
  });

  new Chart(document.getElementById("ease"), {
    type: "bar",
    data: {
      labels: DATA.ease.map((b) => b.label),
      datasets: [{ label: "frequency %", data: DATA.ease.map((b) => b.freq * 100), backgroundColor: "#a78bfa" }],
    },
    options: baseOptions("frequency %", undefined),
  });

  // Summary table
  const fmt = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3));
  const cols = ["metric", "mean", "median", "std", "p10", "p90"];
  let html = "<table><thead><tr>" + cols.map((c) => "<th>" + c + "</th>").join("") + "</tr></thead><tbody>";
  for (const row of DATA.summary) {
    html += "<tr>" + cols.map((c) => "<td>" + (c === "metric" ? row[c] : fmt(row[c])) + "</td>").join("") + "</tr>";
  }
  html += "</tbody></table>";
  document.getElementById("summary").innerHTML = html;
</script>
</body>
</html>
""";
}
