import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputPath = path.join(
  siteRoot,
  "src/data/snapshots/cmc-ranking.snapshot.json",
);

const pageUrl = "https://coinmarketcap.com/currencies/terra-luna/";
const targetAssetId = "4172";
const currentApiUrl =
  "https://pro-api.coinmarketcap.com/public-api/v3/cryptocurrency/quotes/latest?id=4172";
const timemapUrl = new URL("https://web.archive.org/web/timemap/json");
timemapUrl.searchParams.set("url", pageUrl);

const requestHeaders = {
  accept: "text/html,application/json;q=0.9,*/*;q=0.8",
  "user-agent":
    "Truth-Dashboard-Wayback-Research/1.0 (+https://truth.terra-classic.money)",
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

function archiveFallbackUrl(timestamp, original) {
  return `https://web.archive.org/web/${timestamp}if_/${original}`;
}

async function fetchResponse(url, { timeoutMs = 30_000, retries = 2 } = {}) {
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
      return response;
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

async function fetchText(url, options) {
  const response = await fetchResponse(url, options);
  const text = await response.text();
  if (text.length < 1_000) {
    throw new Error(`response too small (${text.length} bytes)`);
  }
  return text;
}

async function fetchJson(url, options) {
  const response = await fetchResponse(url, options);
  return response.json();
}

function normalizeOriginal(value) {
  return String(value).replace(/\/$/, "");
}

function readTimemapRows(value) {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error("Wayback Timemap returned no capture rows.");
  }

  const rows = value.slice(1).map((row) => {
    if (!Array.isArray(row) || row.length < 7) {
      throw new Error("Unexpected Wayback Timemap row shape.");
    }
    const [, timestamp, original, mimetype, statuscode, digest, length] = row;
    return {
      timestamp: String(timestamp),
      original: String(original),
      mimetype: String(mimetype),
      statuscode: String(statuscode),
      digest: String(digest),
      length: Number(length),
    };
  });

  return rows.filter(
    (row) =>
      /^\d{14}$/.test(row.timestamp) &&
      row.statuscode === "200" &&
      row.mimetype === "text/html" &&
      normalizeOriginal(row.original) === normalizeOriginal(pageUrl),
  );
}

function parseAssetIdentity(html) {
  const match = html.match(
    new RegExp(
      `"id":${targetAssetId}(?:,"dataType":\\d+)?,"name":"([^"]+)","symbol":"(LUNC|LUNA)"`,
    ),
  );
  return {
    assetName: match?.[1] ?? null,
    assetSymbol: match?.[2] ?? null,
  };
}

function parseAssetRank(html) {
  const targetIndex = html.indexOf(`"id":${targetAssetId}`);
  const identity = parseAssetIdentity(html);

  if (targetIndex < 0) {
    return {
      status: "not_observed",
      rank: null,
      ...identity,
      rankSource: null,
    };
  }

  const statisticsCandidates = [];
  const statisticsPattern = /"statistics":\{[\s\S]{0,16000}?"rank":(\d+)/g;
  let statisticsMatch;
  while ((statisticsMatch = statisticsPattern.exec(html))) {
    const distance = Math.abs(statisticsMatch.index - targetIndex);
    if (distance < 50_000) {
      statisticsCandidates.push({
        rank: Number(statisticsMatch[1]),
        distance,
      });
    }
  }
  const nearestStatistics = statisticsCandidates.sort(
    (left, right) => left.distance - right.distance,
  )[0];
  if (nearestStatistics) {
    return {
      status: "rank_observed",
      rank: nearestStatistics.rank,
      ...identity,
      rankSource: "CoinMarketCap page statistics",
    };
  }

  const legacyRank = html.match(
    new RegExp(
      `"quotesLatest":\\{"data":\\{"${targetAssetId}":\\{[\\s\\S]{0,10000}?"cmc_rank":(\\d+)`,
    ),
  );
  if (legacyRank) {
    return {
      status: "rank_observed",
      rank: Number(legacyRank[1]),
      ...identity,
      rankSource: "CoinMarketCap legacy quote data",
    };
  }

  const listingRanks = [
    ...html.matchAll(
      new RegExp(
        `"id":${targetAssetId},"dataType":\\d+,"name":"[^"]+","symbol":"(?:LUNC|LUNA)","slug":"terra-luna","rank":(\\d+)`,
        "g",
      ),
    ),
  ];
  const listingRank = listingRanks.at(-1);
  if (listingRank) {
    return {
      status: "rank_observed",
      rank: Number(listingRank[1]),
      ...identity,
      rankSource: "CoinMarketCap listing data",
    };
  }

  return {
    status: "parse_failed",
    rank: null,
    ...identity,
    rankSource: null,
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

function buildStats(observations, uniqueContentResults) {
  const observed = observations.filter((item) => item.status === "rank_observed");
  return {
    timemapCaptureCount: observations.length,
    uniqueDigestCount: uniqueContentResults.length,
    fetchedContentCount: uniqueContentResults.filter(
      (item) => item.status !== "fetch_failed",
    ).length,
    rankObservationCount: observed.length,
    notObservedCount: observations.filter((item) => item.status === "not_observed")
      .length,
    parseFailedCount: observations.filter((item) => item.status === "parse_failed")
      .length,
    fetchFailedCount: observations.filter((item) => item.status === "fetch_failed")
      .length,
    uniqueObservationDates: new Set(observed.map((item) => item.observedDate)).size,
  };
}

function parseCurrentObservation(payload) {
  const asset = Array.isArray(payload?.data)
    ? payload.data.find((item) => String(item?.id) === targetAssetId)
    : payload?.data?.[targetAssetId];
  const rank = Number(asset?.cmc_rank);
  const recordedAt = String(asset?.last_updated ?? payload?.status?.timestamp ?? "");
  if (!Number.isInteger(rank) || rank < 1 || !/^\d{4}-\d{2}-\d{2}T/.test(recordedAt)) {
    throw new Error("CMC public API response did not contain a usable Terra Classic rank.");
  }
  return {
    observedDate: recordedAt.slice(0, 10),
    recordedAt: new Date(recordedAt).toISOString(),
    rank,
    sourceLabel: "CoinMarketCap public API (keyless current endpoint)",
    sourceUrl: currentApiUrl,
    evidence: `CMC API asset ID ${targetAssetId} returned cmc_rank ${rank}; the current endpoint is used only for the latest static observation, not historical backfill.`,
  };
}

async function main() {
  console.log(`Reading Wayback Timemap: ${timemapUrl}`);
  const timemap = await fetchJson(timemapUrl, { timeoutMs: 30_000, retries: 2 });
  const captures = readTimemapRows(timemap);
  const uniqueCaptures = [
    ...new Map(
      captures.map((capture) => [capture.digest || capture.timestamp, capture]),
    ).values(),
  ];
  console.log(
    `Found ${captures.length} HTTP 200 HTML captures (${uniqueCaptures.length} unique archive digests).`,
  );

  const contentResults = await mapWithConcurrency(
    uniqueCaptures,
    5,
    async (capture, index) => {
      const url = archiveUrl(capture.timestamp, capture.original);
      try {
        let html;
        try {
          html = await fetchText(url, {
            timeoutMs: 30_000,
            retries: 2,
          });
        } catch (error) {
          html = await fetchText(archiveFallbackUrl(capture.timestamp, capture.original), {
            timeoutMs: 30_000,
            retries: 2,
          });
          console.log(
            `[${index + 1}/${uniqueCaptures.length}] ${capture.timestamp}: used Wayback if_ replay after ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        const parsed = parseAssetRank(html);
        console.log(
          `[${index + 1}/${uniqueCaptures.length}] ${capture.timestamp}: ${parsed.status}${
            parsed.rank ? ` #${parsed.rank}` : ""
          }`,
        );
        return {
          digest: capture.digest || capture.timestamp,
          ...parsed,
          error: null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(
          `[${index + 1}/${uniqueCaptures.length}] ${capture.timestamp}: fetch_failed (${message})`,
        );
        return {
          digest: capture.digest || capture.timestamp,
          status: "fetch_failed",
          rank: null,
          assetName: null,
          assetSymbol: null,
          rankSource: null,
          error: message,
        };
      }
    },
  );

  const resultByDigest = new Map(
    contentResults.map((result) => [result.digest, result]),
  );
  const observations = captures
    .map((capture) => {
      const result = resultByDigest.get(capture.digest || capture.timestamp);
      if (!result) {
        throw new Error(`Missing parsed content for ${capture.timestamp}.`);
      }
      return {
        captureTimestamp: capture.timestamp,
        capturedAt: timestampToIso(capture.timestamp),
        observedDate: observedDate(capture.timestamp),
        archiveUrl: archiveUrl(capture.timestamp, capture.original),
        originalUrl: capture.original,
        digest: capture.digest || capture.timestamp,
        archiveBytes: Number.isFinite(capture.length) ? capture.length : null,
        status: result.status,
        rank: result.rank,
        assetName: result.assetName,
        assetSymbol: result.assetSymbol,
        rankSource: result.rankSource,
        error: result.error,
      };
    })
    .sort((left, right) => left.capturedAt.localeCompare(right.capturedAt));

  const rankPoints = observations
    .filter((item) => item.status === "rank_observed" && item.rank !== null)
    .map((item) => ({ t: item.capturedAt, v: item.rank }));
  if (!rankPoints.length) {
    throw new Error("No Terra Classic market-cap rank observations were extracted.");
  }

  const currentObservation = parseCurrentObservation(
    await fetchJson(currentApiUrl, { timeoutMs: 30_000, retries: 2 }),
  );
  const stats = buildStats(observations, contentResults);
  const archiveEnd = observations.at(-1)?.observedDate ?? currentObservation.observedDate;
  const coverageEnd = archiveEnd > currentObservation.observedDate
    ? archiveEnd
    : currentObservation.observedDate;

  const snapshot = {
    schemaVersion: "1.0.0",
    dashboardId: "cmc-ranking",
    title: "CMC Ranking — Historical",
    subtitle:
      "Terra Classic’s observed CoinMarketCap market-cap ranking, reconstructed from archived CMC coin pages and a current keyless CMC API observation.",
    generatedAt: new Date().toISOString(),
    coverage: {
      start: observations[0].observedDate,
      end: coverageEnd,
      cadence: "irregular Wayback captures plus latest static API observation",
    },
    sources: [
      {
        id: "wayback-timemap-cmc-coin-page",
        label: "Internet Archive Wayback Machine",
        type: "archive",
        notes:
          `Timemap index for ${pageUrl}; ${stats.timemapCaptureCount} HTTP 200 HTML captures retained with capture-level provenance.`,
      },
      {
        id: "cmc-public-current-rank",
        label: "CoinMarketCap public API",
        type: "api",
        notes:
          "Keyless current quotes endpoint used for the latest static rank only; no paid API plan is required for this endpoint.",
      },
    ],
    notes: [
      "Rank is CoinMarketCap’s market-cap ranking for Terra Classic / LUNC, not the Most Viewed Cryptocurrencies position.",
      "Wayback captures are irregular. The chart does not assign a rank between observations.",
      "Terra Classic was previously labelled Terra / LUNA; captures are joined by stable CoinMarketCap asset ID 4172 and slug terra-luna.",
      "Every eligible HTTP 200 HTML Timemap capture is retained as an observation, including repeated captures with the same archive digest; repeated digests are fetched once and mapped back to every capture timestamp.",
      "The latest point is a static observation collected from CoinMarketCap’s keyless public endpoint when this snapshot was generated. It is not a historical API backfill.",
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
        cmcRank: {
          points: rankPoints,
        },
      },
      observations,
      currentObservation,
      stats,
    },
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${rankPoints.length} archive rank observations to ${outputPath}`);
  console.log(JSON.stringify({ ...stats, currentObservation }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
