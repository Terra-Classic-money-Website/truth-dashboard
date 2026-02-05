import type { ActiveWalletsSnapshot } from "../contracts";
import { filterPointsByWindow } from "../format";

export function selectActiveWallets(
  snapshot: ActiveWalletsSnapshot,
  windowId?: string,
) {
  const formatPeriodLabel = (periodEnd: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(new Date(`${periodEnd}T00:00:00Z`));
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );
  const totalSeries = snapshot.data.series.mawTotal;
  const sendersSeries = snapshot.data.series.mawSenders;
  const recipientsSeries = snapshot.data.series.mawRecipients;

  type ActiveSeries =
    ActiveWalletsSnapshot["data"]["series"][keyof ActiveWalletsSnapshot["data"]["series"]];

  const buildSeries = (serie: ActiveSeries) => ({
    label: serie.label,
    unit: serie.unit,
    scale: serie.scale,
    cadence: serie.cadence,
    points: filterPointsByWindow(
      serie.points,
      selectedWindow,
      snapshot.coverage.end,
    ),
  });
  const builtTotalSeries = buildSeries(totalSeries);
  const builtSendersSeries = buildSeries(sendersSeries);
  const builtRecipientsSeries = buildSeries(recipientsSeries);
  const visibleSeries = [
    builtTotalSeries,
    builtSendersSeries,
    builtRecipientsSeries,
  ].filter((serie) => serie.points.length > 0);

  const yearRows = [...snapshot.data.tables.yearSummary.rows].sort((a, b) =>
    b.year.localeCompare(a.year),
  );

  const quarterRows = [...snapshot.data.tables.quarterlySummary.rows].sort(
    (a, b) => {
      const parseQuarter = (value: string) => {
        const match = value.match(/^(\d{4}) Q(\d)$/);
        if (!match) {
          return { year: 0, quarter: 0 };
        }
        return {
          year: Number(match[1]),
          quarter: Number(match[2]),
        };
      };
      const aq = parseQuarter(a.quarter);
      const bq = parseQuarter(b.quarter);
      if (aq.year !== bq.year) {
        return bq.year - aq.year;
      }
      return bq.quarter - aq.quarter;
    },
  );

  const thresholds = [50000, 25000, 15000];
  const milestoneRows = thresholds.map((threshold) => {
    const below = builtTotalSeries.points.filter((point) => point.v < threshold);
    return {
      threshold,
      firstReached: below.length ? formatPeriodLabel(below[0].periodEnd) : "—",
      monthsBelow: below.length,
      lastSeen: below.length
        ? formatPeriodLabel(below[below.length - 1].periodEnd)
        : "—",
    };
  });

  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyBuckets = Array.from({ length: 12 }, () => [] as number[]);
  builtTotalSeries.points.forEach((point) => {
    const monthIndex = new Date(`${point.periodEnd}T00:00:00Z`).getUTCMonth();
    monthlyBuckets[monthIndex].push(point.v);
  });
  const seasonality = monthlyBuckets.map((values, index) => ({
    month: monthLabels[index],
    value: values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null,
  }));
  const seasonalityValues = seasonality
    .map((entry) => entry.value)
    .filter((value): value is number => value !== null);
  const seasonalityMin = seasonalityValues.length
    ? Math.min(...seasonalityValues)
    : null;
  const seasonalityMax = seasonalityValues.length
    ? Math.max(...seasonalityValues)
    : null;

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    windows: snapshot.timeWindows,
    series: visibleSeries,
    kpiTiles: snapshot.data.kpiTiles,
    insights: snapshot.data.insights,
    tables: {
      ...snapshot.data.tables,
      yearSummary: {
        ...snapshot.data.tables.yearSummary,
        rows: yearRows,
      },
      quarterlySummary: {
        ...snapshot.data.tables.quarterlySummary,
        rows: quarterRows,
      },
    },
    extremes: snapshot.data.extremes,
    milestones: {
      thresholds: milestoneRows,
    },
    seasonality: {
      rows: seasonality.map((entry) => ({
        ...entry,
        isMin: entry.value !== null && seasonalityMin !== null
          ? entry.value === seasonalityMin
          : false,
        isMax: entry.value !== null && seasonalityMax !== null
          ? entry.value === seasonalityMax
          : false,
      })),
    },
    method: snapshot.data.method,
  };
}
