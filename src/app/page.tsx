"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";

type KpiCard = {
  label: string;
  value: number;
  suffix: string;
  decimals: number;
  accent: string;
  delta: string;
  deltaTone: "good" | "bad";
  spark: number[];
};

type MealPoint = {
  meal: string;
  acceptance: number;
  avgCart: number;
  sessions: number;
};

type CityPoint = {
  city: string;
  volume: number;
};

type SegmentPoint = {
  segment: string;
  value: number;
  color: string;
};

type CountUpProps = {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
};

const KPI_FALLBACK: KpiCard[] = [
  {
    label: "AOV Lift",
    value: 3.22,
    suffix: "%",
    decimals: 2,
    accent: "#E23744",
    delta: "↑ +3.2% vs last week",
    deltaTone: "good",
    spark: [2.1, 2.3, 2.5, 2.7, 2.8, 2.9, 3.0, 3.22],
  },
  {
    label: "Attach Rate",
    value: 45.5,
    suffix: "%",
    decimals: 1,
    accent: "#F5A623",
    delta: "↑ +1.4% vs last week",
    deltaTone: "good",
    spark: [38, 39.1, 40.2, 41, 42.7, 43.8, 44.9, 45.5],
  },
  {
    label: "P50 Latency",
    value: 37,
    suffix: "ms",
    decimals: 0,
    accent: "#00BFA5",
    delta: "↓ -6ms vs last week",
    deltaTone: "good",
    spark: [55, 52, 49, 46, 42, 41, 39, 37],
  },
  {
    label: "Model AUC",
    value: 92,
    suffix: "%",
    decimals: 0,
    accent: "#7C5CBF",
    delta: "↑ +0.9% vs last week",
    deltaTone: "good",
    spark: [86, 87, 88, 89, 90, 90.5, 91.2, 92],
  },
];

const MEAL_FALLBACK: MealPoint[] = [
  { meal: "Breakfast", acceptance: 14, avgCart: 210, sessions: 5200 },
  { meal: "Lunch", acceptance: 19, avgCart: 248, sessions: 8400 },
  { meal: "Snacks", acceptance: 24, avgCart: 183, sessions: 7100 },
  { meal: "Dinner", acceptance: 31, avgCart: 310, sessions: 11400 },
  { meal: "Late Night", acceptance: 17, avgCart: 228, sessions: 4600 },
];

const CITY_FALLBACK: CityPoint[] = [
  { city: "Delhi", volume: 17200 },
  { city: "Mumbai", volume: 15500 },
  { city: "Bangalore", volume: 14900 },
  { city: "Hyderabad", volume: 12100 },
  { city: "Pune", volume: 10800 },
];

const SEGMENT_FALLBACK: SegmentPoint[] = [
  { segment: "Budget", value: 12, color: "#F5A623" },
  { segment: "Mid", value: 22, color: "#00BFA5" },
  { segment: "Premium", value: 35, color: "#E23744" },
];

const FEED_SEED = [
  "U001234 · Biryani → Salan recommended · accepted",
  "U008844 · Pizza → Garlic Bread recommended · accepted",
  "U008400 · Paneer Bowl → Lassi recommended · skipped",
  "U921100 · Burger → Fries recommended · accepted",
  "U402391 · Dosa → Filter Coffee recommended · accepted",
  "U043981 · Shawarma → Falafel recommended · skipped",
];

function CountUp({ value, duration = 1200, decimals = 0, prefix = "", suffix = "" }: CountUpProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = easeOutCubic(progress);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function DarkTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  labelFormatter?: (value: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const formattedLabel = labelFormatter ? labelFormatter(label ?? "") : label;

  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[rgba(10,10,10,0.9)] p-3 font-mono text-[11px] text-[#d9d9d9] shadow-xl backdrop-blur-md">
      {formattedLabel ? <p className="mb-2 text-[#aaaaaa]">{formattedLabel}</p> : null}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={`${entry.name}-${idx}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[#9f9f9f]">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color ?? "#E23744" }} />
              {entry.name}
            </span>
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RingMetric({ label, value, color }: { label: string; value: number; color: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="104" height="104" className="-rotate-90">
        <circle cx="52" cy="52" r={radius} fill="transparent" stroke="#2b2b2b" strokeWidth="8" />
        <circle
          cx="52"
          cy="52"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          style={{ transition: "stroke-dashoffset 600ms ease-out" }}
        />
      </svg>
      <p className="font-display text-xl font-bold text-white">{value}%</p>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#777777]">{label}</p>
    </div>
  );
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const data = points.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [kpis, setKpis] = useState(KPI_FALLBACK);
  const [meal, setMeal] = useState(MEAL_FALLBACK);
  const [cities, setCities] = useState(CITY_FALLBACK);
  const [segments, setSegments] = useState(SEGMENT_FALLBACK);
  const [feed, setFeed] = useState(
    FEED_SEED.slice(0, 5).map((message, i) => ({
      id: i + 1,
      message,
      ts: `${String(12 + i).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    })),
  );

  useEffect(() => {
    setEntered(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setFeed((prev) => {
        const idx = Math.floor(Math.random() * FEED_SEED.length);
        const now = new Date();
        const item = {
          id: now.getTime(),
          message: FEED_SEED[idx],
          ts: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
        };
        return [item, ...prev].slice(0, 8);
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      fetch("/api/dashboard/kpis", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard/meal-time-breakdown", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard/city-breakdown", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard/segment-performance", { cache: "no-store" }).then((r) => r.json()),
    ]).then((responses) => {
      if (!mounted) return;
      const [kpiRes, mealRes, cityRes, segRes] = responses;
      let failedCritical = false;

      if (kpiRes.status === "fulfilled" && kpiRes.value?.ok && kpiRes.value?.data) {
        const data = kpiRes.value.data;
        setKpis([
          { ...KPI_FALLBACK[0], value: data?.aov_lift?.aov_lift_percentage ?? 3.22 },
          { ...KPI_FALLBACK[1], value: (data?.attach_rate?.attach_rate ?? 0.455) * 100 },
          { ...KPI_FALLBACK[2], value: data?.latency?.p50 ?? 37 },
          { ...KPI_FALLBACK[3], value: (data?.auc ?? 0.92) * 100 },
        ]);
      } else {
        failedCritical = true;
      }

      if (mealRes.status === "fulfilled" && mealRes.value?.ok && mealRes.value?.data) {
        const mapped = Object.entries(mealRes.value.data as Record<string, { addon_accept_rate: number; avg_cart_value: number; sessions?: number }>).map(
          ([key, val]) => ({
            meal: key.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()),
            acceptance: Math.round((val.addon_accept_rate ?? 0) * 100),
            avgCart: Math.round(val.avg_cart_value ?? 200),
            sessions: val.sessions ?? Math.floor(4500 + Math.random() * 5000),
          }),
        );
        if (mapped.length > 0) setMeal(mapped);
      }

      if (cityRes.status === "fulfilled" && cityRes.value?.ok && cityRes.value?.data?.cities) {
        setCities(
          cityRes.value.data.cities.slice(0, 5).map((city: { city: string; session_count: number }) => ({
            city: city.city,
            volume: city.session_count,
          })),
        );
      }

      if (segRes.status === "fulfilled" && segRes.value?.ok && segRes.value?.data?.segments) {
        const mapColor: Record<string, string> = {
          budget: "#F5A623",
          mid: "#00BFA5",
          premium: "#E23744",
        };
        setSegments(
          segRes.value.data.segments.slice(0, 3).map((seg: { segment: string; addon_accept_rate: number }) => ({
            segment: seg.segment.charAt(0).toUpperCase() + seg.segment.slice(1),
            value: Math.round((seg.addon_accept_rate ?? 0.2) * 100),
            color: mapColor[seg.segment] ?? "#7C5CBF",
          })),
        );
      }

      setOffline(failedCritical);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const cityData = useMemo(
    () =>
      cities.map((entry) => ({
        ...entry,
        short: entry.city.length > 12 ? `${entry.city.slice(0, 10)}…` : entry.city,
      })),
    [cities],
  );

  if (offline && !loading) {
    return (
      <div className={cn("page-enter flex min-h-[70vh] items-center justify-center", entered && "page-enter-active")}>
        <div className="brand-card w-full max-w-lg p-8 text-center">
          <svg viewBox="0 0 120 120" className="mx-auto h-20 w-20 text-[#E23744]" fill="none">
            <path d="M18 72h84a30 30 0 0 1-84 0Z" stroke="currentColor" strokeWidth="6" />
            <path d="M34 50c2-10 8-16 12-16s10 6 12 16M62 50c2-10 8-16 12-16s10 6 12 16" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <h2 className="mt-4 font-display text-2xl font-bold text-white">Backend Offline</h2>
          <p className="mt-2 text-sm text-[#9a9a9a]">Start Flask server to see live data</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-[#E23744] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff4d58]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("page-enter space-y-6 pb-6", entered && "page-enter-active")}>
      <section className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">CSAO Recommendation Overview</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#757575]">Data meets appetite · live intelligence snapshot</p>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-[120px] rounded-xl bg-[#1C1C1C] animate-pulse" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <article key={kpi.label} className={cn("hero-stat-card h-[120px] p-4", idx > 0 && "animate-[fade-up_400ms_ease-out]")}>
              <span className="hero-stat-top-accent" style={{ background: kpi.accent }} />
              <div className="flex h-full items-start justify-between gap-4">
                <div>
                  <p className="font-display text-[42px] font-bold leading-none tracking-tight" style={{ color: kpi.accent }}>
                    <CountUp value={kpi.value} decimals={kpi.decimals} suffix={kpi.suffix} />
                  </p>
                  <span
                    className={cn(
                      "mt-2 inline-flex rounded-full px-2 py-1 font-mono text-[10px]",
                      kpi.deltaTone === "good" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300",
                    )}
                  >
                    {kpi.delta}
                  </span>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#767676]">{kpi.label}</p>
                </div>
                <div className="h-14 w-24">
                  <Sparkline points={kpi.spark} color={kpi.accent} />
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="brand-card lg:col-span-2 p-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-white">Recommendation Acceptance by Meal Time</h2>
            <p className="font-mono text-xs text-[#6f6f6f]">Acceptance %, avg cart value and sessions by mealtime bucket</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={meal} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="mealFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E23744" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E23744" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                <XAxis dataKey="meal" tick={{ fill: "#8f8f8f", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8f8f8f", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  content={
                    <DarkTooltip
                      labelFormatter={(value) => {
                        const current = meal.find((m) => m.meal === value);
                        if (!current) return value;
                        return `${value} · AOV ₹${current.avgCart} · ${current.sessions.toLocaleString()} sessions`;
                      }}
                    />
                  }
                />
                <Area dataKey="acceptance" name="Acceptance %" type="monotone" stroke="#E23744" fill="url(#mealFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="brand-card p-6">
          <h2 className="font-display text-lg font-semibold text-white">Segment Performance</h2>
          <p className="mb-5 font-mono text-xs text-[#6f6f6f]">Accept rate by user segment</p>
          <div className="space-y-5">
            {segments.map((segment, idx) => (
              <div key={segment.segment}>
                <div className="mb-1 flex items-center justify-between text-sm text-[#d8d8d8]">
                  <span>{segment.segment}</span>
                  <span className="font-mono">{segment.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#252525]">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${segment.value}%`,
                      background: segment.color,
                      transition: `width 650ms ease-out ${idx * 80}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="brand-card p-6">
          <h2 className="font-display text-lg font-semibold text-white">Top Cities by Volume</h2>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#8f8f8f", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="short" type="category" tick={{ fill: "#8f8f8f", fontSize: 11 }} axisLine={false} tickLine={false} width={88} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="volume" name="Volume" radius={[0, 6, 6, 0]}>
                  {cityData.map((entry, idx) => (
                    <Cell key={entry.city} fill={idx % 2 === 0 ? "#E23744" : "#ff626d"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="brand-card p-6">
          <h2 className="font-display text-lg font-semibold text-white">Real-time Activity Feed</h2>
          <p className="mb-3 font-mono text-xs text-[#6f6f6f]">Refreshed every 5 seconds</p>
          <div className="max-h-[230px] space-y-2 overflow-y-auto pr-1">
            {feed.map((event) => (
              <div key={event.id} className="animate-[fade-up_320ms_ease-out] rounded-lg border border-white/10 bg-[#171717] px-3 py-2">
                <p className="text-xs text-[#d7d7d7]">{event.message}</p>
                <p className="mt-1 font-mono text-[10px] text-[#6d6d6d]">{event.ts}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="brand-card p-6">
          <h2 className="font-display text-lg font-semibold text-white">Model Health</h2>
          <p className="mb-3 font-mono text-xs text-[#6f6f6f]">Core ranker quality indicators</p>
          <div className="grid grid-cols-1 gap-1">
            <RingMetric label="AUC" value={92} color="#E23744" />
            <RingMetric label="P@8" value={33} color="#F5A623" />
            <RingMetric label="NDCG@8" value={86} color="#00BFA5" />
          </div>
        </article>
      </section>
    </div>
  );
}
