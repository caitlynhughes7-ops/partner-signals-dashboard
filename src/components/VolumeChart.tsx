import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { NewsEntry } from '../types';
import { colorFor, countsByCategory, dailyVolume } from '../lib/data';

interface Props {
  entries: NewsEntry[];
  categories: string[];
  days: number;
}

const axisStyle = { fontSize: 11, fill: '#647691' };

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #d5dae3',
  boxShadow: '0 8px 24px -12px rgba(16,24,40,0.25)',
  fontSize: 12,
};

export function VolumeChart({ entries, categories, days }: Props) {
  const perCategory = countsByCategory(entries, categories);
  const perDay = dailyVolume(entries, days).map((point) => ({
    ...point,
    label: new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <h3 className="text-sm font-semibold text-ink-900">Headline volume by partner</h3>
        <p className="mb-4 text-xs text-ink-500">Last {days} days</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perCategory} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis
                dataKey="category"
                tick={axisStyle}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={62}
                tickLine={false}
                axisLine={{ stroke: '#d5dae3' }}
              />
              <YAxis tick={axisStyle} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f6f7f9' }} contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Headlines" radius={[6, 6, 0, 0]}>
                {perCategory.map((item) => (
                  <Cell key={item.category} fill={colorFor(item.category)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card">
        <h3 className="text-sm font-semibold text-ink-900">Daily coverage trend</h3>
        <p className="mb-4 text-xs text-ink-500">All tracked categories, last {days} days</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={perDay} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis
                dataKey="label"
                tick={axisStyle}
                interval="preserveStartEnd"
                minTickGap={24}
                tickLine={false}
                axisLine={{ stroke: '#d5dae3' }}
              />
              <YAxis tick={axisStyle} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                name="Headlines"
                stroke="#3769f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
