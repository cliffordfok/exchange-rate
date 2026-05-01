import type { CurrencyCode } from "./currencies";

export type RatePoint = {
  date: string;
  value: number;
};

export type HistoricalStats = {
  low: number;
  high: number;
  average: number;
  latest: number;
  status: "cheap" | "average" | "expensive";
  points: RatePoint[];
};

export function classifyAgainstHistory(
  points: RatePoint[],
): HistoricalStats | null {
  if (points.length === 0) {
    return null;
  }

  const values = points.map((point) => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const average = values.reduce((total, value) => total + value, 0) / values.length;
  const latest = points[points.length - 1].value;
  const range = high - low;

  if (range === 0) {
    return { low, high, average, latest, status: "average", points };
  }

  const position = (latest - low) / range;
  const status =
    position >= 0.66 ? "cheap" : position <= 0.34 ? "expensive" : "average";

  return { low, high, average, latest, status, points };
}

export function isTargetReached(currentRate: number, targetRate?: number): boolean {
  if (!targetRate || targetRate <= 0) {
    return false;
  }

  return currentRate >= targetRate;
}

export function formatRate(value: number): string {
  const fractionDigits = getRateFractionDigits(value);

  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString("en-US", {
    maximumFractionDigits: 4,
  });
}

export function parseNumberInput(value: string): number {
  const parsed = Number(value.replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function getRateFractionDigits(value: number): number {
  if (value >= 100) {
    return 2;
  }

  if (value >= 10) {
    return 3;
  }

  return 4;
}

export function convertFromHkd(hkdAmount: number, rate: number): number {
  return hkdAmount * rate;
}

export function convertToHkd(foreignAmount: number, rate: number): number {
  if (rate <= 0) {
    return 0;
  }

  return foreignAmount / rate;
}

export function buildHistoricalUrl(
  to: CurrencyCode,
  days: number,
  today = new Date(),
): string {
  const end = toIsoDate(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  const start = toIsoDate(startDate);

  return `https://api.frankfurter.dev/v1/${start}..${end}?base=HKD&symbols=${to}`;
}

export function normaliseHistoricalRates(
  rates: Record<string, Record<string, number>>,
  to: CurrencyCode,
): RatePoint[] {
  return Object.entries(rates)
    .map(([date, values]) => ({ date, value: values[to] }))
    .filter((point): point is RatePoint => Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
