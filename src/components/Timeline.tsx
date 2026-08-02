import type { NewsEntry } from '../types';
import { colorFor, formatDate } from '../lib/data';

interface Props {
  entries: NewsEntry[];
  limit?: number;
}

export function Timeline({ entries, limit = 10 }: Props) {
  const items = entries.slice(0, limit);

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-ink-900">Recent major events</h3>
      <p className="mb-4 text-xs text-ink-500">Newest headlines across every tracked category</p>

      {items.length === 0 ? (
        <p className="text-sm text-ink-500">Nothing captured yet.</p>
      ) : (
        <ol className="relative space-y-5 border-l border-ink-200 pl-5">
          {items.map((entry) => (
            <li key={entry.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white"
                style={{ backgroundColor: colorFor(entry.category) }}
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                <span
                  className="rounded-full px-2 py-0.5 font-medium"
                  style={{
                    backgroundColor: `${colorFor(entry.category)}14`,
                    color: colorFor(entry.category),
                  }}
                >
                  {entry.category}
                </span>
                <span>{formatDate(entry.date)}</span>
              </div>
              <a
                href={entry.link}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 block text-sm font-medium leading-snug text-ink-900 hover:text-accent-700"
              >
                {entry.title}
              </a>
              <p className="text-xs text-ink-500">{entry.source}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
