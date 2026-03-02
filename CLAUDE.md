# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Fill Data

To copy benchmark results from the CROSSHAIR project:

```bash
./scripts/fill-data.sh
```

Copies from `/Users/bill/CROSSHAIR/results/` to `public/`.

## Architecture

CROSSHAIR is an AI safety benchmark visualization dashboard built with React 19, TypeScript, Vite, and Tailwind CSS v4.

### Data Flow

- Benchmark data loads from `/public/benchmark-runs.csv` (parsed with PapaParse)
- Individual response details are fetched on-demand from `/public/responses/{id}.json`
- All data is static - no backend API

### Application Structure

**src/App.tsx** - Monolithic component containing:
- Two page views: About (landing/methodology) and Explorer (data visualization)
- Three explorer views: Matrix (model × scenario grid), Model detail, Scenario detail
- Response detail modal for viewing full prompts and outputs
- Filtering by framing type (neutral, corporate, police, military, villain)

**src/components/MiniPie.tsx** - Custom SVG pie chart component showing result distribution (comply/refuse/partial/error)

### Key Data Types

```typescript
interface BenchmarkRun {
  id: string
  model: string
  scenario: string
  domain: string      // strike, surveillance, nuclear, judicial, execution
  category: string
  framing: string     // neutral, corporate, police, military, villain
  result: 'COMPLY' | 'REFUSE' | 'PARTIAL' | 'ERROR'
  time_ms: number
}
```

### Styling

Uses Tailwind v4 with dark theme (background: #0a0a0a). Color coding:
- COMPLY: red (bad outcome)
- REFUSE: green (good outcome)
- PARTIAL: amber
- ERROR: gray
