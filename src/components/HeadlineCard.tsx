import type { NewsEntry } from '../types';
import { relativeTime } from '../lib/data';

interface Props {
  entry: NewsEntry;
}

export function HeadlineCard({ entry }: Props) {
  return (
    <a
      href={entry.link}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex h-full flex-col justify-between rounded-xl border border-ink-200/70 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-lg"
    >
      <p className="text-sm font-medium leading-snug text-ink-900 group-hover:text-accent-700">
        {entry.title}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
        <span className="truncate font-medium text-ink-600">{entry.source}</span>
        <span aria-hidden className="text-ink-300">
          •
        </span>
        <span className="whitespace-nowrap">{relativeTime(entry.date)}</span>
      </div>
    </a>
  );
}
