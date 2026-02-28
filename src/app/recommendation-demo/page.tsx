"use client";

import { Leaf, Loader2, LocateFixed, Store, UserCircle2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const CITIES = ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"];
const RESTAURANTS = [
  { id: "R00010", name: "Biryani Blues" },
  { id: "R00022", name: "Pizza Point" },
  { id: "R00331", name: "Burger Republic" },
  { id: "R00544", name: "Saffron Tiffins" },
];

type FoodCategory = "main" | "side" | "beverage" | "dessert" | "snack" | "biryani" | "pizza" | "burger";

type CartEntry = {
  item_id: string;
  name: string;
  category: FoodCategory;
  price: number;
};

interface Recommendation {
  rank: number;
  item_id: string;
  name: string;
  category: string;
  price: number;
  score: number;
  is_veg: boolean;
  is_bestseller: boolean;
  avg_rating: number;
}

interface ApiMetadata {
  strategy: string;
  stage1_candidates: number;
  stage2_ranked: number;
  displayed: number;
  latency_ms: number;
  latency_budget_ms: number;
  within_budget: boolean;
}

interface ApiResponse {
  ok: boolean;
  request_id: string | null;
  data: { recommendations: Recommendation[]; metadata: ApiMetadata } | null;
  error: { code: string; message: string } | null;
}

const EMOJI_MAP: Record<string, string> = {
  main: "🍛",
  side: "🥗",
  beverage: "🥤",
  dessert: "🍮",
  snack: "🍟",
  biryani: "🍚",
  pizza: "🍕",
  burger: "🍔",
};

const CATEGORY_COLORS: Record<string, string> = {
  main: "#E23744",
  side: "#F5A623",
  beverage: "#00BFA5",
  dessert: "#7C5CBF",
  snack: "#f0b429",
  biryani: "#E23744",
  pizza: "#F5A623",
  burger: "#00BFA5",
};

const ITEM_CATALOG: Record<string, CartEntry> = {
  I0000012: { item_id: "I0000012", name: "Chicken Biryani", category: "biryani", price: 180 },
  I0000155: { item_id: "I0000155", name: "Boondi Raita", category: "side", price: 60 },
  I0001122: { item_id: "I0001122", name: "Cola", category: "beverage", price: 40 },
  I0001312: { item_id: "I0001312", name: "Gulab Jamun", category: "dessert", price: 70 },
};

const DEFAULT_FORM = {
  user_id: "U000123",
  restaurant_id: "R00010",
  city: "Delhi",
  segment: "mid",
  veg_preference: false,
  preferred_cuisine: "",
  historical_addon_accept_rate: "0.28",
};

export default function RecommendationDemoPage() {
  const [entered, setEntered] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [cart, setCart] = useState<CartEntry[]>([ITEM_CATALOG.I0000012, ITEM_CATALOG.I0000155, ITEM_CATALOG.I0001122]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [offline, setOffline] = useState(false);
  const [flashCard, setFlashCard] = useState<string | null>(null);

  useEffect(() => {
    setEntered(true);
  }, []);

  const cartIds = useMemo(() => cart.map((entry) => entry.item_id), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const mealCategories = useMemo(() => {
    const base = ["main", "side", "beverage", "dessert", "snack"] as const;
    const present = new Set<string>(cart.map((item) => (item.category === "biryani" || item.category === "pizza" || item.category === "burger" ? "main" : item.category)));
    return base.map((cat) => ({ cat, complete: present.has(cat) }));
  }, [cart]);

  const completeness = useMemo(() => {
    const complete = mealCategories.filter((entry) => entry.complete).length;
    return Math.round((complete / mealCategories.length) * 100);
  }, [mealCategories]);

  const fetchRecommendations = useCallback(
    async (currentCartIds: string[]) => {
      setLoading(true);
      setOffline(false);
      try {
        const payload = {
          user_id: form.user_id,
          restaurant_id: form.restaurant_id,
          cart_item_ids: currentCartIds,
          city: form.city,
          segment: form.segment,
          veg_preference: form.veg_preference,
          preferred_cuisine: form.preferred_cuisine || undefined,
          historical_addon_accept_rate: parseFloat(form.historical_addon_accept_rate) || 0,
        };

        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data: ApiResponse = await res.json();
        setResult(data);
        setOffline(!data.ok);
      } catch {
        setOffline(true);
        setResult({
          ok: false,
          request_id: null,
          data: null,
          error: {
            code: "NETWORK_ERROR",
            message: "Could not reach recommendation service.",
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [form],
  );

  function updateForm<K extends keyof typeof DEFAULT_FORM>(key: K, value: (typeof DEFAULT_FORM)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((entry) => entry.item_id !== id));
  }

  async function addToCart(item: Recommendation) {
    if (cartIds.includes(item.item_id)) return;
    const mappedCategory = (item.category in EMOJI_MAP ? item.category : "snack") as FoodCategory;
    const entry: CartEntry = {
      item_id: item.item_id,
      name: item.name,
      category: mappedCategory,
      price: item.price,
    };
    setFlashCard(item.item_id);
    setCart((prev) => [...prev, entry]);
    setTimeout(() => setFlashCard(null), 420);
    await fetchRecommendations([...cartIds, item.item_id]);
  }

  return (
    <div className={cn("page-enter min-h-[calc(100vh-96px)] overflow-hidden rounded-xl border border-white/10", entered && "page-enter-active")}>
      <div className="grid min-h-[calc(100vh-96px)] grid-cols-1 xl:grid-cols-[400px_1fr]">
        <aside className="border-b border-r-0 border-[#1F1F1F] bg-[#0F0F0F] p-5 xl:border-b-0 xl:border-r">
          <div className="mb-5">
            <h1 className="font-display text-[28px] font-bold tracking-tight text-white">Live Cart Simulator</h1>
            <p className="mt-1 text-sm text-[#878787]">Interactive Zomato-style request builder</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <UserCircle2 className="absolute left-3 top-3.5 h-4 w-4 text-[#858585]" />
              <input
                value={form.user_id}
                onChange={(e) => updateForm("user_id", e.target.value)}
                className="h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] pl-9 pr-3 text-sm text-white outline-none transition-all focus:border-[#E23744] focus:shadow-[0_0_0_3px_rgba(226,55,68,0.2)]"
                placeholder="User ID"
              />
            </div>

            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#858585]" />
              <select
                value={form.restaurant_id}
                onChange={(e) => updateForm("restaurant_id", e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] pl-9 pr-3 text-sm text-white outline-none transition-all focus:border-[#E23744] focus:shadow-[0_0_0_3px_rgba(226,55,68,0.2)]"
              >
                {RESTAURANTS.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <LocateFixed className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#858585]" />
              <select
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] pl-9 pr-3 text-sm text-white outline-none transition-all focus:border-[#E23744] focus:shadow-[0_0_0_3px_rgba(226,55,68,0.2)]"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-[#2A2A2A] bg-[#151515] p-2">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#696969]">Segment</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: "budget", color: "#F5A623", label: "Budget" },
                  { key: "mid", color: "#00BFA5", label: "Mid" },
                  { key: "premium", color: "#E23744", label: "Premium" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => updateForm("segment", option.key)}
                    className="rounded-full px-2 py-1.5 text-xs transition-all"
                    style={{
                      background: form.segment === option.key ? option.color : "#1f1f1f",
                      color: form.segment === option.key ? "#fff" : "#a5a5a5",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateForm("veg_preference", !form.veg_preference)}
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-lg border px-3 text-sm transition-all",
                form.veg_preference
                  ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                  : "border-[#2A2A2A] bg-[#1C1C1C] text-[#b9b9b9]",
              )}
            >
              <span className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Veg Preference
              </span>
              <span className="font-mono text-xs">{form.veg_preference ? "ON" : "OFF"}</span>
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-white">Current Cart</h2>
              <span className="rounded-full bg-[#E23744]/20 px-2 py-1 font-mono text-[11px] text-[#ff9ea6]">{cart.length} items</span>
            </div>

            <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1">
              {cart.map((item) => {
                const color = CATEGORY_COLORS[item.category] ?? "#E23744";
                return (
                  <div key={item.item_id} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs" style={{ background: `${color}22`, color: "#f3f3f3" }}>
                    <span>{EMOJI_MAP[item.category] ?? "🍽️"}</span>
                    <span>{item.name}</span>
                    <span className="font-mono text-[#f7d58b]">₹{item.price}</span>
                    <button type="button" onClick={() => removeFromCart(item.item_id)} className="text-white/70 hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-[#151515] p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6f6f6f]">Cart Total</p>
              <p className="mt-1 font-display text-3xl font-bold text-[#E23744]">₹ {cartTotal.toFixed(2)}</p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => fetchRecommendations(cartIds)}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E23744] to-[#FF6B6B] text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Cart"
              )}
            </button>
          </div>
        </aside>

        <section className="bg-[#111111] p-5">
          {offline ? (
            <div className="flex min-h-[70vh] items-center justify-center">
              <div className="brand-card w-full max-w-lg p-8 text-center">
                <svg viewBox="0 0 120 120" className="mx-auto h-20 w-20 text-[#E23744]" fill="none">
                  <path d="M18 72h84a30 30 0 0 1-84 0Z" stroke="currentColor" strokeWidth="6" />
                  <path d="M34 50c2-10 8-16 12-16s10 6 12 16M62 50c2-10 8-16 12-16s10 6 12 16" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                </svg>
                <h2 className="mt-4 font-display text-2xl font-bold text-white">Backend Offline</h2>
                <p className="mt-2 text-sm text-[#9a9a9a]">Start Flask server to see live data</p>
                <button
                  type="button"
                  onClick={() => fetchRecommendations(cartIds)}
                  className="mt-5 rounded-lg bg-[#E23744] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff4d58]"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="brand-card mb-4 flex flex-wrap items-center gap-2 p-3">
                <span
                  className="rounded-full px-2.5 py-1 font-mono text-[11px]"
                  style={{
                    background: result?.data?.metadata.strategy === "cold_start" ? "rgba(245,166,35,0.18)" : "rgba(0,191,165,0.2)",
                    color: result?.data?.metadata.strategy === "cold_start" ? "#f7c46e" : "#67e9da",
                  }}
                >
                  {(result?.data?.metadata.strategy ?? "two_stage").replace("_", "-").toUpperCase()}
                </span>
                <span className="font-mono text-xs text-[#7a7a7a]">Stage-1: {result?.data?.metadata.stage1_candidates ?? 30} cands</span>
                <span className="font-mono text-xs text-[#7a7a7a]">Stage-2: LightGBM v2</span>
                <span
                  className="ml-auto font-mono text-xs"
                  style={{
                    color:
                      (result?.data?.metadata.latency_ms ?? 0) < 100
                        ? "#4ade80"
                        : (result?.data?.metadata.latency_ms ?? 0) < 200
                          ? "#F5A623"
                          : "#f87171",
                  }}
                >
                  Latency {Math.round(result?.data?.metadata.latency_ms ?? 0)}ms
                </span>
                <span className="font-mono text-[10px] text-[#666666]">req: {result?.request_id?.slice(0, 12) ?? "n/a"}</span>
              </div>

              {loading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="h-[140px] rounded-xl bg-[#1C1C1C] animate-pulse" />
                  ))}
                </div>
              ) : result?.ok && result.data ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {result.data.recommendations.map((rec, idx) => {
                      const category = rec.category in EMOJI_MAP ? rec.category : "snack";
                      const color = CATEGORY_COLORS[category] ?? "#E23744";
                      const delay = `${idx * 50}ms`;
                      const added = cartIds.includes(rec.item_id);
                      return (
                        <article
                          key={rec.item_id}
                          className={cn(
                            "group relative h-[140px] overflow-hidden rounded-xl border bg-[#1C1C1C] p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_34px_rgba(226,55,68,0.08)]",
                            flashCard === rec.item_id ? "border-emerald-400" : "border-white/10 hover:border-white/20",
                          )}
                          style={{ animation: `fade-up 320ms ease-out ${delay} both` }}
                        >
                          <p className="font-mono text-[11px] text-[#717171]">#{rec.rank}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xl">{EMOJI_MAP[category]}</span>
                            <h3 className="font-display text-base font-bold text-white">{rec.name}</h3>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="rounded-full px-2 py-0.5 font-mono text-[10px]" style={{ background: `${color}25`, color }}>
                              {category}
                            </span>
                            <span className="font-mono text-xs text-[#f7cc78]">₹ {rec.price}</span>
                          </div>
                          <div className="mt-3">
                            <div className="mb-1 h-1.5 w-full rounded-full bg-[#2a2a2a]">
                              <div className="h-1.5 rounded-full bg-[#E23744]" style={{ width: `${Math.min(100, rec.score * 100)}%`, transition: "width 600ms ease-out" }} />
                            </div>
                            <p className="font-mono text-[11px] text-[#8b8b8b]">Score: {rec.score.toFixed(3)}</p>
                          </div>
                          <button
                            type="button"
                            disabled={added}
                            onClick={() => addToCart(rec)}
                            className={cn(
                              "absolute bottom-3 right-3 rounded-md border px-2.5 py-1 text-xs transition-all",
                              added
                                ? "cursor-default border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                                : "border-white/20 text-white hover:scale-105 hover:border-[#E23744] hover:bg-[#E23744] hover:text-white",
                            )}
                          >
                            {added ? "In Cart" : "Add to Cart +"}
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  <div className="brand-card p-4">
                    <h3 className="font-display text-lg font-semibold text-white">Meal Completion Tracker</h3>
                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                      {mealCategories.map((entry) => (
                        <div key={entry.cat} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#171717] px-2 py-2">
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                              entry.complete ? "border-emerald-400 bg-emerald-500/20 text-emerald-300" : "border-dashed border-[#555] text-[#777]",
                            )}
                          >
                            {entry.complete ? "✓" : EMOJI_MAP[entry.cat]}
                          </span>
                          <span className="font-mono text-[11px] text-[#bfbfbf]">{entry.cat}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-mono text-[#8a8a8a]">Meal Completeness</span>
                        <span className="font-mono text-[#f6c56f]">{completeness}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#2a2a2a]">
                        <div className="h-2 rounded-full bg-[#F5A623]" style={{ width: `${completeness}%`, transition: "width 500ms ease-out" }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[64vh] items-center justify-center rounded-xl border border-dashed border-white/15 bg-[#141414]">
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-white">No recommendations yet</p>
                    <p className="mt-2 text-sm text-[#8b8b8b]">Click “Update Cart” to run the ranking pipeline.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
