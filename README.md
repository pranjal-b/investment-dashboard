# Investment Analytics Dashboard

A professional-grade Investment Analytics Dashboard built for HNIs and sophisticated investors. Analytics-heavy, institutional UI with Indian market context and dummy data.

**Design goal:** Bloomberg Terminal meets Zerodha Console meets Private Banking Portfolio Analytics.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Charts:** ECharts (echarts-for-react)
- **State:** Zustand
- **XIRR:** xirr npm package
- **Theme:** next-themes (dark/light)

## Features

- **Summary KPI Cards:** Total Investment, Current Value, Absolute Gain/Loss, Portfolio XIRR, Allocation Deviation
- **Allocation Overview:** Asset class donut, Target vs Actual, Residual allocation
- **Sector & Market Cap Exposure:** Treemap (click to filter), bar chart
- **Exposure Attribution:** Sector exposure by vehicle (Direct Equity, MF, AIF, PMS, ETF)
- **Investment Table:** Sortable, filterable, expandable rows with cashflow timeline and benchmark comparison
- **Advanced Analytics:** Sector heatmap, Rolling XIRR, Gain waterfall, Concentration risk indicator
- **Global Filters:** Asset class, sector, market cap, gain/loss, value mode
- **Theme:** Dark and light mode support

## Project Structure

```
src/
├── app/
│   ├── investment-dashboard/page.tsx   # Main dashboard route
│   └── api/holdings/route.ts           # Mock API
├── components/
│   ├── dashboard/                      # Dashboard sections
│   ├── ui/                             # shadcn components
│   └── providers/
├── lib/
│   ├── calculations/                   # XIRR, metrics, exposure
│   ├── store/                          # Zustand store
│   └── types/
└── data/
    └── mock-holdings.json              # Dummy Indian market data
```

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root redirects to `/investment-dashboard`.

### Build

```bash
npm run build
npm start
```

### Deployment (Vercel / Node)

1. **Vercel:** Connect the repo and deploy. Route `/investment-dashboard` is the main entry.
2. **Standalone:** Run `npm run build && npm start`. Serves on port 3000 by default.
3. **Embedding:** The dashboard is suitable for iframe embedding. Use the URL:
   `https://your-domain.com/investment-dashboard`

### Iframe Embedding

To embed in another application:

```html
<iframe
  src="https://your-domain.com/investment-dashboard"
  width="100%"
  height="800"
  frameborder="0"
></iframe>
```

For cross-origin embedding, ensure the host sets `X-Frame-Options: ALLOWALL` or appropriate `frame-ancestors` in CSP.

## Financial Logic

- **XIRR:** Uses Newton-Raphson via `xirr` package. Aggregates cashflows across holdings for portfolio XIRR.
- **Allocation Deviation:** Sum of |actual % - target %| across asset classes.
- **Sector Exposure:** For direct equity, full value to sector. For MF/AIF with `sectorSplit`, allocates by weight.
- **Herfindahl Index:** Sum of squared portfolio share weights. Higher = more concentrated.

## Mock Data

`src/data/mock-holdings.json` contains ~30 holdings across:
- Asset classes: Equity, MutualFund, AIF, PMS, ETF
- Sectors: Banking, IT, Pharma, FMCG, Auto, CapitalGoods, Energy, Infra, Consumption, Chemicals
- Market caps: Large, Mid, Small

To scale to 1000+ holdings, expand the JSON. The dashboard uses memoization and virtualized table support for performance.
