import { useEffect, useMemo, useState } from 'react';

import { PartnerSection } from './components/PartnerSection';
import { Timeline } from './components/Timeline';
import { VolumeChart } from './components/VolumeChart';
import { AI_TRENDS_CATEGORY, formatDateTime, withinLastDays } from './lib/data';
import type { NewsEntry, NewsFeed } from './types';

const WINDOW_DAYS = 30;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

export default function App() {
  const [feed, setFeed] = useState<NewsFeed | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/news.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load data (HTTP ${response.status})`);
        if (!response.headers.get('content-type')?.includes('json')) {
          throw new Error('Failed to load data: public/data/news.json is missing.');
        }
        return response.json() as Promise<NewsFeed>;
      })
      .then((data) => {
        if (!cancelled) setFeed(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(
    () =>
      [...(feed?.entries ?? [])].sort(
        (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf(),
      ),
    [feed],
  );

  const partners = useMemo(
    () => (feed?.categories ?? []).filter((category) => category !== AI_TRENDS_CATEGORY),
    [feed],
  );

  const windowEntries = useMemo(
    () => sorted.filter((entry) => withinLastDays(entry, WINDOW_DAYS)),
    [sorted],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, NewsEntry[]>();
    for (const entry of sorted) {
      const bucket = map.get(entry.category);
      if (bucket) bucket.push(entry);
      else map.set(entry.category, [entry]);
    }
    return map;
  }, [sorted]);

  const last24h = sorted.filter((entry) => withinLastDays(entry, 1)).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 via-white to-ink-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-8 flex flex-col gap-4 border-b border-ink-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
              Daily intelligence
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Partner Signals Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-600">
              Morning briefing on partner momentum and the AI ecosystem, refreshed automatically
              every day from Google News.
            </p>
          </div>
          <div className="rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Last updated</p>
            <p className="mt-0.5 font-medium text-ink-900">
              {feed ? formatDateTime(feed.lastUpdated) : '—'}
            </p>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : !feed ? (
          <div className="rounded-2xl border border-ink-200 bg-white p-10 text-center text-sm text-ink-500">
            Loading signals…
          </div>
        ) : (
          <div className="space-y-10">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Headlines tracked" value={String(sorted.length)} hint="All time" />
              <Stat
                label={`Last ${WINDOW_DAYS} days`}
                value={String(windowEntries.length)}
                hint="Across all categories"
              />
              <Stat label="Last 24 hours" value={String(last24h)} hint="Fresh since yesterday" />
              <Stat
                label="Categories"
                value={String(feed.categories.length)}
                hint={`${partners.length} partners + AI trends`}
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-ink-900">Signal volume</h2>
              <VolumeChart
                entries={windowEntries}
                categories={feed.categories}
                days={WINDOW_DAYS}
              />
              <Timeline entries={sorted} />
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-ink-900">Partners</h2>
              <div className="space-y-4">
                {partners.map((partner) => (
                  <PartnerSection
                    key={partner}
                    category={partner}
                    entries={byCategory.get(partner) ?? []}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-ink-900">
                AI Ecosystem Watch
              </h2>
              <PartnerSection
                category={AI_TRENDS_CATEGORY}
                entries={byCategory.get(AI_TRENDS_CATEGORY) ?? []}
                limit={9}
              />
            </section>

            <footer className="border-t border-ink-200 pt-6 text-xs text-ink-500">
              Data collected from Google News RSS · {feed.totalEntries} entries in the feed file
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
