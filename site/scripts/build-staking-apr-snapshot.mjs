import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputPath = path.join(
  siteRoot,
  "src/data/snapshots/staking-apr.snapshot.json",
);

const pageUrl = "https://validator.info/terra-classic";
const captureExclusions = new Map([
  [
    "20260614215708",
    "User flagged this capture’s APR reading as mistaken; retain the source capture as evidence but exclude it from the analysis.",
  ],
]);
const cdxUrl = new URL("https://web.archive.org/cdx/search/cdx");
cdxUrl.searchParams.set("url", "validator.info/terra-classic");
cdxUrl.searchParams.set("output", "json");
cdxUrl.searchParams.set(
  "fl",
  "timestamp,original,statuscode,digest,length",
);
cdxUrl.searchParams.append("filter", "statuscode:200");
cdxUrl.searchParams.append("filter", "mimetype:text/html");

const requestHeaders = {
  accept: "text/html,application/json;q=0.9,*/*;q=0.8",
  "user-agent":
    "Truth-Dashboard-Wayback-Research/1.0 (+https://truth.terra-classic.money)",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestampToIso(timestamp) {
  const [year, month, day, hour, minute, second] = [
    timestamp.slice(0, 4),
    timestamp.slice(4, 6),
    timestamp.slice(6, 8),
    timestamp.slice(8, 10),
    timestamp.slice(10, 12),
    timestamp.slice(12, 14),
  ].map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  ).toISOString();
}

function observedDate(timestamp) {
  return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`;
}

function archiveUrl(timestamp, original) {
  return `https://web.archive.org/web/${timestamp}id_/${original}`;
}

async function fetchText(url, { timeoutMs = 30_000, retries = 2 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: requestHeaders,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      if (text.length < 1_000) {
        throw new Error(`response too small (${text.length} bytes)`);
      }
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError ?? new Error("unknown fetch error");
}

function extractNumericStateValue(html, key) {
  const expression = new RegExp(
    `${key}\\\\?":\\s*(-?\\d+(?:\\.\\d+)?)`,
    "i",
  );
  const match = html.match(expression);
  return match ? Number(match[1]) : null;
}

function hasStateKey(html, key) {
  return new RegExp(`${key}\\\\?":`, "i").test(html);
}

function parseAprState(html) {
  const apr = extractNumericStateValue(html, "apr");
  if (apr === null) {
    return {
      status: hasStateKey(html, "apr") ? "parse_failed" : "not_observed",
      apr: null,
      luncApr: null,
      ustcApr: null,
    };
  }
  if (!Number.isFinite(apr) || apr < 0) {
    return {
      status: "parse_failed",
      apr: null,
      luncApr: null,
      ustcApr: null,
    };
  }

  const luncApr = extractNumericStateValue(html, "luncApr");
  const ustcApr = extractNumericStateValue(html, "ustcApr");
  return {
    status: "apr_observed",
    apr,
    luncApr: Number.isFinite(luncApr) && luncApr >= 0 ? luncApr : null,
    ustcApr: Number.isFinite(ustcApr) && ustcApr >= 0 ? ustcApr : null,
  };
}

function readCdxRows(value) {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error("Wayback CDX returned no capture rows.");
  }

  const rows = value.slice(1).map((row) => {
    if (!Array.isArray(row) || row.length < 5) {
      throw new Error("Unexpected Wayback CDX row shape.");
    }
    const [timestamp, original, statuscode, digest, length] = row;
    return {
      timestamp: String(timestamp),
      original: String(original),
      statuscode: String(statuscode),
      digest: String(digest),
      length: Number(length),
    };
  });

  const uniqueRows = new Map();
  rows
    .filter((row) => {
      if (!/^\d{14}$/.test(row.timestamp) || row.statuscode !== "200") {
        return false;
      }
      try {
        const original = new URL(row.original);
        const host = original.hostname.replace(/^www\./i, "");
        const pathname = original.pathname.replace(/\/+$/, "");
        return host === "validator.info" && pathname === "/terra-classic";
      } catch {
        return false;
      }
    })
    .forEach((row) => uniqueRows.set(`${row.timestamp}|${row.original}`, row));

  return [...uniqueRows.values()].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
}

function buildStats(observations) {
  const observed = observations.filter((item) => item.status === "apr_observed");
  const excludedCaptureCount = observations.filter(
    (item) => item.status === "excluded",
  ).length;
  return {
    cdxCaptureCount: observations.length,
    fetchedCaptureCount: observations.filter((item) => item.error === null).length,
    aprObservationCount: observed.length,
    excludedCaptureCount,
    notObservedCount: observations.filter((item) => item.status === "not_observed").length,
    parseFailedCount: observations.filter((item) => item.status === "parse_failed").length,
    fetchFailedCount: observations.filter((item) => item.status === "fetch_failed").length,
    uniqueObservationDates: new Set(observed.map((item) => item.observedDate)).size,
    breakdownObservationCount: observed.filter(
      (item) => item.luncApr !== null && item.ustcApr !== null,
    ).length,
  };
}

async function main() {
  let currentObservation = null;
  if (fs.existsSync(outputPath)) {
    const existingSnapshot = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    currentObservation = existingSnapshot.data?.currentObservation ?? null;
  }

  console.log(`Reading Wayback CDX: ${cdxUrl}`);
  const cdxResponse = await fetchText(cdxUrl, { timeoutMs: 30_000, retries: 2 });
  const captures = readCdxRows(JSON.parse(cdxResponse));
  if (!captures.length) {
    throw new Error("Wayback CDX returned no matching Validator Info captures.");
  }
  console.log(`Found ${captures.length} HTTP 200 HTML captures.`);

  const observations = await mapWithConcurrency(captures, 3, async (capture, index) => {
    const capturedAt = timestampToIso(capture.timestamp);
    const base = {
      captureTimestamp: capture.timestamp,
      capturedAt,
      observedDate: observedDate(capture.timestamp),
      archiveUrl: archiveUrl(capture.timestamp, capture.original),
      originalUrl: capture.original,
      digest: capture.digest,
      archiveBytes: Number.isFinite(capture.length) ? capture.length : null,
    };

    try {
      const html = await fetchText(base.archiveUrl, {
        timeoutMs: 30_000,
        retries: 2,
      });
      const parsed = parseAprState(html);
      const exclusionReason = captureExclusions.get(capture.timestamp) ?? null;
      const status = exclusionReason ? "excluded" : parsed.status;
      console.log(
        `[${index + 1}/${captures.length}] ${capture.timestamp}: ${status}${
          parsed.apr === null ? "" : ` ${parsed.apr.toFixed(4)}%`
        }`,
      );
      return { ...base, ...parsed, status, exclusionReason, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const exclusionReason = captureExclusions.get(capture.timestamp) ?? null;
      const status = exclusionReason ? "excluded" : "fetch_failed";
      console.log(
        `[${index + 1}/${captures.length}] ${capture.timestamp}: ${status} (${message})`,
      );
      return {
        ...base,
        status,
        apr: null,
        luncApr: null,
        ustcApr: null,
        exclusionReason,
        error: message,
      };
    }
  });

  const sortedObservations = observations.sort((a, b) =>
    a.capturedAt.localeCompare(b.capturedAt),
  );
  const validObservations = sortedObservations
    .filter((item) => item.status === "apr_observed" && item.apr !== null)
  const aprPoints = validObservations.map((item) => ({
    t: item.capturedAt,
    v: item.apr,
  }));

  if (!aprPoints.length) {
    throw new Error("No Validator Info staking APR observations were extracted.");
  }

  const stats = buildStats(sortedObservations);
  const snapshot = {
    schemaVersion: "1.0.0",
    dashboardId: "staking-apr",
    title: "LUNC Staking APR — Historical",
    subtitle:
      "Validator Info’s displayed Terra Classic staking APR, reconstructed from Internet Archive snapshots.",
    generatedAt: new Date().toISOString(),
    coverage: {
      start: validObservations[0].observedDate,
      end: validObservations[validObservations.length - 1].observedDate,
      cadence: "irregular Wayback captures",
    },
    sources: [
      {
        id: "wayback-cdx-validator-info-staking-apr",
        label: "Internet Archive Wayback Machine",
        type: "archive",
        notes:
          `CDX captures of ${pageUrl}; ${stats.cdxCaptureCount} HTTP 200 HTML captures retained with capture-level provenance${stats.excludedCaptureCount > 0 ? `, including ${stats.excludedCaptureCount} excluded from APR analysis` : ""}.`,
      },
      {
        id: "validator-info-terra-classic",
        label: "Validator Info — Terra Classic",
        type: "website",
        notes:
          "APR and optional LUNC / USTC contribution values are extracted from the page’s server-rendered state.",
      },
      ...(currentObservation
        ? [{
            id: "user-provided-current-reference",
            label: currentObservation.sourceLabel,
            type: "reference",
            notes: currentObservation.evidence,
          }]
        : []),
    ],
    notes: [
      "Each APR value is the aggregate Staking APR displayed by Validator Info at the capture time; it is preserved as published, not recalculated.",
      "Free public chain endpoints expose current and historical inputs such as mint parameters and bonded stake, but there is no canonical on-chain APR time series. Reconstructing this provider’s exact APR would require its calculation method and reward assumptions.",
      "The archive has irregular coverage. The chart plots observed capture values only and does not imply daily values between captures.",
      ...(stats.excludedCaptureCount > 0
        ? [`${stats.excludedCaptureCount} capture was retained as source evidence and excluded from APR analysis after being flagged as mistaken.`]
        : []),
      "Where present, LUNC APR and USTC APR are source-reported contributions to the aggregate APR. A missing contribution breakdown is unknown, not zero.",
      "This is the site’s aggregate network APR, not a validator-specific net rate, guaranteed return, compounded APY, or price-adjusted return.",
    ],
    timeWindows: [
      { id: "6m", label: "6M", days: 183 },
      { id: "1y", label: "1Y", days: 365 },
      { id: "2y", label: "2Y", days: 730 },
      { id: "all", label: "ALL", days: null },
    ],
    data: {
      series: {
        stakingApr: {
          points: aprPoints,
        },
      },
      observations: sortedObservations,
      currentObservation,
      stats,
    },
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${aprPoints.length} APR observations to ${outputPath}`);
  console.log(JSON.stringify(stats, null, 2));
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
