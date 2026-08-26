import type { SeriesPoint, TimeWindow } from "./contracts";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatNumber(value: number, compact = false) {
  return compact ? compactFormatter.format(value) : numberFormatter.format(value);
}

export function formatPercent(value: number) {
  const pct = Math.abs(value) <= 1 ? value * 100 : value;
  return `${numberFormatter.format(pct)}%`;
}

export function formatPercentFraction(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${numberFormatter.format(value * 100)}%`;
}

export function formatValue({
  value,
  unit,
  scale,
}: {
  value: number;
  unit: string;
  scale?: number;
}) {
  if (unit === "rank") {
    return `#${formatNumber(value)}`;
  }
  if (unit === "percent") {
    return formatPercent(value);
  }
  if (unit === "usd") {
    return usdFormatter.format(value);
  }

  const scaledSuffix =
    scale && scale >= 1e9
      ? "B"
      : scale && scale >= 1e6
        ? "M"
        : scale && scale >= 1e3
          ? "K"
          : null;

  if (scaledSuffix) {
    const scaledValue = value;
    const suffixUnit = unit === "count" ? "" : ` ${unit.toUpperCase()}`;
    return `${numberFormatter.format(scaledValue)}${scaledSuffix}${suffixUnit}`;
  }

  if (unit === "count") {
    return formatNumber(value);
  }

  return `${formatNumber(value)} ${unit.toUpperCase()}`;
}

export function formatDelta(delta: {
  value: number;
  unit: string;
  vs: string;
} | null) {
  if (!delta) return null;
  if (delta.unit === "rank") {
    const vs = delta.vs.replace(/_/g, " ");
    if (delta.value === 0) return `Unchanged vs ${vs}`;
    const positions = Math.abs(delta.value);
    const direction = delta.value < 0 ? "better" : "worse";
    return `${positions} position${positions === 1 ? "" : "s"} ${direction} vs ${vs}`;
  }
  const value =
    delta.unit === "percent" ? formatPercent(delta.value) : formatNumber(delta.value);
  const vs = delta.vs.replace(/_/g, " ");
  return `${value} vs ${vs}`;
}

export function formatTableValue(
  value: string | number | null | undefined,
  unit?: string,
) {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "string") {
    return value;
  }
  if (!unit) {
    return formatNumber(value, true);
  }
  return formatValue({ value, unit });
}

export function formatDateLabel(dateString: string, cadence: string) {
  const parsedDate = new Date(dateString);
  const date = Number.isFinite(parsedDate.getTime())
    ? parsedDate
    : new Date(`${dateString}T00:00:00Z`);
  if (cadence === "snapshot") {
    return `${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(date)} UTC`;
  }
  const formatter =
    cadence === "daily" || cadence === "weekly"
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" })
      : new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });
  return formatter.format(date);
}

export function filterPointsByWindow(
  points: SeriesPoint[],
  window: TimeWindow | undefined,
  coverageEnd: string,
) {
  if (!window || (!window.days && !window.weeks && !window.months)) {
    return points;
  }
  const end = new Date(`${coverageEnd}T00:00:00Z`);
  const start = new Date(end);

  if (window.days) {
    start.setDate(start.getDate() - window.days + 1);
  } else if (window.weeks) {
    start.setDate(start.getDate() - window.weeks * 7 + 1);
  } else if (window.months) {
    start.setMonth(start.getMonth() - window.months + 1);
  }

  return points.filter((point) => {
    const pointDate = new Date(`${point.periodEnd}T00:00:00Z`);
    return pointDate >= start && pointDate <= end;
  });
}
