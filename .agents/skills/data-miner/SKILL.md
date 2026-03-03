---
name: data-miner
description: Use when exploring unfamiliar datasets, profiling data quality, hunting for non-obvious patterns, or when user asks "what's interesting in this data". Triggers on new CSV load, exploratory analysis requests, or before article-mode.
---

# Data Mining: Expert-Level Exploration

## The Iron Law

```
INTERESTING ≠ OBVIOUS

"Sales are higher in December" is not interesting.
"Revenue per customer dropped 40% when we expanded to enterprise" is interesting.

Keep digging until you find something worth telling someone about.
```

## Core Methodology

You are a PhD-trained statistician with business acumen. You think in:

- **Distributions** (skewness, kurtosis, multimodality) — not just "averages"
- **Heteroscedasticity** — variance changing across groups signals something
- **Simpson's paradox** — aggregate trends that reverse in subgroups
- **Effect sizes** — p-values are cheap, Cohen's d matters
- **Confounding** — correlation without mechanism is suspicious
- **Base rates** — rare events look significant without context
- **Survivorship bias** — what data is NOT here?

---

## Phase 1: Profile the Terrain

**DO NOT ask questions until you understand the data shape.**

### With Dolex

```
load_csv(name, path)        → sourceId + smart summary
describe_data(sourceId)     → full stats: min/max/mean/median/stddev/p25/p75, top values, sample rows
```

### Profile Checklist

| Check | What You're Looking For |
|-------|------------------------|
| **Row count** | Scale: 100 rows vs 1M rows changes everything |
| **Column types** | Numeric, categorical, date, text, ID |
| **Cardinality** | 5 values vs 5000 values — different charts, different SQL |
| **Missing data** | What's NULL? Random (MCAR) or systematic (MAR/MNAR)? |
| **Numeric ranges** | min/max spread, negative values, zeros |
| **Distribution shape** | Mean ≈ median? Heavy tails? Bimodal? |
| **Top values** | Pareto concentration — do 5 values account for 80%? |

### Distribution Diagnostics

```
MEAN >> MEDIAN (or MEDIAN >> MEAN)
→ Skewed distribution. Log-transform for analysis. Report median, not mean.

STDDEV > MEAN
→ High coefficient of variation. Look for subpopulations.

P75 - P25 << MAX - MIN
→ Outliers dominating range. Use IQR-based bounds.

Multiple modes in histogram
→ Mixture of populations. Segment before analyzing.
```

---

## Phase 2: Generate Hypotheses

### Use analyze_data Intelligently

```
analyze_data(sourceId, maxSteps: 6)
```

This auto-generates analysis steps. **DO NOT blindly execute all of them.** Instead:

1. **Read the column classifications** — what did it identify as measures, dimensions, time columns?
2. **Prioritize by user interest** — if they asked about trends, start with time-series steps
3. **Modify the SQL** — add filters, change aggregations, drill into subgroups
4. **Skip irrelevant steps** — ranking analysis on 3 categories is useless

### Questions a Pro Asks

Before ANY analysis:

| Question | Why It Matters |
|----------|----------------|
| What's the **generating process**? | How was this data created? Surveys, transactions, sensors? |
| What's the **population**? | Who/what does this represent? Who's missing? |
| What's the **time window**? | Seasonal effects? Regime changes? COVID distortion? |
| What would **falsify** my hypothesis? | What data would prove me wrong? |

---

## Phase 3: Hunt for Patterns

### Statistical Signals

| Signal | Detection Method | Interpretation |
|--------|-----------------|----------------|
| **Outliers** | IQR × 1.5, Mahalanobis distance, Z > 3 | Data quality issue OR genuine extreme |
| **Trends** | Linear regression slope, Mann-Kendall test | Direction + magnitude + significance |
| **Seasonality** | ACF peaks at regular lags | Calendar-driven patterns |
| **Correlation** | Pearson/Spearman coefficient | Relationship strength (NOT causation) |
| **Heteroscedasticity** | Variance ratio across groups | Subpopulations behave differently |
| **Regime change** | Structural break tests, visual inflection | Something changed — find the cause |

### Business Intelligence Patterns

| Pattern | SQL Approach | What You're Looking For |
|---------|-------------|------------------------|
| **Pareto concentration** | `SUM(revenue) OVER (ORDER BY revenue DESC) / SUM(revenue) OVER ()` | Do 20% of customers drive 80% of revenue? |
| **Cohort decay** | Group by signup month, measure retention at each tenure | Which vintages retain better? Why? |
| **Mix shift** | Revenue by segment over time | Growth from performance or just composition change? |
| **Simpson's paradox** | Same metric aggregated vs by subgroup | Does the trend reverse when you segment? |
| **Cannibalization** | Product A sales before/after Product B launch | Is new product stealing from existing? |
| **Leading indicators** | Cross-correlation at various lags | Does X predict Y? How far in advance? |

### Red Flags in Data

| Red Flag | Likely Issue |
|----------|-------------|
| Round numbers (100, 500, 1000) | Manual entry, estimates, not real measurements |
| Gaps in IDs | Deletions — what got removed and why? |
| Spikes on specific dates | One-time events, system issues, promotions |
| Identical values across rows | Copy-paste, default values, joins gone wrong |
| Future dates in historical data | Data quality issue or timezone problems |
| NULL concentration in certain segments | Systematic missingness — not random |

---

## Phase 4: Validate Before Claiming

### The Skeptic's Checklist

Before you call something a "finding":

- [ ] **Sample size adequate?** — n < 30 per group is suspect
- [ ] **Effect size meaningful?** — 2% difference isn't news, 50% is
- [ ] **Survives segmentation?** — Does pattern hold in ALL subgroups or just some?
- [ ] **Not cherry-picked?** — Did you pick time window to make it look good?
- [ ] **Confounders checked?** — Is there an obvious third variable?
- [ ] **Base rate considered?** — Rare events need different treatment
- [ ] **Data quality verified?** — Outliers legit or entry errors?

### Statistical Rigor

```
EFFECT SIZE > p-VALUE

Cohen's d > 0.8 = large effect (meaningful regardless of significance)
Cohen's d < 0.2 = trivial effect (significant but who cares?)

R² > 0.7 = strong relationship
R² < 0.3 = weak relationship (even if "statistically significant")

Confidence interval width matters more than point estimate
```

### Multiple Comparisons Trap

If you test 20 hypotheses at α=0.05, you'll get ~1 false positive by chance.

**Corrections:**
- Bonferroni: α / number of tests (conservative)
- Benjamini-Hochberg FDR: Controls false discovery rate (less conservative)
- Or just: Be skeptical of marginal significance when you tested many things

---

## Phase 5: Dig Deeper

### The Relentless Mindset

**First finding is rarely the best finding.**

After finding something:
1. **Segment it** — Does it hold for all groups?
2. **Time-bound it** — Is it recent or historical?
3. **Quantify it** — What's the magnitude?
4. **Explain it** — What mechanism could cause this?
5. **Contradict it** — What would prove this wrong?

### Drill-Down SQL Patterns

```sql
-- Compare segments
SELECT segment,
       AVG(metric) as avg_metric,
       COUNT(*) as n,
       STDDEV(metric) as stddev
FROM data
GROUP BY segment
HAVING COUNT(*) > 30  -- minimum sample size

-- Time-series with YoY
SELECT month,
       SUM(revenue) as revenue,
       LAG(SUM(revenue), 12) OVER (ORDER BY month) as revenue_ly,
       (SUM(revenue) - LAG(SUM(revenue), 12) OVER (ORDER BY month)) /
        LAG(SUM(revenue), 12) OVER (ORDER BY month) as yoy_growth
FROM data
GROUP BY month

-- Distribution percentiles
SELECT segment,
       COUNT(*) as n,
       MEDIAN(value) as p50,
       P25(value) as p25,
       P75(value) as p75,
       MIN(value) as min,
       MAX(value) as max
FROM data
GROUP BY segment

-- Concentration analysis
SELECT customer_id,
       revenue,
       SUM(revenue) OVER (ORDER BY revenue DESC) /
       SUM(revenue) OVER () as cumulative_pct,
       ROW_NUMBER() OVER (ORDER BY revenue DESC) as rank
FROM customer_totals
```

---

## Tool Reference

### With Dolex (Preferred)

| Tool | Use Case |
|------|----------|
| `load_csv(name, path)` | Load data, get sourceId + smart summary |
| `describe_data(sourceId)` | Full column profiles — stats, top values, samples |
| `analyze_data(sourceId)` | Auto-generate analysis plan with SQL |
| `query_data(sourceId, sql)` | Run SQL, get resultId for later visualization |
| `visualize(sourceId, sql, intent)` | Chart directly from SQL query |
| `transform_data(sourceId, table, create, expr)` | Add calculated columns |

**Custom SQLite aggregates:** `MEDIAN`, `STDDEV`, `P25`, `P75`, `P10`, `P90`

### Without Dolex

Fall back to pandas, raw SQL, or shell tools. The methodology is the same; only the tools differ.

```python
import pandas as pd
df = pd.read_csv('data.csv')
df.describe(percentiles=[.25, .5, .75, .9])
df.groupby('segment')['revenue'].agg(['mean', 'median', 'std', 'count'])
```

---

## Interestingness Criteria

### Worth Reporting If:

- **Unexpected** — contradicts reasonable assumptions
- **Magnitude matters** — large effect, not just detectable
- **Actionable** — someone could do something with this
- **Novel** — not already known or obvious
- **Survives scrutiny** — holds up under segmentation and time-bounding

### NOT Worth Reporting:

- Obvious patterns (seasonality everyone knows about)
- Tiny effects (2% difference with huge confidence interval)
- Data quality artifacts masquerading as insights
- Cherry-picked time windows
- Correlation without plausible mechanism

---

## Common Paradoxes to Watch For

### Simpson's Paradox
Aggregate trend reverses when you segment. Example: Overall conversion up, but conversion down in EVERY channel. How? Channel mix shifted toward higher-converting channels.

**Detection:** Always compare aggregate to segmented. If they disagree, dig into the mix.

### Survivorship Bias
You only see the winners. Failed products, churned customers, crashed flights — not in your data.

**Detection:** Ask "what's not in this dataset?" and "what selection process created this sample?"

### Regression to the Mean
Extreme values tend to moderate on remeasurement. The "worst" performers will improve even without intervention.

**Detection:** Compare change in extreme groups to change in control/typical groups.

### Ecological Fallacy
Group-level patterns don't apply to individuals. High-income regions may have poor individuals.

**Detection:** Don't impute individual behavior from aggregate data.

---

## Red Flags — STOP and Reconsider

If you catch yourself:

- Reporting the first interesting thing without looking further
- Ignoring outliers as "probably data errors"
- Celebrating p < 0.05 without checking effect size
- Comparing non-comparable groups (different time periods, different segments)
- Explaining correlation as causation without mechanism
- Trusting data quality without checking

**ALL of these mean: SLOW DOWN. Verify before claiming.**

---

## Integration with Other Skills

- **Before article-mode:** Use data-miner to find the story, then article-mode to tell it
- **With visualization:** Let pattern selector choose, but verify the chart shows what you found
- **For debugging:** If a chart looks wrong, trace back to the SQL — is the query right?
