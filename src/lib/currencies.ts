export type CurrencyCode = string;

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

export const AVAILABLE_CURRENCIES: CurrencyMeta[] = [
  { code: "AUD", name: "澳元", flag: "AU", sampleUse: "澳洲旅行" },
  { code: "BRL", name: "巴西雷亞爾", flag: "BR", sampleUse: "巴西消費" },
  { code: "CAD", name: "加拿大元", flag: "CA", sampleUse: "加拿大旅行" },
  { code: "CHF", name: "瑞士法郎", flag: "CH", sampleUse: "瑞士旅行" },
  { code: "CNY", name: "人民幣", flag: "CN", sampleUse: "內地消費" },
  { code: "CZK", name: "捷克克朗", flag: "CZ", sampleUse: "捷克旅行" },
  { code: "DKK", name: "丹麥克朗", flag: "DK", sampleUse: "北歐旅行" },
  { code: "EUR", name: "歐元", flag: "EU", sampleUse: "歐洲旅行" },
  { code: "GBP", name: "英鎊", flag: "GB", sampleUse: "英國消費" },
  { code: "HUF", name: "匈牙利福林", flag: "HU", sampleUse: "匈牙利旅行" },
  { code: "IDR", name: "印尼盾", flag: "ID", sampleUse: "峇里 / 印尼旅行" },
  { code: "ILS", name: "以色列新謝克爾", flag: "IL", sampleUse: "以色列旅行" },
  { code: "INR", name: "印度盧比", flag: "IN", sampleUse: "印度旅行" },
  { code: "ISK", name: "冰島克朗", flag: "IS", sampleUse: "冰島旅行" },
  { code: "JPY", name: "日圓", flag: "JP", sampleUse: "日本旅行" },
  { code: "KRW", name: "韓圜", flag: "KR", sampleUse: "韓國旅行" },
  { code: "MXN", name: "墨西哥披索", flag: "MX", sampleUse: "墨西哥旅行" },
  { code: "MYR", name: "馬來西亞令吉", flag: "MY", sampleUse: "馬來西亞旅行" },
  { code: "NOK", name: "挪威克朗", flag: "NO", sampleUse: "北歐旅行" },
  { code: "NZD", name: "新西蘭元", flag: "NZ", sampleUse: "新西蘭旅行" },
  { code: "PHP", name: "菲律賓披索", flag: "PH", sampleUse: "菲律賓旅行" },
  { code: "PLN", name: "波蘭茲羅提", flag: "PL", sampleUse: "波蘭旅行" },
  { code: "RON", name: "羅馬尼亞列伊", flag: "RO", sampleUse: "羅馬尼亞旅行" },
  { code: "SEK", name: "瑞典克朗", flag: "SE", sampleUse: "北歐旅行" },
  { code: "SGD", name: "新加坡元", flag: "SG", sampleUse: "新加坡旅行" },
  { code: "THB", name: "泰銖", flag: "TH", sampleUse: "泰國旅行" },
  { code: "TRY", name: "土耳其里拉", flag: "TR", sampleUse: "土耳其旅行" },
  { code: "TWD", name: "新台幣", flag: "TW", sampleUse: "台灣旅行" },
  { code: "USD", name: "美元", flag: "US", sampleUse: "網購 / 美股現金" },
  { code: "ZAR", name: "南非蘭特", flag: "ZA", sampleUse: "南非旅行" },
];

export function getCurrencyMeta(code: CurrencyCode): CurrencyMeta {
  return (
    AVAILABLE_CURRENCIES.find((currency) => currency.code === code) ?? {
      code,
      name: code,
      flag: code.slice(0, 2),
      sampleUse: "自訂貨幣",
    }
  );
}

export const PERIOD_OPTIONS = [
  { label: "7日", value: 7 },
  { label: "30日", value: 30 },
  { label: "90日", value: 90 },
] as const;

export type PeriodDays = (typeof PERIOD_OPTIONS)[number]["value"];
