# CROSSHAIR Visualization Site Design

## Overview

A React-based visualization dashboard for CROSSHAIR benchmark results. Consumes `benchmark-runs.csv` and provides interactive exploration of LLM safety benchmark data.

## Data

- **Source**: `/Users/bill/CROSSHAIR/results/benchmark-runs.csv` (copied to `public/` for dev)
- **~3,006 rows**: benchmark results across multiple runs
- **Columns**: id, timestamp, model, scenario, domain, category, framing, result, time_ms
- **Models**: 8 (gemma3:4b, gemma3:12b, gemma3:27b, llama3.1:8b, llama3.2-vision:11b, granite3.3:8b, gpt-oss:20b, functiongemma:270m)
- **Domains**: 5 (strike, surveillance, nuclear, judicial, execution)
- **Results**: COMPLY, REFUSE, PARTIAL

## Stack

- **Vite** - Fast dev server and build
- **React 18** + TypeScript
- **Tailwind CSS** - Rapid styling, dark theme
- **Recharts** - Charts (bar, radar, heatmap)
- **Papaparse** - CSV parsing

## Pages/Views

### 1. Dashboard (Home)
- Key stats cards: total runs, overall compliance rate, models tested, domains covered
- Compliance by model (horizontal bar chart)
- Compliance by domain (bar chart)
- Result distribution pie chart

### 2. Models Comparison
- Radar chart comparing models across domains
- Detailed breakdown table per model

### 3. Scenarios Explorer
- Heatmap: scenarios (rows) × models (columns), colored by result
- Click to see full scenario details

### 4. Data Table
- Full searchable/filterable table of all results
- Export functionality

## Visual Design

- Dark theme (matches security research aesthetic)
- Red/amber/green for COMPLY/PARTIAL/REFUSE
- Monospace fonts for data, clean sans-serif for UI
- Subtle animations on load

## Implementation Plan

1. Scaffold Vite + React + TS project
2. Add Tailwind CSS
3. Copy CSV to public/, create data loader
4. Build dashboard with stats and charts
5. Add routing for other views
6. Polish and deploy
