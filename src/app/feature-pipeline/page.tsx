"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Stage = {
  id: string;
  title: string;
  groups: Array<{
    group: "A" | "B" | "C";
    label: string;
    color: string;
    features: Array<{ name: string; importance: number }>;
  }>;
};

const STAGES: Stage[] = [
  {
    id: "raw",
    title: "Raw Data",
    groups: [
      {
        group: "A",
        label: "User",
        color: "#E23744",
        features: [
          { name: "user_order_count", importance: 74 },
          { name: "user_accept_rate", importance: 88 },
          { name: "user_avg_cart_value", importance: 70 },
        ],
      },
      {
        group: "B",
        label: "Cart",
        color: "#F5A623",
        features: [
          { name: "cart_total_value", importance: 84 },
          { name: "cart_item_count", importance: 64 },
        ],
      },
    ],
  },
  {
    id: "extract",
    title: "Feature Extraction",
    groups: [
      {
        group: "A",
        label: "User",
        color: "#E23744",
        features: [
          { name: "segment_encoded", importance: 56 },
          { name: "days_since_last_order", importance: 61 },
        ],
      },
      {
        group: "C",
        label: "Item",
        color: "#00BFA5",
        features: [
          { name: "item_affinity_score", importance: 83 },
          { name: "item_popularity_score", importance: 79 },
        ],
      },
    ],
  },
  {
    id: "store",
    title: "Feature Store",
    groups: [
      {
        group: "A",
        label: "User",
        color: "#E23744",
        features: [
          { name: "user_state_vector", importance: 52 },
          { name: "user_cluster_id", importance: 47 },
        ],
      },
      {
        group: "C",
        label: "Item",
        color: "#00BFA5",
        features: [
          { name: "item_embedding_faiss", importance: 90 },
          { name: "item_margin_bucket", importance: 38 },
        ],
      },
    ],
  },
  {
    id: "serving",
    title: "Serving",
    groups: [
      {
        group: "B",
        label: "Cart",
        color: "#F5A623",
        features: [
          { name: "cart_context_features", importance: 73 },
          { name: "meal_time_cross", importance: 65 },
        ],
      },
      {
        group: "C",
        label: "Item",
        color: "#00BFA5",
        features: [
          { name: "rank_score_calibration", importance: 58 },
          { name: "diversity_cap_signal", importance: 46 },
        ],
      },
    ],
  },
];

const STAGE_FLOW = ["Raw Data", "Feature Extraction", "Feature Store", "Serving"];

export default function FeaturePipelinePage() {
  const [entered, setEntered] = useState(false);
  const [openStage, setOpenStage] = useState<string>("raw");

  useEffect(() => setEntered(true), []);

  const orderedStages = useMemo(() => STAGES, []);

  return (
    <div className={cn("page-enter space-y-6 pb-6", entered && "page-enter-active")}>
      <section>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">Feature Pipeline</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[#757575]">data engineering visual · feature lineage and serving readiness</p>
      </section>

      <section className="brand-card overflow-x-auto p-5">
        <div className="flex min-w-[760px] items-center gap-3">
          {STAGE_FLOW.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-[#171717] px-5 py-3">
                <p className="font-display text-lg font-semibold text-white">{stage}</p>
              </div>
              {idx < STAGE_FLOW.length - 1 ? <span className="font-mono text-lg text-[#7a7a7a]">→</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {orderedStages.map((stage) => {
          const open = openStage === stage.id;
          return (
            <article key={stage.id} className="brand-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenStage(open ? "" : stage.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="font-display text-xl font-semibold text-white">{stage.title}</p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#767676]">{stage.groups.length} feature groups</p>
                </div>
                <ChevronDown className={cn("h-5 w-5 text-[#9b9b9b] transition-transform", open && "rotate-180")} />
              </button>

              {open ? (
                <div className="border-t border-white/10 px-5 py-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {stage.groups.map((group) => (
                      <div key={`${stage.id}-${group.group}`} className="rounded-xl border border-white/10 bg-[#161616] p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <span
                            className="rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]"
                            style={{ background: `${group.color}2b`, color: group.color }}
                          >
                            Group {group.group} ({group.label})
                          </span>
                        </div>

                        <div className="space-y-2">
                          {group.features.map((feature) => (
                            <div key={feature.name} className="rounded-lg border border-white/10 bg-[#1d1d1d] px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <code className="font-mono text-xs text-[#efefef]">{feature.name}</code>
                                <span className="font-mono text-[10px] text-[#8a8a8a]">{feature.importance}%</span>
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-[#2a2a2a]">
                                <div className="h-1.5 rounded-full" style={{ width: `${feature.importance}%`, background: group.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
