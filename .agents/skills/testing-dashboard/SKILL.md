---
name: testing-dashboard
description: How to run and end-to-end test the Partner Signals Dashboard (Vite + React + Recharts static dashboard fed by public/data/news.json), including data-state fixtures, responsive checks and the Google News fetch pipeline.
---

# Testing the Partner Signals Dashboard

## Running it

- `npm install` then `npm install --no-save @oxlint/binding-linux-x64-gnu@1.76.0` (npm skips oxlint's optional native binding; `npm run lint` crashes without it).
- Dev: `npm run dev` → http://localhost:5173
- Production parity: `npm run build && npm run preview` → http://localhost:4173. Always check the preview build too; the dev server hides SPA-fallback and asset-path issues.
- The build may warn `Vite requires Node.js version 20.19+` on Node 20.18.x. It still builds today, but if the build starts failing, upgrade Node first.
- Vite is pinned to `^7` on purpose; vite 8 / rolldown's native binding fails to resolve on this box.

## Deriving expected numbers before you look at the UI

The whole UI is computed at runtime from `public/data/news.json`
(`{ lastUpdated, categories, totalEntries, entries[{id,title,source,date,link,category,query,firstSeen}] }`).
Compute the expected header timestamp, stat-row counts (all-time / 30d / 24h / categories), per-category 30-day
counts and the daily series with a small `node -e` script over that file *first*, then assert the UI matches.
Beware: this environment's clock may be set to a simulated future date, so "last 30 days" is relative to
`Date.now()` on the box, not to real-world time.

## Adversarial data states

Swap `public/data/news.json` temporarily and hard-reload (`ctrl+shift+r`), then always restore with
`git checkout -- public/data/news.json`:

1. Missing file — `mv` it away. Expect a graceful error banner, not a blank page. Note the dev/preview server
   serves the SPA `index.html` fallback, so the app sees valid HTTP 200 HTML and reports a JSON parse error
   rather than "HTTP 404"; don't treat that wording as a bug in dev.
2. Zero entries — keep `categories`, set `entries: []`, `totalEntries: 0`. Expect 0/0/0/N stats and
   "No headlines captured yet." placeholders.
3. All entries older than 30 days — shift every `date`/`firstSeen` back ~200 days. Expect all-time unchanged,
   30d/24h zero, charts flat, no crash.

## Responsive checks

The desktop window manager enforces a ~500 CSS px minimum window width, so `wmctrl -r :ACTIVE: -e 0,0,0,375,...`
cannot reach a 375 px viewport. Use Chrome's responsive viewport instead: `F12`, then `ctrl+shift+m`, then type
the width into the Dimensions field. (`ctrl+shift+m` without DevTools open just opens the profile menu.)
Assert `document.documentElement.scrollWidth === clientWidth` at each width to catch overflow.

## Known automation caveat: `target="_blank"`

Links that should open in a new tab cannot be verified with the browser automation harness: it strips the
`target` attribute from anchors it instruments, so clicks navigate in the current tab even though the app
renders `target="_blank"`. To distinguish an app bug from the harness, read `getAttribute('target')` on a
matching anchor immediately after page load (before instrumentation) and on a freshly created anchor. Report
new-tab behavior as needing manual confirmation rather than as a failure.

## Pipeline (`scripts/fetch-news.mjs`)

- It fetches Google News RSS, dedupes on a sha1 of title+link, then applies a `RETENTION_DAYS` (365) cutoff.
- The `Added N new entries` log counts items *before* the retention filter. If the box clock is ahead of
  real-world article dates, every fetched item is counted then dropped, so the log says "Added N" while the
  file only changes its `lastUpdated`. Don't read that counter as proof of anything.
- To prove dedupe deterministically, copy `scripts/` to a scratch dir (the data file path is resolved relative
  to the script), raise `RETENTION_DAYS`, trim the query list for speed, and run twice: run 2 should report
  "Added 0" with identical ids.
- Each full run takes ~2 minutes (750 ms delay per query, ~28 queries). Restore with
  `git checkout -- public/data/news.json` and confirm `git status --porcelain` is empty.

## Devin Secrets Needed

None — the dashboard is static and the pipeline uses unauthenticated Google News RSS.
