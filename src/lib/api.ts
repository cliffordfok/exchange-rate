import type { CurrencyCode } from "./currencies";
import {
  buildHistoricalUrl,
  classifyAgainstHistory,
  normaliseHistoricalRates,
  type HistoricalStats,
} from "./rates";

const FRANKFURTER_API_BASE = "https://api.frankfurter.dev/v1";

type LatestResponse = {
  amount: number;
  base: "HKD";
  date: string;
  rates: Partial<Record<CurrencyCode, number>>;
};

type HistoricalResponse = {
  amount: number;
  base: "HKD";
  start_date: string;
  end_date: string;
  rates: Record<string, Partial<Record<CurrencyCode, number>>>;
};

export type CurrencySnapshot = {
  code: CurrencyCode;
  latestRate: number | null;
  latestDate: string | null;
  history: HistoricalStats | null;
  error: string | null;
};

export async function fetchCurrencySnapshot(
  code: CurrencyCode,
  days: number,
): Promise<CurrencySnapshot> {
  try {
    const [latestResponse, historicalResponse] = await Promise.all([
      fetch(`${FRANKFURTER_API_BASE}/latest?base=HKD&symbols=${code}`),
      fetch(buildHistoricalUrl(code, days)),
    ]);

    if (!latestResponse.ok || !historicalResponse.ok) {
      throw new Error("Frankfurter 暫時未能提供這個貨幣組合。");
    }

    const latest = (await latestResponse.json()) as LatestResponse;
    const historical = (await historicalResponse.json()) as HistoricalResponse;
    const latestRate = latest.rates[code];
    const points = normaliseHistoricalRates(historical.rates as Record<string, Record<string, number>>, code);

    if (!Number.isFinite(latestRate)) {
      throw new Error("匯率資料格式不完整。");
    }

    return {
      code,
      latestRate: latestRate ?? null,
      latestDate: latest.date,
      history: classifyAgainstHistory(points),
      error: null,
    };
  } catch (error) {
    return {
      code,
      latestRate: null,
      latestDate: null,
      history: null,
      error: error instanceof Error ? error.message : "未能載入匯率資料。",
    };
  }
}
