export interface NewsEntry {
  id: string;
  title: string;
  source: string;
  date: string;
  link: string;
  category: string;
  query?: string;
  firstSeen?: string;
}

export interface NewsFeed {
  lastUpdated: string;
  categories: string[];
  totalEntries: number;
  entries: NewsEntry[];
}
