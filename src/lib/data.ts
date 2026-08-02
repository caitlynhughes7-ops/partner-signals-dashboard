import type { NewsEntry } from '../types';

export const AI_TRENDS_CATEGORY = 'AI trends';

export const PARTNER_COLORS: Record<string, string> = {
  AVEVA: '#3769f6',
  Contentsquare: '#7c5cf5',
  dunnhumby: '#0ea5a4',
  'Blue Yonder': '#2563eb',
  Amadeus: '#f97316',
  'Bright Data': '#db2777',
  NielsenIQ: '#16a34a',
  [AI_TRENDS_CATEGORY]: '#647691',
};

export const colorFor = (category: string) => PARTNER_COLORS[category] ?? '#647691';

export const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

export function lastNDays(n: number) {
  const days: Date[] = [];
  const today = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i -= 1) {
    days.push(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
  }
  return days;
}

export function withinLastDays(entry: NewsEntry, days: number) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(entry.date).valueOf() >= cutoff;
}

export function countsByCategory(entries: NewsEntry[], categories: string[]) {
  return categories.map((category) => ({
    category,
    count: entries.filter((entry) => entry.category === category).length,
  }));
}

export function dailyVolume(entries: NewsEntry[], days: number) {
  const buckets = new Map<string, number>();
  for (const day of lastNDays(days)) {
    buckets.set(day.toISOString().slice(0, 10), 0);
  }
  for (const entry of entries) {
    const key = new Date(entry.date).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).valueOf();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}
