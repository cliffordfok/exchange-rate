import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  CheckCircle2,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import {
  AVAILABLE_CURRENCIES,
  BASE_CURRENCY,
  DEFAULT_CURRENCIES,
  PERIOD_OPTIONS,
  getCurrencyMeta,
  type CurrencyMeta,
  type CurrencyCode,
  type PeriodDays,
} from "./lib/currencies";
import { fetchCurrencySnapshot, type CurrencySnapshot } from "./lib/api";
import {
  convertFromHkd,
  applyBankSpread,
  formatAmount,
  formatPercent,
  formatRate,
  isTargetReached,
  parseNumberInput,
} from "./lib/rates";
import { loadSettings, saveSettings, type UserSettings } from "./lib/storage";

type LoadState = "idle" | "loading" | "ready";
type ConverterDirection = "hkd-to-foreign" | "foreign-to-hkd";

export function App() {
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [snapshots, setSnapshots] = useState<Partial<Record<CurrencyCode, CurrencySnapshot>>>(
    {},
  );
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("JPY");
  const [currencyToAdd, setCurrencyToAdd] = useState<CurrencyCode>("AUD");
  const [hkdAmount, setHkdAmount] = useState(10000);
  const [foreignAmount, setForeignAmount] = useState(0);
  const [lastEdited, setLastEdited] = useState<"hkd" | "foreign">("hkd");
  const [converterDirection, setConverterDirection] =
    useState<ConverterDirection>("hkd-to-foreign");

  const visibleMetas = useMemo(
    () => settings.visibleCurrencies.map((code) => getCurrencyMeta(code)),
    [settings.visibleCurrencies],
  );

  const availableToAdd = useMemo(
    () =>
      AVAILABLE_CURRENCIES.filter(
        (currency) =>
          currency.code !== BASE_CURRENCY &&
          !settings.visibleCurrencies.includes(currency.code),
      ),
    [settings.visibleCurrencies],
  );

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!settings.visibleCurrencies.includes(selectedCurrency)) {
      setSelectedCurrency(settings.visibleCurrencies[0] ?? "JPY");
    }
  }, [selectedCurrency, settings.visibleCurrencies]);

  useEffect(() => {
    if (availableToAdd.length === 0) {
      return;
    }

    if (!availableToAdd.some((currency) => currency.code === currencyToAdd)) {
      setCurrencyToAdd(availableToAdd[0].code);
    }
  }, [availableToAdd, currencyToAdd]);

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
  const selectedHkdToForeignRate =
    selectedSnapshot?.bankHkdToForeignRate ??
    applyBankSpread(selectedRate, settings.bankSpreadPercent);
  const selectedForeignToHkdRate =
    selectedSnapshot?.bankForeignToHkdRate ??
    (selectedHkdToForeignRate ? 1 / selectedHkdToForeignRate : 0);

  useEffect(() => {
    if (!selectedHkdToForeignRate || !selectedForeignToHkdRate) {
      return;
    }

    if (lastEdited === "hkd") {
      setForeignAmount(convertFromHkd(hkdAmount, selectedHkdToForeignRate));
    } else {
      setHkdAmount(convertFromHkd(foreignAmount, selectedForeignToHkdRate));
    }
  }, [
    foreignAmount,
    hkdAmount,
    lastEdited,
    selectedForeignToHkdRate,
    selectedHkdToForeignRate,
  ]);

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

  function updateBankSpread(value: string) {
    const spreadPercent = Number(value);
    setSettings((current) => ({
      ...current,
      bankSpreadPercent:
        Number.isFinite(spreadPercent) && spreadPercent >= 0
          ? spreadPercent
          : current.bankSpreadPercent,
    }));
  }

  function addCurrency() {
    if (!currencyToAdd || settings.visibleCurrencies.includes(currencyToAdd)) {
      return;
    }

    setSettings((current) => ({
      ...current,
      visibleCurrencies: [...current.visibleCurrencies, currencyToAdd],
    }));
    setSelectedCurrency(currencyToAdd);
  }

  function removeCurrency(code: CurrencyCode) {
    setSettings((current) => {
      if (current.visibleCurrencies.length <= 1) {
        return current;
      }

      return {
        ...current,
        visibleCurrencies: current.visibleCurrencies.filter(
          (currency) => currency !== code,
        ),
      };
    });
  }

  function resetCurrencies() {
    setSettings((current) => ({
      ...current,
      visibleCurrencies: DEFAULT_CURRENCIES.map((currency) => currency.code),
    }));
    setSelectedCurrency(DEFAULT_CURRENCIES[0].code);
  }

  function swapConverterDirection() {
    setConverterDirection((current) =>
      current === "hkd-to-foreign" ? "foreign-to-hkd" : "hkd-to-foreign",
    );
  }

  const leftCurrency =
    converterDirection === "hkd-to-foreign" ? BASE_CURRENCY : selectedCurrency;
  const rightCurrency =
    converterDirection === "hkd-to-foreign" ? selectedCurrency : BASE_CURRENCY;
  const leftAmount =
    converterDirection === "hkd-to-foreign" ? hkdAmount : foreignAmount;
  const rightAmount =
    converterDirection === "hkd-to-foreign" ? foreignAmount : hkdAmount;

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
            <span>銀行價</span>
            <strong>OCBC / fallback</strong>
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
        <div className="settings-controls">
          <label className="spread-input">
            <span>銀行/卡差價估算</span>
            <input
              min="0"
              onChange={(event) => updateBankSpread(event.target.value)}
              step="0.05"
              type="number"
              value={settings.bankSpreadPercent}
            />
          </label>
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
        </div>
      </section>

      <section className="currency-manager" aria-label="貨幣管理">
        <div className="section-title">
          <Plus size={20} aria-hidden="true" />
          <div>
            <h2>更換貨幣</h2>
            <p>新增或移除你想追蹤嘅貨幣，換算器會跟住同步。</p>
          </div>
        </div>
        <div className="currency-actions">
          <label>
            <span>新增貨幣</span>
            <select
              disabled={availableToAdd.length === 0}
              onChange={(event) => setCurrencyToAdd(event.target.value)}
              value={currencyToAdd}
            >
              {availableToAdd.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="icon-button primary"
            disabled={availableToAdd.length === 0}
            onClick={addCurrency}
            title="新增貨幣"
            type="button"
          >
            <Plus size={18} aria-hidden="true" />
            <span>新增</span>
          </button>
          <button
            className="icon-button"
            onClick={resetCurrencies}
            title="重設預設貨幣"
            type="button"
          >
            <RotateCcw size={18} aria-hidden="true" />
            <span>重設</span>
          </button>
        </div>
      </section>

      <section className="converter">
        <div className="section-title">
          <button
            className="converter-swap-button"
            onClick={swapConverterDirection}
            title="對掉貨幣"
            type="button"
          >
            <ArrowDownUp size={20} aria-hidden="true" />
          </button>
          <div>
            <h2>金額換算器</h2>
            <p>選一隻貨幣，輸入任一邊金額，即時計返另一邊。</p>
          </div>
        </div>
        <div className="converter-grid">
          <label>
            <span>由 {leftCurrency}</span>
            <input
              min="0"
              onChange={(event) => {
                if (converterDirection === "hkd-to-foreign") {
                  setLastEdited("hkd");
                  setHkdAmount(parseNumberInput(event.target.value));
                } else {
                  setLastEdited("foreign");
                  setForeignAmount(parseNumberInput(event.target.value));
                }
              }}
              inputMode="decimal"
              type="text"
              value={formatAmount(leftAmount)}
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
            <span>{rightCurrency}</span>
            <input
              min="0"
              onChange={(event) => {
                if (converterDirection === "hkd-to-foreign") {
                  setLastEdited("foreign");
                  setForeignAmount(parseNumberInput(event.target.value));
                } else {
                  setLastEdited("hkd");
                  setHkdAmount(parseNumberInput(event.target.value));
                }
              }}
              inputMode="decimal"
              type="text"
              value={formatAmount(rightAmount)}
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
            onRemove={() => removeCurrency(currency.code)}
            onTargetChange={(value) => updateTarget(currency.code, value)}
            bankSpreadPercent={settings.bankSpreadPercent}
            removable={visibleMetas.length > 1}
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
  onRemove,
  onTargetChange,
  bankSpreadPercent,
  removable,
  snapshot,
  target,
}: {
  currency: CurrencyMeta;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onTargetChange: (value: string) => void;
  bankSpreadPercent: number;
  removable: boolean;
  snapshot?: CurrencySnapshot;
  target?: number;
}) {
  const rate = snapshot?.latestRate;
  const effectiveRate =
    snapshot?.bankHkdToForeignRate ??
    (rate ? applyBankSpread(rate, bankSpreadPercent) : 0);
  const reached = effectiveRate ? isTargetReached(effectiveRate, target) : false;
  const history = snapshot?.history;
  const badge = getHistoryBadge(history?.status);
  const usesOcbc = snapshot?.rateSource === "ocbc";

  return (
    <article className={`rate-card ${isSelected ? "selected" : ""}`}>
      <button className="card-main" onClick={onSelect} type="button">
        <span className="currency-mark">{currency.flag}</span>
        <span>
          <strong>{currency.code}</strong>
          <small>{currency.name} · {currency.sampleUse}</small>
        </span>
      </button>
      <button
        className="remove-card"
        disabled={!removable}
        onClick={onRemove}
        title={removable ? "移除貨幣" : "至少保留一隻貨幣"}
        type="button"
      >
        <X size={17} aria-hidden="true" />
      </button>

      {snapshot?.error ? (
        <div className="card-error">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{snapshot.error}</span>
        </div>
      ) : rate ? (
        <>
          {usesOcbc && snapshot?.askRate && snapshot?.bidRate ? (
            <>
              <div className="bank-quote-unit">
                1 {currency.code} = HKD
              </div>
              <div className="bank-quote-grid">
                <div className="bank-quote bid">
                  <span>銀行買入價</span>
                  <strong>{formatRate(snapshot.bidRate)}</strong>
                </div>
                <div className="bank-quote ask">
                  <span>銀行賣出價</span>
                  <strong>{formatRate(snapshot.askRate)}</strong>
                </div>
              </div>
              <p className="spread-note">
                換外幣用賣出價；外幣換港元用買入價
              </p>
            </>
          ) : (
            <>
              <div className="rate-line">
                <span>市場參考價</span>
                <strong>{formatRate(rate)} {currency.code}</strong>
              </div>
              <div className="rate-line effective">
                <span>銀行估算價</span>
                <strong>{formatRate(effectiveRate)} {currency.code}</strong>
              </div>
              <p className="spread-note">
                已扣除 {formatPercent(bankSpreadPercent)} 估算差價 / 手續費
              </p>
            </>
          )}
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
          placeholder={`例如 ${effectiveRate ? formatRate(effectiveRate) : "20.00"}`}
          step="0.0001"
          type="number"
          value={target ?? ""}
        />
      </label>
      <p className="updated">更新日期：{formatDisplayDate(snapshot?.latestDate)}</p>
    </article>
  );
}

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-HK", {
    dateStyle: "short",
    timeStyle: "short",
  });
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
