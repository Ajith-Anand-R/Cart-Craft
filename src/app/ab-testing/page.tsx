"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Experiment = {
  id: string;
  name: string;
  hypothesis: string;
  controlLabel: string;
  treatmentLabel: string;
  acceptanceControl: number;
  acceptanceTreatment: number;
  aovControl: number;
  aovTreatment: number;
  latencyControl: number;
  latencyTreatment: number;
  pValue: number;
  nControl: number;
  nTreatment: number;
};

const FALLBACK_EXPERIMENTS: Experiment[] = [
  {
    id: "EXP-041",
    name: "Meal-Aware Ranking",
    hypothesis: "Meal-time feature crossing increases acceptance without latency regression.",
    controlLabel: "Current ranker",
    treatmentLabel: "Meal-aware ranker",
    acceptanceControl: 22.2,
    acceptanceTreatment: 24.1,
    aovControl: 322,
    aovTreatment: 338,
    latencyControl: 41,
    latencyTreatment: 45,
    pValue: 0.011,
    nControl: 13920,
    nTreatment: 13888,
  },
  {
    id: "EXP-042",
    name: "Top-5 vs Top-8 Display",
    hypothesis: "Reducing cognitive overload raises add-on conversion for budget users.",
    controlLabel: "Top-8 cards",
    treatmentLabel: "Top-5 cards",
    acceptanceControl: 21.4,
    acceptanceTreatment: 22.0,
    aovControl: 305,
    aovTreatment: 309,
    latencyControl: 38,
    latencyTreatment: 36,
    pValue: 0.083,
    nControl: 9820,
    nTreatment: 9770,
  },
  {
    id: "EXP-043",
    name: "Veg-first Rerank",
    hypothesis: "Category-aware veg prioritization improves trust and click-through.",
    controlLabel: "No veg prior",
    treatmentLabel: "Veg-first prior",
    acceptanceControl: 18.7,
    acceptanceTreatment: 21.8,
    aovControl: 286,
    aovTreatment: 301,
    latencyControl: 40,
    latencyTreatment: 44,
    pValue: 0.003,
    nControl: 7160,
    nTreatment: 7204,
  },
];

function deltaPercent(control: number, treatment: number) {
  if (control === 0) return 0;
  return ((treatment - control) / control) * 100;
}

function requiredSampleSize(baseRate: number, liftPct: number) {
  const alpha = 1.96;
  const beta = 0.84;
  const p1 = baseRate;
  const p2 = baseRate * (1 + liftPct / 100);
  const pBar = (p1 + p2) / 2;
  const numerator = (alpha * Math.sqrt(2 * pBar * (1 - pBar)) + beta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2;
  const denom = (p2 - p1) ** 2;
  return Math.ceil(numerator / Math.max(denom, 1e-6));
}

export default function ABTestingPage() {
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [experiments, setExperiments] = useState(FALLBACK_EXPERIMENTS);
  const [desiredLift, setDesiredLift] = useState(3);

  useEffect(() => {
    setEntered(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/dashboard/ab-test-results", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        const experimentsPayload = json?.data?.experiments;
        const dataPayload = json?.data;

        const normalizedExperiments = Array.isArray(experimentsPayload)
          ? experimentsPayload
          : dataPayload && typeof dataPayload === "object"
            ? Object.entries(dataPayload)
                .filter(([key, value]) => key.startsWith("experiment_") && value && typeof value === "object")
                .map(([key, value]) => ({
                  id: key.replace("experiment_", "").toUpperCase().replaceAll("_", "-"),
                  name: key.replace("experiment_", "").split("_").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" vs "),
                  control: "Control",
                  treatment: "Treatment",
                  acceptanceControl: Math.round(((value as { control_accept_rate?: number }).control_accept_rate ?? 0) * 1000) / 10,
                  acceptanceTreatment: Math.round(((value as { treatment_accept_rate?: number }).treatment_accept_rate ?? 0) * 1000) / 10,
                  aovControl: 322,
                  aovTreatment: 338,
                  pValue: (value as { p_value?: number }).p_value ?? 1,
                  nPerArm: (value as { n_per_arm?: number }).n_per_arm ?? 9000,
                }))
            : [];

        if (json?.ok && normalizedExperiments.length) {
          setExperiments(
            normalizedExperiments.map((exp: {
              id: string;
              name: string;
              control: string;
              treatment: string;
              acceptanceControl: number;
              acceptanceTreatment: number;
              aovControl: number;
              aovTreatment: number;
              pValue: number;
              nPerArm?: number;
            }) => ({
              id: exp.id,
              name: exp.name,
              hypothesis: "Live experiment imported from dashboard service.",
              controlLabel: exp.control,
              treatmentLabel: exp.treatment,
              acceptanceControl: exp.acceptanceControl,
              acceptanceTreatment: exp.acceptanceTreatment,
              aovControl: exp.aovControl,
              aovTreatment: exp.aovTreatment,
              latencyControl: 42,
              latencyTreatment: 44,
              pValue: exp.pValue,
              nControl: exp.nPerArm ?? 9000 + Math.round(Math.random() * 4000),
              nTreatment: exp.nPerArm ?? 9000 + Math.round(Math.random() * 4000),
            })),
          );
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

  const requiredN = useMemo(() => requiredSampleSize(0.22, desiredLift), [desiredLift]);

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
      <section className="brand-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Active Experiments</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#757575]">experiment control room</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ animation: "pulse-dot 1.8s infinite" }} />
          <span className="font-mono text-xs text-emerald-200">live</span>
        </div>
      </section>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-56 animate-pulse rounded-xl bg-[#1C1C1C]" />
          ))}
        </div>
      ) : (
        experiments.map((exp) => {
          const acceptanceDelta = deltaPercent(exp.acceptanceControl, exp.acceptanceTreatment);
          const aovDelta = deltaPercent(exp.aovControl, exp.aovTreatment);
          const latencyDelta = deltaPercent(exp.latencyControl, exp.latencyTreatment);
          const significant = exp.pValue < 0.05;
          const total = exp.nControl + exp.nTreatment;
          const controlShare = Math.round((exp.nControl / total) * 100);

          return (
            <article key={exp.id} className="brand-card p-5">
              <div className="grid gap-4 xl:grid-cols-[1.1fr_1.4fr_0.8fr]">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6d6d6d]">{exp.id}</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">{exp.name}</h2>
                  <p className="mt-2 text-sm text-[#9b9b9b]">{exp.hypothesis}</p>
                  <div className="mt-3 grid gap-1 text-xs text-[#bcbcbc]">
                    <span>Control: {exp.controlLabel}</span>
                    <span>Treatment: {exp.treatmentLabel}</span>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { key: "Acceptance Rate", control: `${exp.acceptanceControl}%`, treatment: `${exp.acceptanceTreatment}%`, delta: acceptanceDelta },
                    { key: "AOV", control: `₹${exp.aovControl}`, treatment: `₹${exp.aovTreatment}`, delta: aovDelta },
                    { key: "Latency", control: `${exp.latencyControl}ms`, treatment: `${exp.latencyTreatment}ms`, delta: -latencyDelta },
                  ].map((metric) => (
                    <div
                      key={metric.key}
                      className="rounded-xl border border-white/10 bg-[#171717] p-3"
                      style={significant && metric.delta > 0 ? { boxShadow: "0 0 0 1px rgba(16,185,129,0.35), 0 0 24px rgba(16,185,129,0.12)" } : undefined}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7a7a7a]">{metric.key}</p>
                      <p className="mt-1 text-xs text-[#8f8f8f]">C: {metric.control}</p>
                      <p className="text-sm text-[#f4f4f4]">T: {metric.treatment}</p>
                      <p className={cn("mt-1 flex items-center gap-1 font-mono text-[11px]", metric.delta >= 0 ? "text-emerald-300" : "text-red-300")}>
                        {metric.delta >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(metric.delta).toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-[#151515] p-3">
                  <p className={cn("font-display text-3xl font-bold", significant ? "text-emerald-300" : "text-[#F5A623]")}>{exp.pValue.toFixed(3)}</p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#7a7a7a]">p-value</p>
                  <p
                    className={cn(
                      "mt-2 inline-flex rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
                      significant ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300",
                    )}
                  >
                    {significant ? "Significant" : "Not Significant"}
                  </p>

                  <div className="mt-3">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#787878]">Sample Size</p>
                    <div className="h-2 rounded-full bg-[#292929]">
                      <div className="h-2 rounded-full bg-[#E23744]" style={{ width: `${controlShare}%` }} />
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-[#8f8f8f]">N control {exp.nControl.toLocaleString()} · N treatment {exp.nTreatment.toLocaleString()}</p>
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#787878]">MDE Calculator</p>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        value={desiredLift}
                        onChange={(e) => setDesiredLift(Math.max(0.1, Number(e.target.value) || 0.1))}
                        className="h-8 w-20 rounded-md border border-[#2A2A2A] bg-[#1d1d1d] px-2 font-mono text-xs text-white outline-none focus:border-[#E23744]"
                      />
                      <span className="font-mono text-xs text-[#8f8f8f]">% lift</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-[#a8a8a8]">Required N per arm: {requiredN.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
