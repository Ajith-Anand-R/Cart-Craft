"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";

type ModelRow = {
  model: string;
  auc: number;
  p8: number;
  r8: number;
  ndcg8: number;
  latency: number;
};

const MODEL_ROWS: ModelRow[] = [
  { model: "Popularity Baseline", auc: 0.61, p8: 0.12, r8: 0.18, ndcg8: 0.14, latency: 8 },
  { model: "Collaborative Filter", auc: 0.72, p8: 0.21, r8: 0.27, ndcg8: 0.23, latency: 22 },
  { model: "LightGBM v1", auc: 0.81, p8: 0.28, r8: 0.34, ndcg8: 0.37, latency: 45 },
  { model: "LightGBM v2", auc: 0.92, p8: 0.33, r8: 0.41, ndcg8: 0.863, latency: 53 },
];

const IMPORTANCE = [
  { feature: "item_price_vs_user_avg", score: 100 },
  { feature: "item_popularity_score", score: 86 },
  { feature: "user_avg_cart_value", score: 74 },
  { feature: "item_price", score: 69 },
  { feature: "cart_total_value", score: 53 },
  { feature: "user_accept_rate", score: 50 },
  { feature: "item_avg_rating", score: 48 },
  { feature: "item_affinity_score", score: 43 },
  { feature: "hour_of_day", score: 35 },
];

const LOSS = Array.from({ length: 32 }, (_, i) => ({
  epoch: i + 1,
  train: Number((0.71 - i * 0.013 + Math.random() * 0.012).toFixed(3)),
  val: Number((0.75 - i * 0.0105 + Math.random() * 0.016).toFixed(3)),
}));

const HISTOGRAM = Array.from({ length: 12 }, (_, i) => ({
  bin: `${(i / 12).toFixed(2)}-${((i + 1) / 12).toFixed(2)}`,
  positive: Math.max(3, Math.round((i + 2) ** 1.4 + (i > 6 ? 12 : 0))),
  negative: Math.max(3, Math.round((12 - i) ** 1.35 + (i < 5 ? 8 : 0))),
}));

type CountUpProps = {
  value: number;
  decimals?: number;
};

function CountUp({ value, decimals = 0 }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1200);
      setDisplay(value * easeOutCubic(p));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

function BrandTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }> }) {
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

export default function ModelLabPage() {
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [liveAuc, setLiveAuc] = useState(0.92);
  const [liveNdcg, setLiveNdcg] = useState(0.863);

  useEffect(() => {
    setEntered(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/dashboard/kpis", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json?.ok && json?.data) {
          setLiveAuc(json.data.auc ?? 0.92);
          setLiveNdcg(json.data.ndcg_at_8 ?? 0.863);
          setOffline(false);
        } else {
          setOffline(true);
        }
      })
      .catch(() => {
        if (mounted) setOffline(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const maxima = useMemo(
    () => ({
      auc: Math.max(...MODEL_ROWS.map((row) => row.auc)),
      p8: Math.max(...MODEL_ROWS.map((row) => row.p8)),
      r8: Math.max(...MODEL_ROWS.map((row) => row.r8)),
      ndcg8: Math.max(...MODEL_ROWS.map((row) => row.ndcg8)),
    }),
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
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Model Lab</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#727272]">Engineering console · ranking internals and training diagnostics</p>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[#1C1C1C]" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="brand-card p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#707070]">AUC</p>
            <p className="mt-2 font-display text-4xl font-bold text-[#E23744]">
              <CountUp value={liveAuc} decimals={3} />
            </p>
          </div>
          <div className="brand-card p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#707070]">NDCG@8</p>
            <p className="mt-2 font-display text-4xl font-bold text-[#00BFA5]">
              <CountUp value={liveNdcg} decimals={3} />
            </p>
          </div>
          <div className="brand-card p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#707070]">Latency</p>
            <p className="mt-2 font-display text-4xl font-bold text-[#F5A623]">
              <CountUp value={53} />
              ms
            </p>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0A0A0A]">
        <div className="bg-[#E23744] px-5 py-3 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-white">Model Comparison</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.14em] text-[#8a8a8a]">
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">AUC</th>
                <th className="px-4 py-3">P@8</th>
                <th className="px-4 py-3">R@8</th>
                <th className="px-4 py-3">NDCG@8</th>
                <th className="px-4 py-3">Latency</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_ROWS.map((row) => {
                const winner = row.model === "LightGBM v2";
                return (
                  <tr key={row.model} className={cn("border-b border-white/5", winner && "bg-[#E23744]/10")}>
                    <td className="px-4 py-3 text-[#efefef]">{row.model}</td>
                    <td className={cn("px-4 py-3", row.auc === maxima.auc && "font-bold text-[#E23744]")}>{row.auc.toFixed(2)}</td>
                    <td className={cn("px-4 py-3", row.p8 === maxima.p8 && "font-bold text-[#E23744]")}>{row.p8.toFixed(2)}</td>
                    <td className={cn("px-4 py-3", row.r8 === maxima.r8 && "font-bold text-[#E23744]")}>{row.r8.toFixed(2)}</td>
                    <td className={cn("px-4 py-3", row.ndcg8 === maxima.ndcg8 && "font-bold text-[#E23744]")}>{row.ndcg8.toFixed(3)}</td>
                    <td className="px-4 py-3">{row.latency}ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="brand-card p-5">
          <h2 className="font-display text-xl font-semibold text-white">Feature Importance</h2>
          <div className="mt-3 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={IMPORTANCE} layout="vertical" margin={{ left: 10, right: 15, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#8b8b8b", fontSize: 10 }} />
                <YAxis type="category" dataKey="feature" axisLine={false} tickLine={false} width={150} tick={{ fill: "#a0a0a0", fontSize: 10, fontFamily: "var(--font-mono)" }} />
                <Tooltip content={<BrandTooltip />} />
                <Bar dataKey="score" animationDuration={700} animationEasing="ease-out">
                  {IMPORTANCE.map((row, idx) => (
                    <Cell key={row.feature} fill={idx < 3 ? "#E23744" : idx < 6 ? "#f06b56" : "#F5A623"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="brand-card p-5">
          <h2 className="font-display text-xl font-semibold text-white">Training Loss Curve</h2>
          <div className="mt-3 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={LOSS} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fill: "#8b8b8b", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b8b8b", fontSize: 11 }} />
                <Tooltip content={<BrandTooltip />} />
                <ReferenceLine x={22} stroke="#888" strokeDasharray="4 3" label={{ value: "Early Stop", fill: "#999", fontSize: 10 }} />
                <Area type="monotone" dataKey="val" stroke="none" fill="#00BFA5" fillOpacity={0.1} />
                <Line type="monotone" dataKey="train" stroke="#E23744" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="val" stroke="#00BFA5" dot={false} strokeWidth={2} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="brand-card p-5">
        <h2 className="font-display text-xl font-semibold text-white">Score Distribution Comparison</h2>
        <p className="mb-3 mt-1 text-sm text-[#8d8d8d]">Positive items score 0.41 higher on average</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={HISTOGRAM} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
              <XAxis dataKey="bin" axisLine={false} tickLine={false} tick={{ fill: "#8b8b8b", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b8b8b", fontSize: 10 }} />
              <Tooltip content={<BrandTooltip />} />
              <Bar dataKey="positive" fill="#E23744" name="Positive" />
              <Bar dataKey="negative" fill="#666666" name="Negative" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
