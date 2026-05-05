import type { CurrencyCode, PeriodDays } from "./currencies";

const STORAGE_KEY = "hkd-rate-watch-settings";
const LEGACY_DEFAULT_TARGETS: Partial<Record<CurrencyCode, number[]>> = {
  CNY: [0.925, 1.1532],
  EUR: [0.118, 9.2328],
  GBP: [0.101, 10.7082],
  JPY: [20, 0.0502],
  TWD: [4.12],
  USD: [0.1285, 7.8495],
};

export type UserSettings = {
  bankSpreadPercent: number;
  periodDays: PeriodDays;
  targets: Partial<Record<CurrencyCode, number>>;
  visibleCurrencies: CurrencyCode[];
};

export const defaultSettings: UserSettings = {
  bankSpreadPercent: 1.95,
  periodDays: 30,
  targets: {},
  visibleCurrencies: ["JPY", "USD", "EUR", "GBP", "TWD", "CNY"],
};

export function loadSettings(): UserSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSettings;
    }

    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      targets: cleanStoredTargets(parsed.targets),
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: UserSettings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function cleanStoredTargets(
  targets: Partial<Record<CurrencyCode, number>> | undefined,
): Partial<Record<CurrencyCode, number>> {
  if (!targets) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(targets).filter(([code, value]) => {
      const legacyValues = LEGACY_DEFAULT_TARGETS[code] ?? [];

      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > 0 &&
        !legacyValues.some(
          (legacyValue) => Math.abs(value - legacyValue) <= 0.00001,
        )
      );
    }),
  );
}
