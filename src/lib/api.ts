import type { CurrencyCode } from "./currencies";
import {
  buildHistoricalUrl,
  classifyAgainstHistory,
  normaliseHistoricalRates,
  type HistoricalStats,
} from "./rates";

const FRANKFURTER_API_BASE = "https://api.frankfurter.dev/v1";
const OCBC_RATES_URL = "./ocbc-rates.json";

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
  askRate: number | null;
  bankForeignToHkdRate: number | null;
  bankHkdToForeignRate: number | null;
  bidRate: number | null;
  latestRate: number | null;
  latestDate: string | null;
  rateSource: "ocbc" | "estimated";
  history: HistoricalStats | null;
  unit: number | null;
  error: string | null;
};

type OcbcRateRow = {
  ccy: string;
  bidRate: number;
  askRate: number;
  unit: number;
  lastUpdateDatetime: string;
};

type OcbcRatesResponse = {
  source: string;
  generatedAt: string | null;
  baseCurrency: "HKD";
  rates: OcbcRateRow[];
};

let ocbcRatesPromise: Promise<OcbcRatesResponse | null> | null = null;

export async function fetchCurrencySnapshot(
  code: CurrencyCode,
  days: number,
  forceRefresh = false,
): Promise<CurrencySnapshot> {
  try {
    const [latestResponse, historicalResponse, ocbcRates] = await Promise.all([
      fetch(`${FRANKFURTER_API_BASE}/latest?base=HKD&symbols=${code}`),
      fetch(buildHistoricalUrl(code, days)),
      fetchOcbcRates(forceRefresh),
    ]);

    if (!latestResponse.ok || !historicalResponse.ok) {
      throw new Error("Frankfurter 暫時未能提供這個貨幣組合。");
    }

    const latest = (await latestResponse.json()) as LatestResponse;
    const historical = (await historicalResponse.json()) as HistoricalResponse;
    const latestRate = latest.rates[code];
    const points = normaliseHistoricalRates(historical.rates as Record<string, Record<string, number>>, code);
    const ocbcRate = ocbcRates?.rates.find((rate) => rate.ccy === code);
    const unit = ocbcRate?.unit ?? null;
    const bankHkdToForeignRate = ocbcRate
      ? ocbcRate.unit / ocbcRate.askRate
      : null;
    const bankForeignToHkdRate = ocbcRate
      ? ocbcRate.bidRate / ocbcRate.unit
      : null;

    if (!Number.isFinite(latestRate)) {
      throw new Error("匯率資料格式不完整。");
    }

    return {
      code,
      askRate: ocbcRate?.askRate ?? null,
      bankForeignToHkdRate,
      bankHkdToForeignRate,
      bidRate: ocbcRate?.bidRate ?? null,
      latestRate: latestRate ?? null,
      latestDate: ocbcRate?.lastUpdateDatetime ?? latest.date,
      rateSource: ocbcRate ? "ocbc" : "estimated",
      history: classifyAgainstHistory(points),
      unit,
      error: null,
    };
  } catch (error) {
    return {
      code,
      askRate: null,
      bankForeignToHkdRate: null,
      bankHkdToForeignRate: null,
      bidRate: null,
      latestRate: null,
      latestDate: null,
      rateSource: "estimated",
      history: null,
      unit: null,
      error: error instanceof Error ? error.message : "未能載入匯率資料。",
    };
  }
}

async function fetchOcbcRates(forceRefresh = false): Promise<OcbcRatesResponse | null> {
  if (forceRefresh) {
    ocbcRatesPromise = null;
  }

  const url = forceRefresh
    ? `${OCBC_RATES_URL}?refresh=${Date.now()}`
    : OCBC_RATES_URL;

  ocbcRatesPromise ??= fetch(url, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        return null;
      }

      return response.json() as Promise<OcbcRatesResponse>;
    })
    .then((payload) => {
      if (!payload || !Array.isArray(payload.rates)) {
        return null;
      }

      return payload;
    })
    .catch(() => null);

  return ocbcRatesPromise;
}
