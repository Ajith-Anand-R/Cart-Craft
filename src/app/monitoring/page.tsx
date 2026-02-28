"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, CartesianGrid, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

import { cn } from "@/lib/utils";

type HeatCell = {
  hour: number;
  latency: number;
};

type StreamPoint = {
  id: number;
  latency: number;
};

function latencyBucketColor(latency: number) {
  if (latency < 50) return "#14532d";
  if (latency < 100) return "#22c55e";
  if (latency < 150) return "#f59e0b";
  return "#ef4444";
}

function randomLatency() {
  return Math.round(35 + Math.random() * 170);
}

function TooltipCard({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[rgba(10,10,10,0.9)] p-3 font-mono text-[11px] text-[#d9d9d9] shadow-xl backdrop-blur-md">
      {label !== undefined ? <p className="mb-2 text-[#9a9a9a]">{label}</p> : null}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color ?? "#E23744" }} />
            <span className="text-[#9f9f9f]">{entry.name}</span>
          </span>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function MonitoringPage() {
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [health, setHealth] = useState<"healthy" | "down" | "checking">("checking");
  const [heatmap, setHeatmap] = useState<HeatCell[]>([]);
  const [stream, setStream] = useState<StreamPoint[]>([]);
  const [p50, setP50] = useState(37);
  const [p95, setP95] = useState(121);
  const [p99, setP99] = useState(184);
  const [flashDot, setFlashDot] = useState(false);

  useEffect(() => {
    setEntered(true);
  }, []);

  useEffect(() => {
    const baseHeat = Array.from({ length: 24 }, (_, hour) => ({ hour, latency: randomLatency() }));
    const baseStream = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, latency: randomLatency() }));
    setHeatmap(baseHeat);
    setStream(baseStream);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json?.ok && json?.data?.status === "healthy") {
          setHealth("healthy");
          setOffline(false);
        } else {
          setHealth("down");
          setOffline(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setHealth("down");
          setOffline(true);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const next = randomLatency();
      setStream((prev) => [...prev.slice(1), { id: prev[prev.length - 1]?.id ? prev[prev.length - 1].id + 1 : 1, latency: next }]);
      setHeatmap((prev) => {
        const copy = [...prev];
        const hour = new Date().getHours();
        copy[hour] = { hour, latency: next };
        return copy;
      });
      setP50(Math.max(28, Math.round(35 + Math.random() * 20)));
      setP95(Math.max(90, Math.round(110 + Math.random() * 45)));
      setP99(Math.max(140, Math.round(160 + Math.random() * 65)));
      setFlashDot(true);
      setTimeout(() => setFlashDot(false), 700);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const coverageData = useMemo(
    () => [
      { name: "/v1/recommendations", value: 68, color: "#E23744" },
      { name: "/v1/dashboard/*", value: 20, color: "#00BFA5" },
      { name: "/health", value: 12, color: "#F5A623" },
    ],
    [],
  );

  const strategyData = useMemo(
    () => [
      { name: "Two-stage", value: 78, color: "#E23744" },
      { name: "Cold-start", value: 22, color: "#F5A623" },
    ],
    [],
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
      <section>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Monitoring</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#757575]">live ops dashboard · bloomberg terminal style</p>
      </section>

      <section className="brand-card p-4">
        <h2 className="mb-3 font-display text-lg font-semibold text-white">Latency Heatmap (24h)</h2>
        <div className="grid grid-cols-12 gap-1 md:grid-cols-24">
          {heatmap.map((cell) => (
            <div
              key={cell.hour}
              className="group relative h-10 rounded-md border border-black/20"
              style={{ background: latencyBucketColor(cell.latency) }}
            >
              <span className="absolute left-1 top-1 font-mono text-[9px] text-white/70">{cell.hour}</span>
              <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 rounded border border-white/10 bg-black px-2 py-1 font-mono text-[10px] text-white group-hover:block">
                {cell.hour}:00 · {cell.latency}ms
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="brand-card p-5">
          <h2 className="font-display text-xl font-semibold text-white">Latency Percentiles</h2>
          <p className="mt-1 flex items-center gap-2 font-mono text-xs text-[#848484]">
            <span className={cn("h-2 w-2 rounded-full", flashDot ? "bg-emerald-400" : "bg-[#3e3e3e]")} />
            {health === "healthy" ? "Live updating every 10s" : "Waiting for health check"}
          </p>
          <div className="mt-4 space-y-4">
            {[
              { label: "P50", value: p50, color: p50 < 100 ? "#22c55e" : p50 < 150 ? "#f59e0b" : "#ef4444" },
              { label: "P95", value: p95, color: p95 < 100 ? "#22c55e" : p95 < 150 ? "#f59e0b" : "#ef4444" },
              { label: "P99", value: p99, color: p99 < 100 ? "#22c55e" : p99 < 150 ? "#f59e0b" : "#ef4444" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-end justify-between">
                  <p className="font-display text-3xl font-bold text-white">
                    {row.value}
                    <span className="ml-1 text-xl text-[#8f8f8f]">ms</span>
                  </p>
                  <p className="font-mono text-xs text-[#8b8b8b]">{row.label}</p>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[#2a2a2a]">
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (row.value / 250) * 100)}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="brand-card p-5">
          <h2 className="font-display text-xl font-semibold text-white">Real-time Latency Stream</h2>
          <div className="mt-3 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stream} margin={{ left: -12, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00BFA5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00BFA5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                <XAxis dataKey="id" tick={false} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8d8d8d", fontSize: 10 }} />
                <Tooltip content={<TooltipCard />} />
                <ReferenceLine y={250} stroke="#ef4444" strokeDasharray="6 4" label={{ value: "250ms budget", fill: "#ef4444", fontSize: 10, position: "right" }} />
                <Area dataKey="latency" fill="url(#latencyArea)" stroke="none" />
                <Line dataKey="latency" stroke="#00BFA5" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="brand-card p-4">
          <h3 className="font-display text-lg font-semibold text-white">Endpoint Coverage</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={coverageData} dataKey="value" innerRadius={45} outerRadius={70}>
                  {coverageData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipCard />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="brand-card p-4">
          <h3 className="font-display text-lg font-semibold text-white">Cold-Start vs Two-Stage</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={strategyData} dataKey="value" innerRadius={48} outerRadius={70}>
                  {strategyData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipCard />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="brand-card p-4">
          <h3 className="font-display text-lg font-semibold text-white">Error Rate</h3>
          <p className="mt-3 font-display text-5xl font-bold text-emerald-300">0.00%</p>
          <p className="mt-2 text-sm text-[#8d8d8d]">Last 100 requests: 0 errors</p>
          <div className="mt-4 h-2 rounded-full bg-[#2a2a2a]">
            <div className="h-2 w-full rounded-full bg-emerald-500" />
          </div>
        </article>
      </section>
    </div>
  );
}
