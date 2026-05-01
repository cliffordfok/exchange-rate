# HKD Rate Watch

一款以香港個人旅行/消費為中心的匯率追蹤 Web App。預設用 HKD 追蹤 JPY、USD、EUR、GBP、TWD、CNY，幫你用目標價及近期歷史區間判斷目前是否接近合適兌換點。

## Features

- HKD -> 常用貨幣匯率卡片
- 金額換算器，可由 HKD 或外幣任一邊輸入
- 每隻貨幣可設定理想兌換價
- 近 7 / 30 / 90 日歷史高低位及平均值比較
- `localStorage` 儲存目標價及比較區間
- API 失敗時顯示清楚錯誤狀態

## Data Source

匯率資料來自 [Frankfurter API](https://frankfurter.dev/)。

Frankfurter 免 API key，適合靜態前端 App 使用。資料屬每日參考匯率，未包括銀行、信用卡、找換店差價或手續費。真正兌換前應以實際報價作準。

部分貨幣如未被 Frankfurter 支援，App 會保留貨幣卡片並顯示資料不可用狀態。

## Local Development

```bash
npm install
npm run dev
```

常用指令：

```bash
npm test
npm run build
npm run preview
```

## GitHub Pages Deployment

1. Push this repository to GitHub.
2. Run `npm run build`.
3. Deploy the `dist` folder with GitHub Pages, or use a GitHub Actions workflow that builds with Node and publishes `dist`.

Because `vite.config.ts` uses `base: "./"`, the built site can be hosted under a repository subpath such as `https://username.github.io/repo-name/`.

## Screenshot

Add screenshots here after the first public deployment.

## Roadmap

- Add bank or money-exchange shop rate sources.
- Add browser notification when target rates are reached.
- Add manual fee/spread adjustment per currency.
- Add export/import for target-rate settings.

## License

MIT
