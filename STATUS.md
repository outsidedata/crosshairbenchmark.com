# CROSSHAIR Site Status

## Completed

### Data & Charts
- [x] All data deduplicated (3,628 unique test cases via `ROW_NUMBER() OVER PARTITION BY model, scenario, framing`)
- [x] Statistics corrected: 66.8% comply, 7.3% refuse, 23.6% partial, 2.3% error
- [x] 39 HTML charts regenerated with deduplicated data in `public/charts/`
- [x] 39 PNG screenshots in `public/charts/png/` with correct filenames

### Article Page (`/article`)
- [x] Markdown at `public/CROSSHAIR-ANALYSIS.md` with corrected statistics
- [x] Article.tsx component renders charts as PNG images
- [x] Supports comma-separated multiple chart references
- [x] All chart references use `png/chart-XX-name.png` format

### Deployment
- [x] GitHub Actions workflow at `.github/workflows/deploy.yml`
- [x] 404.html for SPA routing on GitHub Pages
- [x] index.html has SPA redirect handler script
- [x] CNAME file: `crosshairbenchmark.com`
- [x] OG image updated with branded design
- [x] Git remote: `git@github.com:outsidedata/crosshairbenchmark.com.git`

### Cleanup
- [x] Removed Playwright artifacts
- [x] Removed article-output/ working directory
- [x] Removed .agents/, .mcp.json, skills-lock.json
- [x] Updated .gitignore to prevent future pollution

## To Push

```bash
git push -u origin master
# or rename to main first:
git branch -M main && git push -u origin main
```

Then on GitHub:
1. Settings → Pages → Source: **GitHub Actions**
2. Wait for workflow to complete
3. Site live at crosshairbenchmark.com

## File Structure

```
public/
├── benchmark-runs.csv          # Raw data (git-ignored, copied via fill-data.sh)
├── CROSSHAIR-ANALYSIS.md       # Article content
├── CNAME                       # Custom domain
├── 404.html                    # SPA routing
├── og-image.png                # Social sharing image
├── favicon.svg
├── charts/
│   ├── *.html                  # 39 interactive HTML charts
│   └── png/
│       └── *.png               # 39 chart screenshots
└── responses/                  # Individual response JSON files (git-ignored)

src/
├── App.tsx                     # Main app with Explorer + Article views
├── components/
│   ├── Article.tsx             # Markdown renderer with chart embedding
│   ├── MiniPie.tsx             # Result distribution pie charts
│   ├── ResultCard.tsx
│   ├── ResultsLegend.tsx
│   └── FramingBar.tsx
└── main.tsx                    # Router setup
```

## Routes

- `/` - Explorer (matrix view)
- `/article` - Full analysis article
- `/model/:modelId` - Model detail view
- `/scenario/:scenarioId` - Scenario detail view
