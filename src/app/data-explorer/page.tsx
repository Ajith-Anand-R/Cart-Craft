"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, Radar, RadarChart, ResponsiveContainer, Tooltip, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

import { cn } from "@/lib/utils";

type SegmentCard = {
  name: string;
  users: number;
  acceptance: number;
  aov: number;
  color: string;
};

type CityRow = {
  city: string;
  volume: number;
  acceptance: number;
  aov: number;
};

const SEGMENT_FALLBACK: SegmentCard[] = [
  { name: "Budget", users: 18400, acceptance: 12, aov: 228, color: "#F5A623" },
  { name: "Mid", users: 21900, acceptance: 22, aov: 302, color: "#00BFA5" },
  { name: "Premium", users: 9700, acceptance: 35, aov: 468, color: "#E23744" },
];

const CITY_FALLBACK: CityRow[] = [
  { city: "Delhi", volume: 17200, acceptance: 26, aov: 364 },
  { city: "Mumbai", volume: 15500, acceptance: 24, aov: 352 },
  { city: "Bangalore", volume: 14900, acceptance: 22, aov: 338 },
  { city: "Hyderabad", volume: 12100, acceptance: 21, aov: 301 },
  { city: "Pune", volume: 10800, acceptance: 20, aov: 288 },
];

const MEAL_RADAR = [
  { slot: "Breakfast", acceptance_rate: 14, avg_items: 28, avg_aov: 35 },
  { slot: "Lunch", acceptance_rate: 19, avg_items: 44, avg_aov: 52 },
  { slot: "Snacks", acceptance_rate: 24, avg_items: 38, avg_aov: 33 },
  { slot: "Dinner", acceptance_rate: 31, avg_items: 56, avg_aov: 68 },
  { slot: "Late Night", acceptance_rate: 17, avg_items: 24, avg_aov: 41 },
];

type CountUpProps = {
  value: number;
  suffix?: string;
  duration?: number;
};

function CountUp({ value, suffix = "", duration = 1200 }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      setDisplay(value * easeOutCubic(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return (
    <span>
      {Math.round(display).toLocaleString()}
      {suffix}
    </span>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[rgba(10,10,10,0.9)] p-3 font-mono text-[11px] text-[#d9d9d9] shadow-xl backdrop-blur-md">
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[#9f9f9f]">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color ?? "#E23744" }} />
            {entry.name}
          </span>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DataExplorerPage() {
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [segments, setSegments] = useState(SEGMENT_FALLBACK);
  const [cities, setCities] = useState(CITY_FALLBACK);

  useEffect(() => {
    setEntered(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      fetch("/api/dashboard/segment-performance", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard/city-breakdown", { cache: "no-store" }).then((r) => r.json()),
    ]).then((responses) => {
      if (!mounted) return;
      let failed = 0;
      const [segRes, cityRes] = responses;

      const segPayload =
        segRes.status === "fulfilled" && segRes.value?.ok
          ? segRes.value?.data?.segments ?? segRes.value?.data
          : null;

      if (segPayload) {
        const colorMap: Record<string, string> = { budget: "#F5A623", mid: "#00BFA5", premium: "#E23744" };
        const segmentRows = Array.isArray(segPayload)
          ? segPayload
          : Object.entries(segPayload).map(([segment, stats]) => ({
              segment,
              ...(stats as Record<string, number>),
            }));
        setSegments(
          segmentRows.map((segment: { segment: string; session_count: number; addon_accept_rate: number; avg_cart_value?: number }) => ({
            name: `${segment.segment[0].toUpperCase()}${segment.segment.slice(1)}`,
            users: segment.session_count,
            acceptance: Math.round((segment.addon_accept_rate ?? 0.2) * 100),
            aov: Math.round(segment.avg_cart_value ?? (segment.segment === "premium" ? 468 : segment.segment === "mid" ? 302 : 228)),
            color: colorMap[segment.segment] ?? "#7C5CBF",
          })),
        );
      } else {
        failed += 1;
      }

      const cityPayload =
        cityRes.status === "fulfilled" && cityRes.value?.ok
          ? cityRes.value?.data?.cities ?? cityRes.value?.data
          : null;

      if (cityPayload) {
        const cityRows = Array.isArray(cityPayload)
          ? cityPayload
          : Object.entries(cityPayload).map(([city, stats]) => ({
              city,
              ...(stats as Record<string, number>),
            }));
        setCities(
          cityRows.slice(0, 5).map((city: { city: string; session_count: number; addon_accept_rate?: number; avg_cart_value?: number }) => ({
            city: city.city,
            volume: city.session_count,
            acceptance: Math.round((city.addon_accept_rate ?? 0.22) * 100),
            aov: Math.round(city.avg_cart_value ?? 320),
          })),
        );
      } else {
        failed += 1;
      }

      setOffline(failed === 2);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

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
      <section className="brand-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Data Overview</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#707070]">Editorial analytics spread · population and behavior signals</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Users", value: 50000 },
            { label: "Menu Items", value: 138143 },
            { label: "Sessions", value: 50000 },
            { label: "Interactions", value: 140876 },
          ].map((stat) => (
            <div key={stat.label} className="px-3 md:border-l md:border-[#2A2A2A] md:first:border-l-0">
              <p className="font-display text-xl font-bold bg-gradient-to-r from-[#E23744] to-[#F5A623] bg-clip-text text-transparent">
                <CountUp value={stat.value} />
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#777777]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-44 rounded-xl bg-[#1C1C1C] animate-pulse" />
          ))}
        </div>
      ) : (
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold text-white">User Segments</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {segments.map((segment) => (
              <article key={segment.name} className="brand-card p-4" style={{ borderLeft: `4px solid ${segment.color}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{segment.name}</h3>
                    <p className="font-mono text-xs text-[#777777]">{segment.users.toLocaleString()} users</p>
                    <p className="mt-1 text-sm text-[#d8d8d8]">Acceptance {segment.acceptance}%</p>
                    <p className="text-sm text-[#d8d8d8]">Avg cart ₹{segment.aov}</p>
                  </div>
                  <div className="h-20 w-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{ name: "accept", value: segment.acceptance }, { name: "rest", value: 100 - segment.acceptance }]} innerRadius={22} outerRadius={35} dataKey="value" stroke="none">
                          <Cell fill={segment.color} />
                          <Cell fill="#2A2A2A" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="brand-card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-white">City Performance</h2>
        </div>
        <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr] border-b border-white/10 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#767676]">
          <span>City</span>
          <span className="flex items-center gap-1">
            Order Vol
            <ArrowDown className="h-3 w-3 text-[#E23744]" />
          </span>
          <span className="flex items-center gap-1">
            Acceptance
            <ArrowUp className="h-3 w-3 text-[#E23744]" />
          </span>
          <span>AOV</span>
        </div>
        {cities.map((row, idx) => (
          <div
            key={row.city}
            className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr] items-center gap-2 px-5 py-3 text-sm"
            style={{ background: idx % 2 === 0 ? "#1C1C1C" : "#161616" }}
          >
            <div className="flex items-center gap-2">
              <span>🇮🇳</span>
              <span className="text-[#f0f0f0]">{row.city}</span>
            </div>
            <div>
              <div className="h-2 rounded-full bg-[#252525]">
                <div className="h-2 rounded-full bg-gradient-to-r from-[#E23744] to-[#ff6a76]" style={{ width: `${Math.min(100, row.volume / 220)}%` }} />
              </div>
              <span className="mt-1 inline-block font-mono text-[10px] text-[#7f7f7f]">{row.volume.toLocaleString()}</span>
            </div>
            <span className="font-mono text-[#d6d6d6]">{row.acceptance}%</span>
            <span
              className="w-fit rounded-full px-2 py-1 font-mono text-[11px]"
              style={{
                background: row.aov >= 340 ? "rgba(34,197,94,0.2)" : row.aov >= 300 ? "rgba(245,166,35,0.2)" : "rgba(100,100,100,0.25)",
                color: row.aov >= 340 ? "#8ff0b1" : row.aov >= 300 ? "#f5d08b" : "#b7b7b7",
              }}
            >
              ₹{row.aov}
            </span>
          </div>
        ))}
      </section>

      <section className="brand-card p-5">
        <h2 className="font-display text-xl font-semibold text-white">Meal Time Analysis</h2>
        <p className="mb-3 font-mono text-xs text-[#717171]">acceptance_rate · avg_items · avg_aov</p>
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius={120} data={MEAL_RADAR}>
              <PolarGrid stroke="#1F1F1F" />
              <PolarAngleAxis dataKey="slot" tick={{ fill: "#8b8b8b", fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: "#6d6d6d", fontSize: 10 }} />
              <Radar dataKey="acceptance_rate" stroke="#E23744" fill="#E23744" fillOpacity={0.2} />
              <Radar dataKey="avg_items" stroke="#F5A623" fill="#F5A623" fillOpacity={0.2} />
              <Radar dataKey="avg_aov" stroke="#00BFA5" fill="#00BFA5" fillOpacity={0.2} />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-2 text-[#bcbcbc]">
            <span className="h-2 w-2 rounded-sm bg-[#E23744]" />
            acceptance_rate
          </span>
          <span className="flex items-center gap-2 text-[#bcbcbc]">
            <span className="h-2 w-2 rounded-sm bg-[#F5A623]" />
            avg_items
          </span>
          <span className="flex items-center gap-2 text-[#bcbcbc]">
            <span className="h-2 w-2 rounded-sm bg-[#00BFA5]" />
            avg_aov
          </span>
        </div>
      </section>
    </div>
  );
}
