import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  CheckCircle2,
  RefreshCw,
  Settings2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  BASE_CURRENCY,
  DEFAULT_CURRENCIES,
  PERIOD_OPTIONS,
  type CurrencyCode,
  type PeriodDays,
} from "./lib/currencies";
import { fetchCurrencySnapshot, type CurrencySnapshot } from "./lib/api";
import {
  convertFromHkd,
  convertToHkd,
  formatAmount,
  formatRate,
  isTargetReached,
  parseNumberInput,
} from "./lib/rates";
import { loadSettings, saveSettings, type UserSettings } from "./lib/storage";

type LoadState = "idle" | "loading" | "ready";

export function App() {
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [snapshots, setSnapshots] = useState<Partial<Record<CurrencyCode, CurrencySnapshot>>>(
    {},
  );
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("JPY");
  const [hkdAmount, setHkdAmount] = useState(10000);
  const [foreignAmount, setForeignAmount] = useState(0);
  const [lastEdited, setLastEdited] = useState<"hkd" | "foreign">("hkd");

  const visibleMetas = useMemo(
    () =>
      DEFAULT_CURRENCIES.filter((currency) =>
        settings.visibleCurrencies.includes(currency.code),
      ),
    [settings.visibleCurrencies],
  );

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      setLoadState("loading");
      const results = await Promise.all(
        settings.visibleCurrencies.map((code) =>
          fetchCurrencySnapshot(code, settings.periodDays),
        ),
      );

      if (cancelled) {
        return;
      }

      setSnapshots(
        results.reduce(
          (accumulator, snapshot) => {
            accumulator[snapshot.code] = snapshot;
            return accumulator;
          },
          {} as Partial<Record<CurrencyCode, CurrencySnapshot>>,
        ),
      );
      setLoadState("ready");
    }

    loadRates();

    return () => {
      cancelled = true;
    };
  }, [settings.periodDays, settings.visibleCurrencies]);

  const selectedSnapshot = snapshots[selectedCurrency];
  const selectedRate = selectedSnapshot?.latestRate ?? 0;

  useEffect(() => {
    if (!selectedRate) {
      return;
    }

    if (lastEdited === "hkd") {
      setForeignAmount(convertFromHkd(hkdAmount, selectedRate));
    } else {
      setHkdAmount(convertToHkd(foreignAmount, selectedRate));
    }
  }, [foreignAmount, hkdAmount, lastEdited, selectedRate]);

  function updateTarget(code: CurrencyCode, value: string) {
    const target = Number(value);
    setSettings((current) => ({
      ...current,
      targets: {
        ...current.targets,
        [code]: Number.isFinite(target) && target > 0 ? target : undefined,
      },
    }));
  }

  function updatePeriod(periodDays: PeriodDays) {
    setSettings((current) => ({ ...current, periodDays }));
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">HKD Rate Watch</p>
          <h1>匯率去到你想要嘅位，先換。</h1>
          <p>
            以港元為中心追蹤常用旅行貨幣，結合目標價同歷史區間，快速判斷而家係咪值得兌換。
          </p>
        </div>
        <div className="hero-panel" aria-label="匯率資料狀態">
          <div>
            <span>資料來源</span>
            <strong>Frankfurter API</strong>
          </div>
          <div>
            <span>比較區間</span>
            <strong>近 {settings.periodDays} 日</strong>
          </div>
          <div>
            <span>更新</span>
            <strong>{loadState === "loading" ? "載入中" : "每日參考價"}</strong>
          </div>
        </div>
      </section>

      <section className="toolbar" aria-label="追蹤設定">
        <div className="section-title">
          <Settings2 size={20} aria-hidden="true" />
          <div>
            <h2>追蹤設定</h2>
            <p>設定歷史比較區間同每隻貨幣嘅理想兌換價。</p>
          </div>
        </div>
        <div className="segmented" aria-label="歷史比較區間">
          {PERIOD_OPTIONS.map((option) => (
            <button
              className={settings.periodDays === option.value ? "active" : ""}
              key={option.value}
              onClick={() => updatePeriod(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="converter">
        <div className="section-title">
          <ArrowDownUp size={20} aria-hidden="true" />
          <div>
            <h2>金額換算器</h2>
            <p>選一隻貨幣，輸入任一邊金額，即時計返另一邊。</p>
          </div>
        </div>
        <div className="converter-grid">
          <label>
            <span>由 {BASE_CURRENCY}</span>
            <input
              min="0"
              onChange={(event) => {
                setLastEdited("hkd");
                setHkdAmount(parseNumberInput(event.target.value));
              }}
              inputMode="decimal"
              type="text"
              value={formatAmount(hkdAmount)}
            />
          </label>
          <label>
            <span>換成</span>
            <select
              onChange={(event) => setSelectedCurrency(event.target.value as CurrencyCode)}
              value={selectedCurrency}
            >
              {visibleMetas.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{selectedCurrency}</span>
            <input
              min="0"
              onChange={(event) => {
                setLastEdited("foreign");
                setForeignAmount(parseNumberInput(event.target.value));
              }}
              inputMode="decimal"
              type="text"
              value={formatAmount(foreignAmount)}
            />
          </label>
        </div>
      </section>

      <section className="rate-grid" aria-label="常用貨幣匯率">
        {visibleMetas.map((currency) => (
          <RateCard
            currency={currency}
            isSelected={selectedCurrency === currency.code}
            key={currency.code}
            onSelect={() => setSelectedCurrency(currency.code)}
            onTargetChange={(value) => updateTarget(currency.code, value)}
            snapshot={snapshots[currency.code]}
            target={settings.targets[currency.code]}
          />
        ))}
      </section>

      <section className="notice">
        <AlertCircle size={18} aria-hidden="true" />
        <p>
          匯率資料為參考價，未包括銀行、信用卡、找換店差價或手續費。真正兌換前應以實際報價作準。
        </p>
      </section>
    </main>
  );
}

function RateCard({
  currency,
  isSelected,
  onSelect,
  onTargetChange,
  snapshot,
  target,
}: {
  currency: (typeof DEFAULT_CURRENCIES)[number];
  isSelected: boolean;
  onSelect: () => void;
  onTargetChange: (value: string) => void;
  snapshot?: CurrencySnapshot;
  target?: number;
}) {
  const rate = snapshot?.latestRate;
  const reached = rate ? isTargetReached(rate, target) : false;
  const history = snapshot?.history;
  const badge = getHistoryBadge(history?.status);

  return (
    <article className={`rate-card ${isSelected ? "selected" : ""}`}>
      <button className="card-main" onClick={onSelect} type="button">
        <span className="currency-mark">{currency.flag}</span>
        <span>
          <strong>{currency.code}</strong>
          <small>{currency.name} · {currency.sampleUse}</small>
        </span>
      </button>

      {snapshot?.error ? (
        <div className="card-error">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{snapshot.error}</span>
        </div>
      ) : rate ? (
        <>
          <div className="rate-line">
            <span>1 HKD</span>
            <strong>{formatRate(rate)} {currency.code}</strong>
          </div>
          <div className={`signal ${reached ? "good" : "watch"}`}>
            {reached ? <CheckCircle2 size={18} /> : <RefreshCw size={18} />}
            <span>{reached ? "已到目標價" : "未到目標價"}</span>
          </div>
          <div className={`signal ${badge.className}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>
          {history ? <HistoryBar low={history.low} high={history.high} latest={history.latest} /> : null}
          <dl>
            <div>
              <dt>低位</dt>
              <dd>{history ? formatRate(history.low) : "--"}</dd>
            </div>
            <div>
              <dt>平均</dt>
              <dd>{history ? formatRate(history.average) : "--"}</dd>
            </div>
            <div>
              <dt>高位</dt>
              <dd>{history ? formatRate(history.high) : "--"}</dd>
            </div>
          </dl>
        </>
      ) : (
        <div className="loading-line">
          <RefreshCw size={18} aria-hidden="true" />
          <span>載入匯率中</span>
        </div>
      )}

      <label className="target-input">
        <span>理想兌換價</span>
        <input
          min="0"
          onChange={(event) => onTargetChange(event.target.value)}
          placeholder={`例如 ${rate ? formatRate(rate) : "20.00"}`}
          step="0.0001"
          type="number"
          value={target ?? ""}
        />
      </label>
      <p className="updated">更新日期：{snapshot?.latestDate ?? "--"}</p>
    </article>
  );
}

function HistoryBar({ low, high, latest }: { low: number; high: number; latest: number }) {
  const range = high - low;
  const position = range <= 0 ? 50 : ((latest - low) / range) * 100;

  return (
    <div className="history-bar" aria-label="歷史區間位置">
      <span style={{ left: `${Math.max(0, Math.min(100, position))}%` }} />
    </div>
  );
}

function getHistoryBadge(status: "cheap" | "average" | "expensive" | undefined) {
  if (status === "cheap") {
    return {
      className: "good",
      icon: <TrendingUp size={18} aria-hidden="true" />,
      label: "接近近期高位，較適合換入",
    };
  }

  if (status === "expensive") {
    return {
      className: "risk",
      icon: <TrendingDown size={18} aria-hidden="true" />,
      label: "接近近期低位，可再觀察",
    };
  }

  return {
    className: "neutral",
    icon: <ArrowDownUp size={18} aria-hidden="true" />,
    label: "接近近期平均",
  };
}
