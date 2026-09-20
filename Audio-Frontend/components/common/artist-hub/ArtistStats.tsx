'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { usePrivy } from '@privy-io/react-auth';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SongStat {
  id: string;
  title: string;
  genre: string;
  status: string;
  plays: number;
  createdAt: string;
}

interface TrendPoint {
  date: string;
  streams: number;
}

interface CountryStat {
  country: string;
  streams: number;
}

interface StatsResponse {
  totalSongs: number;
  totalStreams: number;
  songs: SongStat[];
  range: RangeKey;
  rangeStreams: number;
  trend: TrendPoint[];
  topCountries: CountryStat[];
}

type RangeKey = '7d' | '28d' | '12m';

const RANGE_LABELS: Record<RangeKey, string> = {
  '7d': '7 days',
  '28d': '28 days',
  '12m': '12 months',
};

const truncate = (label: string, max = 14) =>
  label.length > max ? `${label.slice(0, max)}…` : label;

const formatTrendDate = (iso: string, range: RangeKey) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return range === '12m'
    ? d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const ArtistStats = () => {
  const { getAccessToken } = usePrivy();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('28d');

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const accessToken = await getAccessToken();
        const res = await axios.get(`${url}/api/song/stats/mine`, {
          params: { range },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!cancelled) setStats(res.data?.data ?? null);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  if (loading && !stats) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 text-white">
        <div className="h-64 rounded-lg bg-[#1A1A1A] animate-pulse" />
      </section>
    );
  }

  if (!stats || stats.totalSongs === 0) {
    return null;
  }

  const readySongs = stats.songs.filter((s) => s.status === 'ready');
  const mostPlayed = stats.songs[0];
  const perSongData = readySongs
    .slice()
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 8)
    .map((s) => ({ name: truncate(s.title), plays: s.plays, fullTitle: s.title }));

  const trendData = stats.trend.map((t) => ({
    label: formatTrendDate(t.date, stats.range),
    streams: t.streams,
    fullDate: t.date,
  }));

  const topCountry = stats.topCountries[0];
  const maxCountryStreams = topCountry?.streams || 1;

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 text-white">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-1">
        <div>
          <h1 className="font-['Poppins'] font-semibold text-[28px] mb-1">Your Stats</h1>
          <p className="text-[#A3A3A3]">
            A quick look at how your catalogue is performing. More metrics coming soon.
          </p>
        </div>

        <div className="flex gap-1 bg-[#1A1A1A] rounded-full p-1">
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                range === key ? 'bg-pink-600 text-white' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              {RANGE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 mt-8">
        <div className="bg-[#1A1A1A] rounded-xl p-5">
          <p className="text-[#A3A3A3] text-xs mb-1">Streams · Last {RANGE_LABELS[stats.range]}</p>
          <p className="text-3xl font-semibold">{stats.rangeStreams.toLocaleString()}</p>
        </div>
        <div className="bg-[#1A1A1A] rounded-xl p-5">
          <p className="text-[#A3A3A3] text-xs mb-1">Total Streams</p>
          <p className="text-3xl font-semibold">{stats.totalStreams.toLocaleString()}</p>
        </div>
        <div className="bg-[#1A1A1A] rounded-xl p-5">
          <p className="text-[#A3A3A3] text-xs mb-1">Songs</p>
          <p className="text-3xl font-semibold">{stats.totalSongs}</p>
        </div>
        <div className="bg-[#1A1A1A] rounded-xl p-5 col-span-2 sm:col-span-1">
          <p className="text-[#A3A3A3] text-xs mb-1">Most Played</p>
          <p className="text-lg font-semibold truncate">{mostPlayed?.title ?? '—'}</p>
          <p className="text-[#A3A3A3] text-xs mt-1">
            {mostPlayed?.plays.toLocaleString() ?? 0} streams
          </p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl p-5 mb-8">
        <p className="text-sm font-medium mb-4">Streams over time</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trendData} margin={{ left: -20 }}>
            <defs>
              <linearGradient id="streamsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B6195B" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#B6195B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#A3A3A3', fontSize: 11 }}
              axisLine={{ stroke: '#2A2A2A' }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#A3A3A3', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#242424',
                border: '1px solid #2A2A2A',
                borderRadius: 8,
                color: '#fff',
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
            />
            <Area
              type="monotone"
              dataKey="streams"
              stroke="#B6195B"
              strokeWidth={2}
              fill="url(#streamsFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {perSongData.length > 0 && (
          <div className="bg-[#1A1A1A] rounded-xl p-5">
            <p className="text-sm font-medium mb-4">Streams per song · All time</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perSongData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#A3A3A3', fontSize: 11 }}
                  axisLine={{ stroke: '#2A2A2A' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#A3A3A3', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    background: '#242424',
                    border: '1px solid #2A2A2A',
                    borderRadius: 8,
                    color: '#fff',
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle ?? ''}
                />
                <Bar dataKey="plays" fill="#B6195B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-[#1A1A1A] rounded-xl p-5">
          <p className="text-sm font-medium mb-4">
            Top countries · Last {RANGE_LABELS[stats.range]}
          </p>
          {stats.topCountries.length === 0 ? (
            <p className="text-[#4B4B4B] text-sm">No location data yet for this period.</p>
          ) : (
            <div className="space-y-3">
              {stats.topCountries.map((c) => (
                <div key={c.country}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{c.country}</span>
                    <span className="text-[#A3A3A3]">{c.streams.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#B6195B]"
                      style={{ width: `${Math.max((c.streams / maxCountryStreams) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.songs.some((s) => s.status !== 'ready') && (
        <p className="text-[#4B4B4B] text-xs mb-8">
          Songs still processing aren&apos;t counted in the charts above yet.
        </p>
      )}
    </section>
  );
};

export default ArtistStats;
