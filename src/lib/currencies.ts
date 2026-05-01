export type CurrencyCode = "JPY" | "USD" | "EUR" | "GBP" | "TWD" | "CNY";

export type CurrencyMeta = {
  code: CurrencyCode;
  name: string;
  flag: string;
  sampleUse: string;
};

export const BASE_CURRENCY = "HKD";

export const DEFAULT_CURRENCIES: CurrencyMeta[] = [
  { code: "JPY", name: "日圓", flag: "JP", sampleUse: "日本旅行" },
  { code: "USD", name: "美元", flag: "US", sampleUse: "網購 / 美股現金" },
  { code: "EUR", name: "歐元", flag: "EU", sampleUse: "歐洲旅行" },
  { code: "GBP", name: "英鎊", flag: "GB", sampleUse: "英國消費" },
  { code: "TWD", name: "新台幣", flag: "TW", sampleUse: "台灣旅行" },
  { code: "CNY", name: "人民幣", flag: "CN", sampleUse: "內地消費" },
];

export const PERIOD_OPTIONS = [
  { label: "7日", value: 7 },
  { label: "30日", value: 30 },
  { label: "90日", value: 90 },
] as const;

export type PeriodDays = (typeof PERIOD_OPTIONS)[number]["value"];
