import type { NewsEntry } from '../types';
import { colorFor, withinLastDays } from '../lib/data';
import { HeadlineCard } from './HeadlineCard';

interface Props {
  category: string;
  entries: NewsEntry[];
  limit?: number;
}

export function PartnerSection({ category, entries, limit = 6 }: Props) {
  const recent = entries.slice(0, limit);
  const last7 = entries.filter((entry) => withinLastDays(entry, 7)).length;

  return (
    <section className="rounded-2xl border border-ink-200/70 bg-white/70 p-5 shadow-card backdrop-blur">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-8 w-1.5 rounded-full"
            style={{ backgroundColor: colorFor(category) }}
          />
          <h3 className="text-lg font-semibold tracking-tight text-ink-900">{category}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <span className="rounded-full bg-ink-100 px-2.5 py-1 font-medium text-ink-600">
            {entries.length} tracked
          </span>
          <span className="rounded-full bg-accent-50 px-2.5 py-1 font-medium text-accent-700">
            {last7} this week
          </span>
        </div>
      </header>

      {recent.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
          No headlines captured yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {recent.map((entry) => (
            <HeadlineCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
