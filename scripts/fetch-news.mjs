#!/usr/bin/env node
/**
 * Fetches Google News RSS results for each tracked partner and AI trend query,
 * dedupes against previously seen entries and appends new ones to the data file.
 *
 * Usage: node scripts/fetch-news.mjs
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AI_TRENDS_CATEGORY, PARTNERS, TREND_QUERIES } from './queries.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, '../public/data/news.json');

const MAX_ITEMS_PER_QUERY = 15;
const RETENTION_DAYS = 365;
// Ids of dropped/expired entries are remembered so Google News results that are
// older than the retention window are not re-fetched and re-reported every run.
const MAX_REMEMBERED_IDS = 20000;
const REQUEST_DELAY_MS = 750;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decodeEntities = (value) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .trim();

const tagValue = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeEntities(match[1]) : '';
};

function parseRss(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const rawTitle = tagValue(block, 'title');
    const link = tagValue(block, 'link');
    if (!rawTitle || !link) continue;

    const sourceTag = tagValue(block, 'source');
    // Google News titles are formatted as "Headline - Publisher".
    const separator = rawTitle.lastIndexOf(' - ');
    const title = sourceTag && separator > 0 ? rawTitle.slice(0, separator) : rawTitle;
    const source = sourceTag || (separator > 0 ? rawTitle.slice(separator + 3) : 'Google News');

    const pubDate = tagValue(block, 'pubDate');
    const parsedDate = pubDate ? new Date(pubDate) : null;

    items.push({
      title,
      source,
      date: parsedDate && !Number.isNaN(parsedDate.valueOf())
        ? parsedDate.toISOString()
        : new Date().toISOString(),
      link,
    });
  }
  return items;
}

function entryId(title, link) {
  const normalized = `${title.toLowerCase().replace(/\s+/g, ' ').trim()}|${link.split('?')[0]}`;
  return createHash('sha1').update(normalized).digest('hex').slice(0, 16);
}

async function fetchQuery(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'partner-signals-dashboard/1.0 (+https://github.com)' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for query "${query}"`);
  }
  return parseRss(await response.text()).slice(0, MAX_ITEMS_PER_QUERY);
}

async function readExisting() {
  try {
    const parsed = JSON.parse(await readFile(DATA_FILE, 'utf8'));
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds : [],
    };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Could not read existing data file: ${error.message}`);
    }
    return { entries: [], seenIds: [] };
  }
}

async function main() {
  const { entries: existing, seenIds } = await readExisting();
  const seen = new Set([...seenIds, ...existing.map((entry) => entry.id)]);

  const jobs = [
    ...PARTNERS.flatMap((partner) =>
      partner.queries.map((query) => ({ category: partner.name, query })),
    ),
    ...TREND_QUERIES.map((query) => ({ category: AI_TRENDS_CATEGORY, query })),
  ];

  const added = [];
  const failures = [];

  for (const [index, job] of jobs.entries()) {
    if (index > 0) await sleep(REQUEST_DELAY_MS);
    try {
      const items = await fetchQuery(job.query);
      for (const item of items) {
        const id = entryId(item.title, item.link);
        if (seen.has(id)) continue;
        seen.add(id);
        added.push({
          id,
          title: item.title,
          source: item.source,
          date: item.date,
          link: item.link,
          category: job.category,
          query: job.query,
          firstSeen: new Date().toISOString(),
        });
      }
      console.log(`[${job.category}] "${job.query}" -> ${items.length} results`);
    } catch (error) {
      failures.push({ query: job.query, message: error.message });
      console.warn(`[${job.category}] "${job.query}" failed: ${error.message}`);
    }
  }

  if (failures.length === jobs.length) {
    throw new Error('Every Google News query failed; refusing to write data file.');
  }

  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const withinRetention = (entry) => new Date(entry.date).valueOf() >= cutoff;
  const retained = added.filter(withinRetention);
  const entries = [...existing.filter(withinRetention), ...retained].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  const entryIds = new Set(entries.map((entry) => entry.id));
  const expiredIds = [...seen].filter((id) => !entryIds.has(id));

  const payload = {
    lastUpdated: new Date().toISOString(),
    categories: [...PARTNERS.map((p) => p.name), AI_TRENDS_CATEGORY],
    totalEntries: entries.length,
    seenIds: expiredIds.slice(-MAX_REMEMBERED_IDS),
    entries,
  };

  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(
    `Added ${retained.length} new entries (${added.length - retained.length} skipped as older ` +
      `than ${RETENTION_DAYS} days, ${entries.length} total, ${failures.length} failed queries).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
