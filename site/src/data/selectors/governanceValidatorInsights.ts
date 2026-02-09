import type { GovernanceWindowId } from "../governanceRaw";

type ValidatorSourceRow = {
  validator: string;
  votingPower: number;
  delegators: number;
  incomeMonthlyUsd: number;
  didNotVote1y: number;
  didNotVote2y: number;
  yes: number;
  no: number;
  abstain: number;
  noWithVeto: number;
};

type InsightValidator = {
  validator: string;
  votingPower: number;
  delegators: number;
  incomeMonthlyUsd: number;
  missRate: number;
  missPct: number;
  yes: number;
  no: number;
  abstain: number;
  noWithVeto: number;
  effectivePowerPct: number;
  reliabilityScore: number;
  polarization: number;
  voteStyle: string;
};

type TopShares = {
  top1: number | null;
  top5: number | null;
  top10: number | null;
};

type HistogramBin = {
  label: string;
  count: number;
};

type RankedPaidAbsent = {
  validator: string;
  incomeMonthlyUsd: number;
  missPct: number;
  votingPower: number;
};

type RankedEffectivePower = {
  validator: string;
  effectivePowerPct: number;
  votingPower: number;
  missPct: number;
};

type RankedDelegatorsRisk = {
  validator: string;
  delegators: number;
  missPct: number;
  votingPower: number;
};

export type GovernanceValidatorInsights = {
  kpis: {
    incomeThresholdCounts: {
      gte100: number;
      gte500: number;
      gte1000: number;
      gte5000: number;
    };
    totalMonthlyIncome: number;
    incomeTopShares: TopShares;
    delegatorTopShares: TopShares;
    inactiveVotingPower: {
      neverVotes: number;
      missOver70: number;
      missOver50: number;
    };
    effectivePower: {
      totalVotingPower: number;
      totalEffectivePower: number;
      effectivePowerLoss: number;
    };
    reliability: {
      average: number | null;
      median: number | null;
    };
    abstainHeavyPower: number;
    nakamotoVotingPower: {
      n33: number;
      n50: number;
      n67: number;
    };
    nakamotoEffectivePower: {
      n33: number;
      n50: number;
      n67: number;
    };
    powerPolarized: number;
  };
  distributions: {
    incomeTiers: HistogramBin[];
    reliability: HistogramBin[];
  };
  ranked: {
    paidButAbsent: RankedPaidAbsent[];
    topEffectivePower: RankedEffectivePower[];
    delegatorsAtRisk: {
      totalDelegatorsAtRisk: number;
      rows: RankedDelegatorsRisk[];
    };
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const safeNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

const mean = (values: number[]) => (values.length ? sum(values) / values.length : null);

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const topShare = (values: number[], total: number, topN: number) => {
  if (total <= 0 || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => b - a);
  return (sum(sorted.slice(0, topN)) / total) * 100;
};

const minCountToReach = (values: number[], threshold: number) => {
  const sorted = [...values].sort((a, b) => b - a);
  let cumulative = 0;
  for (let index = 0; index < sorted.length; index += 1) {
    cumulative += sorted[index];
    if (cumulative >= threshold) return index + 1;
  }
  return sorted.length;
};

const voteStyleForRow = (row: {
  yes: number;
  no: number;
  abstain: number;
  noWithVeto: number;
}) => {
  if (row.noWithVeto >= 5) return "Hard vetoer";
  const entries: Array<{ key: "yes" | "no" | "abstain" | "veto"; value: number }> = [
    { key: "yes", value: row.yes },
    { key: "no", value: row.no },
    { key: "abstain", value: row.abstain },
    { key: "veto", value: row.noWithVeto },
  ];
  entries.sort((a, b) => b.value - a.value);
  if (entries[0].key === "abstain" && row.abstain >= 15) return "Fence-sitter";
  if (entries[0].key === "no" && row.no >= 20) return "Skeptic";
  return "Consensus voter";
};

const buildIncomeTierDistribution = (values: number[]) => {
  const bins: HistogramBin[] = [
    { label: "0-50", count: 0 },
    { label: "50-100", count: 0 },
    { label: "100-500", count: 0 },
    { label: "500-1k", count: 0 },
    { label: "1k-5k", count: 0 },
    { label: "5k+", count: 0 },
  ];

  values.forEach((value) => {
    if (value < 50) bins[0].count += 1;
    else if (value < 100) bins[1].count += 1;
    else if (value < 500) bins[2].count += 1;
    else if (value < 1000) bins[3].count += 1;
    else if (value < 5000) bins[4].count += 1;
    else bins[5].count += 1;
  });

  return bins;
};

const buildReliabilityDistribution = (values: number[]) => {
  const bins: HistogramBin[] = Array.from({ length: 10 }, (_, index) => ({
    label: `${index * 10}-${(index + 1) * 10}`,
    count: 0,
  }));

  values.forEach((value) => {
    const clamped = clamp(value, 0, 100);
    const index = clamped === 100 ? 9 : Math.floor(clamped / 10);
    bins[index].count += 1;
  });

  return bins;
};

function mapValidators(
  rows: ValidatorSourceRow[],
  windowId: GovernanceWindowId,
): InsightValidator[] {
  return rows.map((row) => {
    const missPctSource = windowId === "2y" ? row.didNotVote2y : row.didNotVote1y;
    const missRate = clamp(safeNumber(missPctSource) / 100, 0, 1);
    const votingPower = safeNumber(row.votingPower);
    const reliabilityScore = clamp(Math.round(100 * (1 - missRate)), 0, 100);

    return {
      validator: row.validator,
      votingPower,
      delegators: safeNumber(row.delegators),
      incomeMonthlyUsd: safeNumber(row.incomeMonthlyUsd),
      missRate,
      missPct: missRate * 100,
      yes: safeNumber(row.yes),
      no: safeNumber(row.no),
      abstain: safeNumber(row.abstain),
      noWithVeto: safeNumber(row.noWithVeto),
      effectivePowerPct: votingPower * (1 - missRate),
      reliabilityScore,
      polarization: safeNumber(row.no) + safeNumber(row.noWithVeto),
      voteStyle: voteStyleForRow({
        yes: safeNumber(row.yes),
        no: safeNumber(row.no),
        abstain: safeNumber(row.abstain),
        noWithVeto: safeNumber(row.noWithVeto),
      }),
    };
  });
}

export function deriveGovernanceValidatorInsights(
  rows: ValidatorSourceRow[],
  windowId: GovernanceWindowId,
): GovernanceValidatorInsights {
  const validators = mapValidators(rows, windowId);
  const incomes = validators.map((validator) => validator.incomeMonthlyUsd);
  const delegators = validators.map((validator) => validator.delegators);
  const votingPowers = validators.map((validator) => validator.votingPower);
  const effectivePowers = validators.map((validator) => validator.effectivePowerPct);
  const reliabilityScores = validators.map((validator) => validator.reliabilityScore);

  const totalIncome = sum(incomes);
  const totalDelegators = sum(delegators);
  const totalVotingPower = sum(votingPowers);
  const totalEffectivePower = sum(effectivePowers);
  const effectivePowerLoss = totalVotingPower - totalEffectivePower;

  const paidButAbsent = validators
    .filter((validator) => validator.incomeMonthlyUsd >= 500 && validator.missRate >= 0.5)
    .sort((a, b) => b.incomeMonthlyUsd - a.incomeMonthlyUsd || b.missPct - a.missPct)
    .slice(0, 10)
    .map((validator) => ({
      validator: validator.validator,
      incomeMonthlyUsd: validator.incomeMonthlyUsd,
      missPct: validator.missPct,
      votingPower: validator.votingPower,
    }));

  const topEffectivePower = validators
    .slice()
    .sort((a, b) => b.effectivePowerPct - a.effectivePowerPct)
    .slice(0, 10)
    .map((validator) => ({
      validator: validator.validator,
      effectivePowerPct: validator.effectivePowerPct,
      votingPower: validator.votingPower,
      missPct: validator.missPct,
    }));

  const riskRowsAll = validators
    .filter((validator) => validator.missRate >= 0.7)
    .sort((a, b) => b.delegators - a.delegators);
  const totalDelegatorsAtRisk = sum(riskRowsAll.map((validator) => validator.delegators));

  return {
    kpis: {
      incomeThresholdCounts: {
        gte100: validators.filter((validator) => validator.incomeMonthlyUsd >= 100).length,
        gte500: validators.filter((validator) => validator.incomeMonthlyUsd >= 500).length,
        gte1000: validators.filter((validator) => validator.incomeMonthlyUsd >= 1000).length,
        gte5000: validators.filter((validator) => validator.incomeMonthlyUsd >= 5000).length,
      },
      totalMonthlyIncome: totalIncome,
      incomeTopShares: {
        top1: topShare(incomes, totalIncome, 1),
        top5: topShare(incomes, totalIncome, 5),
        top10: topShare(incomes, totalIncome, 10),
      },
      delegatorTopShares: {
        top1: topShare(delegators, totalDelegators, 1),
        top5: topShare(delegators, totalDelegators, 5),
        top10: topShare(delegators, totalDelegators, 10),
      },
      inactiveVotingPower: {
        neverVotes: sum(
          validators
            .filter((validator) => validator.missRate >= 0.999)
            .map((validator) => validator.votingPower),
        ),
        missOver70: sum(
          validators
            .filter((validator) => validator.missRate >= 0.7)
            .map((validator) => validator.votingPower),
        ),
        missOver50: sum(
          validators
            .filter((validator) => validator.missRate >= 0.5)
            .map((validator) => validator.votingPower),
        ),
      },
      effectivePower: {
        totalVotingPower,
        totalEffectivePower,
        effectivePowerLoss,
      },
      reliability: {
        average: mean(reliabilityScores),
        median: median(reliabilityScores),
      },
      abstainHeavyPower: sum(
        validators
          .filter((validator) => validator.abstain >= 20)
          .map((validator) => validator.votingPower),
      ),
      nakamotoVotingPower: {
        n33: minCountToReach(votingPowers, 33.4),
        n50: minCountToReach(votingPowers, 50),
        n67: minCountToReach(votingPowers, 66.7),
      },
      nakamotoEffectivePower: {
        n33: minCountToReach(effectivePowers, 33.4),
        n50: minCountToReach(effectivePowers, 50),
        n67: minCountToReach(effectivePowers, 66.7),
      },
      powerPolarized: sum(
        validators
          .filter((validator) => validator.polarization >= 30)
          .map((validator) => validator.votingPower),
      ),
    },
    distributions: {
      incomeTiers: buildIncomeTierDistribution(incomes),
      reliability: buildReliabilityDistribution(reliabilityScores),
    },
    ranked: {
      paidButAbsent,
      topEffectivePower,
      delegatorsAtRisk: {
        totalDelegatorsAtRisk,
        rows: riskRowsAll.slice(0, 10).map((validator) => ({
          validator: validator.validator,
          delegators: validator.delegators,
          missPct: validator.missPct,
          votingPower: validator.votingPower,
        })),
      },
    },
  };
}
