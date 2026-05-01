import type { CurrencyCode, PeriodDays } from "./currencies";

const STORAGE_KEY = "hkd-rate-watch-settings";

export type UserSettings = {
  bankSpreadPercent: number;
  periodDays: PeriodDays;
  targets: Partial<Record<CurrencyCode, number>>;
  visibleCurrencies: CurrencyCode[];
};

export const defaultSettings: UserSettings = {
  bankSpreadPercent: 1.95,
  periodDays: 30,
  targets: {
    JPY: 20,
    USD: 0.1285,
    EUR: 0.118,
    GBP: 0.101,
    TWD: 4.12,
    CNY: 0.925,
  },
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
      targets: { ...defaultSettings.targets, ...parsed.targets },
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: UserSettings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
