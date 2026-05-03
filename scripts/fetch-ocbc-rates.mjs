import { mkdir, writeFile } from "node:fs/promises";

const OCBC_ENDPOINT =
  "https://ebanking.ocbc.com.hk/digital/api/fx-hk/v1/public/fx-rate/inquiry";
const OUTPUT_PATH = new URL("../public/ocbc-rates.json", import.meta.url);

function formatHongKongDateTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const value = (type) => parts.find((part) => part.type === type)?.value ?? "00";

  return `${value("year")}-${value("month")}-${value("day")}T${value(
    "hour",
  )}:${value("minute")}:${value("second")}.000+08:00`;
}

async function fetchOcbcRates() {
  const response = await fetch(OCBC_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-correlation-id": String(Date.now()),
      "x-source-country": "HK",
      "x-source-date-time": formatHongKongDateTime(),
      "x-source-id": "IWPG",
      "x-lang-id": "en_US",
    },
    body: JSON.stringify({
      currencyCodes: [],
      pageSize: 50,
      pageIdx: 1,
      baseCurrency: "HKD",
      rateType: "I",
    }),
  });

  if (!response.ok) {
    throw new Error(`OCBC returned HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.status !== "success" || !Array.isArray(payload.data)) {
    throw new Error("OCBC response did not contain rate data");
  }

  return payload.data
    .filter((row) => row?.ccy && Number.isFinite(Number(row.askRate)))
    .map((row) => ({
      ccy: String(row.ccy),
      ccyFrom: String(row.ccyFrom ?? row.ccy),
      ccyTo: String(row.ccyTo ?? "HKD"),
      bidRate: Number(row.bidRate),
      askRate: Number(row.askRate),
      unit: Number(row.unit || 1),
      lastUpdateDatetime: String(row.lastUpdateDatetime ?? ""),
    }));
}

const rates = await fetchOcbcRates();
const generatedAt = new Date().toISOString();

await mkdir(new URL("../public", import.meta.url), { recursive: true });
await writeFile(
  OUTPUT_PATH,
  `${JSON.stringify(
    {
      source: "OCBC Hong Kong",
      sourceUrl:
        "https://www.ocbc.com.hk/personal-banking/zh/ocbc-bank-foreign-exchange-rates-for-personal-banking",
      generatedAt,
      baseCurrency: "HKD",
      rates,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${rates.length} OCBC rates to ${OUTPUT_PATH.pathname}`);
