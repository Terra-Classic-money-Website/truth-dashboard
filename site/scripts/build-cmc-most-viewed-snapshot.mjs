import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputPath = path.join(
  siteRoot,
  "src/data/snapshots/cmc-most-viewed-rank.snapshot.json",
);

const pageUrl = "https://coinmarketcap.com/most-viewed-pages/";
const targetAssetId = "4172";
const currentYear = new Date().getUTCFullYear();
const cdxUrl = new URL("https://web.archive.org/cdx/search/cdx");
cdxUrl.searchParams.set("url", "coinmarketcap.com/most-viewed-pages/");
cdxUrl.searchParams.set("output", "json");
cdxUrl.searchParams.set("fl", "timestamp,original,statuscode,digest,length");
cdxUrl.searchParams.set("from", "2020");
cdxUrl.searchParams.set("to", String(currentYear));
cdxUrl.searchParams.append("filter", "statuscode:200");
cdxUrl.searchParams.append("filter", "mimetype:text/html");

const requestHeaders = {
  accept: "text/html,application/json;q=0.9,*/*;q=0.8",
  "user-agent": "Truth-Dashboard-Wayback-Research/1.0 (+https://truth.terra-classic.money)",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestampToIso(timestamp) {
  const year = Number(timestamp.slice(0, 4));
  const month = Number(timestamp.slice(4, 6)) - 1;
  const day = Number(timestamp.slice(6, 8));
  const hour = Number(timestamp.slice(8, 10));
  const minute = Number(timestamp.slice(10, 12));
  const second = Number(timestamp.slice(12, 14));
  return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString();
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

function firstMatch(text, expression) {
  const match = text.match(expression);
  return match?.[1] ?? null;
}

function parseAssetRow(html) {
  const rows = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  const assetRow = rows.find(
    (row) =>
      row.includes(`${targetAssetId}.png`) &&
      />(?:LUNC|LUNA)<\/p>/i.test(row),
  );

  if (!assetRow) {
    return {
      status: "not_observed",
      rank: null,
      assetName: null,
      assetSymbol: null,
      marketCapRank: null,
    };
  }

  const rank = Number(firstMatch(assetRow, /<p\b[^>]*>\s*(\d{1,4})\s*<\/p>/i));
  const assetName = firstMatch(
    assetRow,
    /<p\b[^>]*>\s*(Terra Classic|Terra)\s*<\/p>/i,
  );
  const assetSymbol = firstMatch(
    assetRow,
    /<p\b[^>]*>\s*(LUNC|LUNA)\s*<\/p>/i,
  );

  if (!Number.isInteger(rank) || rank < 1 || rank > 500) {
    return {
      status: "parse_failed",
      rank: null,
      assetName,
      assetSymbol,
      marketCapRank: null,
    };
  }

  const marketCapRankMatch = html.match(
    new RegExp(
      `"id":${targetAssetId},"dataType":\\d+,"name":"[^"]+","symbol":"(?:LUNC|LUNA)","slug":"terra-luna","rank":(\\d+)`,
    ),
  );

  return {
    status: "rank_observed",
    rank,
    assetName,
    assetSymbol,
    marketCapRank: marketCapRankMatch ? Number(marketCapRankMatch[1]) : null,
  };
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

  return rows.filter(
    (row) =>
      /^\d{14}$/.test(row.timestamp) &&
      row.statuscode === "200" &&
      row.original === pageUrl,
  );
}

function buildStats(observations) {
  const observed = observations.filter((item) => item.status === "rank_observed");
  return {
    cdxCaptureCount: observations.length,
    fetchedCaptureCount: observations.filter((item) => item.status !== "fetch_failed").length,
    rankObservationCount: observed.length,
    notObservedCount: observations.filter((item) => item.status === "not_observed").length,
    parseFailedCount: observations.filter((item) => item.status === "parse_failed").length,
    fetchFailedCount: observations.filter((item) => item.status === "fetch_failed").length,
    uniqueObservationDates: new Set(observed.map((item) => item.observedDate)).size,
  };
}

async function main() {
  let currentObservation = null;
  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      currentObservation = existing.data?.currentObservation ?? null;
    } catch {
      currentObservation = null;
    }
  }
  console.log(`Reading Wayback CDX: ${cdxUrl}`);
  const cdxResponse = await fetchText(cdxUrl, { timeoutMs: 30_000, retries: 2 });
  const captures = readCdxRows(JSON.parse(cdxResponse));
  console.log(`Found ${captures.length} HTML captures.`);

  const observations = await mapWithConcurrency(captures, 4, async (capture, index) => {
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
      const parsed = parseAssetRow(html);
      console.log(
        `[${index + 1}/${captures.length}] ${capture.timestamp}: ${parsed.status}${
          parsed.rank ? ` #${parsed.rank}` : ""
        }`,
      );
      return { ...base, ...parsed, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[${index + 1}/${captures.length}] ${capture.timestamp}: fetch_failed (${message})`);
      return {
        ...base,
        status: "fetch_failed",
        rank: null,
        assetName: null,
        assetSymbol: null,
        marketCapRank: null,
        error: message,
      };
    }
  });

  const sortedObservations = observations.sort((a, b) =>
    a.capturedAt.localeCompare(b.capturedAt),
  );
  const rankPoints = sortedObservations
    .filter((item) => item.status === "rank_observed" && item.rank !== null)
    .map((item) => ({ t: item.capturedAt, v: item.rank }));

  if (!rankPoints.length) {
    throw new Error("No Terra Classic rank observations were extracted.");
  }

  const stats = buildStats(sortedObservations);
  const snapshot = {
    schemaVersion: "1.0.0",
    dashboardId: "cmc-most-viewed-rank",
    title: "CMC Most Viewed rank — Historical",
    subtitle:
      "Terra Classic’s observed position in CoinMarketCap’s Most Viewed Cryptocurrencies list, reconstructed from Internet Archive snapshots.",
    generatedAt: new Date().toISOString(),
    coverage: {
      start: sortedObservations[0].observedDate,
      end: sortedObservations[sortedObservations.length - 1].observedDate,
      cadence: "irregular Wayback captures",
    },
    sources: [
      {
        id: "wayback-cdx-cmc-most-viewed",
        label: "Internet Archive Wayback Machine",
        type: "archive",
        notes:
          `CDX capture index for ${pageUrl}; ${stats.cdxCaptureCount} HTTP 200 HTML captures retained with capture-level provenance.`,
      },
    ],
    notes: [
      "Rank is the displayed position in CoinMarketCap’s Most Viewed list, not Terra Classic’s market-cap rank.",
      "Wayback captures are irregular. The chart does not assign a rank between observations.",
      "Terra Classic was previously labelled Terra / LUNA; captures are joined by stable CoinMarketCap asset ID 4172 and slug terra-luna.",
      "The observations array retains every CDX capture returned by the query; the plotted series includes captures where the Terra row was parseable.",
    ],
    timeWindows: [
      { id: "3m", label: "3M", days: 92 },
      { id: "6m", label: "6M", days: 183 },
      { id: "1y", label: "1Y", days: 365 },
      { id: "2y", label: "2Y", days: 730 },
      { id: "all", label: "ALL", days: null },
    ],
    data: {
      series: {
        mostViewedRank: {
          points: rankPoints,
        },
      },
      observations: sortedObservations,
      currentObservation,
      stats,
    },
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${rankPoints.length} rank observations to ${outputPath}`);
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
