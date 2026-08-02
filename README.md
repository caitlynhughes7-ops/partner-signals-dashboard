# Partner Signals Dashboard

A personal daily intelligence dashboard: a scheduled pipeline pulls Google News RSS headlines for a
set of tracked partners plus AI/manufacturing/retail trend queries, and a static React dashboard
renders them as a morning briefing.

## Architecture

```
scripts/queries.mjs        tracked partners + trend search queries
scripts/fetch-news.mjs     Google News RSS fetch -> parse -> dedupe -> append
public/data/news.json      committed data file (served as a static asset)
src/                       React + Tailwind + Recharts dashboard (Vite)
.github/workflows/         daily cron that runs the pipeline and commits the data file
vercel.json                static deployment config
```

The pipeline has no runtime dependencies (Node 20 `fetch` + a small RSS parser). Entries are keyed
by a SHA-1 of the normalised title + link, so re-running only appends genuinely new headlines.
Entries older than 365 days are dropped.

Data file shape:

```jsonc
{
  "lastUpdated": "2026-08-02T19:00:00.000Z",
  "categories": ["AVEVA", "...", "AI trends"],
  "totalEntries": 278,
  "entries": [
    {
      "id": "…",
      "title": "…",
      "source": "…",
      "date": "2026-08-01T12:00:00.000Z",
      "link": "https://…",
      "category": "AVEVA",
      "query": "AVEVA Snowflake",
      "firstSeen": "2026-08-02T19:00:00.000Z"
    }
  ]
}
```

## Local development

```bash
npm install
npm run update-data   # refresh public/data/news.json from Google News
npm run dev           # http://localhost:5173
npm run build         # type-check + production build to dist/
npm run lint
```

## Scheduled updates

`.github/workflows/update-news.yml` runs daily at 06:00 UTC (and on demand via
**Actions → Update news data → Run workflow**). It executes the pipeline and commits
`public/data/news.json` back to the default branch, which in turn triggers a Vercel redeploy.

## Deployment

Vercel, framework preset `vite`, build `npm run build`, output `dist/`. Pushes to `main`
(including the bot's daily data commit) auto-deploy.
