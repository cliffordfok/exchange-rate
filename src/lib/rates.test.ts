import { describe, expect, it } from "vitest";
import {
  classifyAgainstHistory,
  convertFromHkd,
  convertToHkd,
  formatAmount,
  formatRate,
  buildHistoricalUrl,
  isTargetReached,
  normaliseHistoricalRates,
  parseNumberInput,
} from "./rates";

describe("rate helpers", () => {
  it("converts HKD to a foreign currency and back", () => {
    expect(convertFromHkd(1000, 20)).toBe(20000);
    expect(convertToHkd(20000, 20)).toBe(1000);
  });

  it("marks a target as reached only when the current rate is high enough", () => {
    expect(isTargetReached(20.1, 20)).toBe(true);
    expect(isTargetReached(19.9, 20)).toBe(false);
    expect(isTargetReached(20.1)).toBe(false);
  });

  it("classifies current rates against the historical range", () => {
    const stats = classifyAgainstHistory([
      { date: "2026-01-01", value: 18 },
      { date: "2026-01-02", value: 19 },
      { date: "2026-01-03", value: 20 },
    ]);

    expect(stats?.status).toBe("cheap");
    expect(stats?.average).toBe(19);
  });

  it("normalises historical API results into sorted points", () => {
    expect(
      normaliseHistoricalRates(
        {
          "2026-01-02": { JPY: 19 },
          "2026-01-01": { JPY: 18 },
          "2026-01-03": {},
        },
        "JPY",
      ),
    ).toEqual([
      { date: "2026-01-01", value: 18 },
      { date: "2026-01-02", value: 19 },
    ]);
  });

  it("formats displayed numbers with thousands separators", () => {
    expect(formatAmount(1234567.89123)).toBe("1,234,567.8912");
    expect(formatRate(1234.5)).toBe("1,234.50");
  });

  it("parses numeric input with separators", () => {
    expect(parseNumberInput("1,234,567.89")).toBe(1234567.89);
  });

  it("builds the current Frankfurter v1 historical URL", () => {
    expect(buildHistoricalUrl("JPY", 7, new Date("2026-04-30T12:00:00Z"))).toBe(
      "https://api.frankfurter.dev/v1/2026-04-23..2026-04-30?base=HKD&symbols=JPY",
    );
  });
});
