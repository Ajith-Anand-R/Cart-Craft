"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const FLOW = [
  "Mobile/Web Client",
  "Flask API Gateway",
  "Cold-Start?",
  "Stage-1 Retrieval (affinity + FAISS)",
  "Stage-2 LightGBM v2 (34 features)",
  "Post-processor (diversity cap)",
  "Response",
];

const LATENCY_BREAKDOWN = [
  { label: "Request overhead", ms: 10, color: "#667085" },
  { label: "Stage-1", ms: 15, color: "#F5A623" },
  { label: "Stage-2", ms: 20, color: "#E23744" },
  { label: "Post-process", ms: 5, color: "#00BFA5" },
  { label: "Network", ms: 7, color: "#7C5CBF" },
];

const totalLatency = LATENCY_BREAKDOWN.reduce((sum, entry) => sum + entry.ms, 0);
const remainingPct = Math.round(((250 - totalLatency) / 250) * 100);

export default function SystemDesignPage() {
  const [entered, setEntered] = useState(false);
  useEffect(() => setEntered(true), []);

  return (
    <div className={cn("page-enter space-y-6 pb-6", entered && "page-enter-active")}>
      <section>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">System Design</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#757575]">animated serving topology · two-stage intelligence path</p>
      </section>

      <section className="brand-card overflow-hidden p-5">
        <h2 className="mb-4 font-display text-xl font-semibold text-white">Pipeline Flow</h2>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-7 items-center gap-3">
              {FLOW.map((node, idx) => (
                <div key={node} className="relative">
                  <div className="rounded-xl border border-white/10 bg-[#161616] p-3 text-center">
                    <p className="font-body text-sm text-[#efefef]">{node}</p>
                  </div>
                  {idx < FLOW.length - 1 ? (
                    <div className="absolute left-full top-1/2 z-10 h-[2px] w-3 -translate-y-1/2 bg-[#2f2f2f]">
                      <span
                        className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#E23744]"
                        style={{ animation: "flow-dot 3s linear infinite" }}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-7 items-start gap-3">
              <div />
              <div />
              <div className="relative rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/10 p-3">
                <p className="text-center text-sm text-[#f9d59a]">YES → Score by Popularity → Return 8 items</p>
              </div>
              <div />
              <div />
              <div />
              <div />
            </div>
          </div>
        </div>
      </section>

      <section className="brand-card p-5">
        <h2 className="font-display text-xl font-semibold text-white">Latency Budget</h2>
        <p className="mt-1 font-mono text-xs text-[#7b7b7b]">{totalLatency}ms used of 250ms budget</p>
        <div className="mt-4 overflow-hidden rounded-lg bg-[#2a2a2a]">
          <div className="flex h-8" style={{ width: `${(totalLatency / 250) * 100}%` }}>
            {LATENCY_BREAKDOWN.map((part) => (
              <div
                key={part.label}
                className="flex items-center justify-center text-[10px] text-white"
                style={{ width: `${(part.ms / totalLatency) * 100}%`, background: part.color }}
              >
                {part.ms}ms
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {LATENCY_BREAKDOWN.map((part) => (
            <span key={part.label} className="rounded-full px-2 py-1 font-mono text-[10px]" style={{ background: `${part.color}33`, color: "#d9d9d9" }}>
              {part.label} ({part.ms}ms)
            </span>
          ))}
        </div>
        <p className="mt-3 font-mono text-sm text-[#66d7ca]">{remainingPct}% budget remaining</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="brand-card p-4">
          <h3 className="font-display text-lg font-semibold text-white">Offline Pipeline</h3>
          <div className="mt-3 space-y-2">
            {["Order Logs", "Nightly Batch Jobs", "Feature Aggregates", "Snapshot Publish"].map((step, idx) => (
              <div key={step} className="relative rounded-lg border border-white/10 bg-[#171717] p-3">
                <p className="text-sm text-[#e9e9e9]">{step}</p>
                {idx < 3 ? <span className="absolute -bottom-2 left-1/2 h-4 w-px -translate-x-1/2 bg-[#3a3a3a]" /> : null}
              </div>
            ))}
          </div>
        </article>

        <article className="brand-card p-4">
          <h3 className="font-display text-lg font-semibold text-white">Feature Store</h3>
          <div className="mt-3 space-y-2">
            {["Redis Hot Layer", "Cassandra Warm Layer", "Feature Join Service", "Online Serving Vectors"].map((step, idx) => (
              <div key={step} className="relative rounded-lg border border-white/10 bg-[#171717] p-3">
                <p className="text-sm text-[#e9e9e9]">{step}</p>
                {idx < 3 ? <span className="absolute -bottom-2 left-1/2 h-4 w-px -translate-x-1/2 bg-[#3a3a3a]" /> : null}
              </div>
            ))}
          </div>
        </article>

        <article className="brand-card p-4">
          <h3 className="font-display text-lg font-semibold text-white">Model Registry</h3>
          <div className="mt-3 space-y-2">
            {["Versioned Artifacts", "Validation Gate", "Deployment Tag", "Inference API Load"].map((step, idx) => (
              <div key={step} className="relative rounded-lg border border-white/10 bg-[#171717] p-3">
                <p className="text-sm text-[#e9e9e9]">{step}</p>
                {idx < 3 ? <span className="absolute -bottom-2 left-1/2 h-4 w-px -translate-x-1/2 bg-[#3a3a3a]" /> : null}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
