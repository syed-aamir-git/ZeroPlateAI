"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { ForecastIcon, CrateIcon, ShieldCheckIcon } from "@/components/icons/ledger-icons";
import SurplusAiCalculator from "@/components/calculator/surplus-ai-calculator";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DailyPrediction {
  date: string;
  day_name: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
  projected_surplus_risk: number;
}

interface CategoryBreakdown {
  category: string;
  predicted_demand: number;
  recommended_prep: number;
  surplus_risk: number;
}

interface ForecastData {
  institution_id: string;
  confidence: "high" | "moderate" | "low";
  confidence_score: number;
  model_used: string;
  data_points_count: number;
  notes: string;
  predictions: DailyPrediction[];
  categories: CategoryBreakdown[];
  total_predicted_demand: number;
  total_projected_surplus_risk: number;
}

export default function InstitutionForecastPage() {
  const [institution, setInstitution] = useState<any>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForecast() {
      try {
        setIsLoading(true);
        // 1. Get institution profile
        const instRes = await fetch("/api/v1/institution/profile");
        if (!instRes.ok) {
          throw new Error("Could not load institution profile. Complete onboarding first.");
        }
        const instData = await instRes.json();
        const currentInst = instData.institution;
        setInstitution(currentInst);

        if (!currentInst?._id) {
          throw new Error("Institution record missing.");
        }

        // 2. Fetch forecast proxy
        const fRes = await fetch(`/api/v1/forecast/${currentInst._id}`);
        if (!fRes.ok) {
          const fErr = await fRes.json().catch(() => ({}));
          setError(fErr.error || "Failed to load forecast data.");
          return;
        }
        const fJson = await fRes.json();
        if (fJson.forecast) {
          setForecast(fJson.forecast);
        } else {
          setError("Forecast data unavailable for this institution.");
        }
      } catch (err: any) {
        console.error("Forecast page load error:", err);
        setError(err.message || "Failed to load predictive forecast.");
      } finally {
        setIsLoading(false);
      }
    }

    loadForecast();
  }, []);

  // Format chart data
  const chartData = forecast?.predictions.map((p) => ({
    day: `${p.day_name.slice(0, 3)} (${p.date.slice(5)})`,
    demand: p.predicted_demand,
    upper: p.upper_bound,
    lower: p.lower_bound,
    surplus: p.projected_surplus_risk,
    band: [p.lower_bound, p.upper_bound],
  })) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-2xl sm:text-3xl text-ink font-bold">
                Kitchen Demand & Food Forecast
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-basil/15 text-basil border border-basil/30">
                7-Day Kitchen Guide
              </span>
            </div>
            <p className="text-sm text-ink-soft mt-1">
              {institution?.name || "Your Kitchen"} · Plan daily cooking portions, understand diner demand, and prevent food waste before it happens.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app/institution/inventory"
              className="text-xs px-3.5 py-2 rounded-lg border border-line bg-ledger-surface hover:bg-ledger-paper text-ink font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <span>+ Log Today&apos;s Meals / Inventory</span>
            </Link>
          </div>
        </div>

        {/* Real-time Interactive AI Calculator */}
        <SurplusAiCalculator />

        {error ? (
          <div className="p-6 border border-clay-rust/40 bg-clay-rust/10 text-clay-rust rounded-xl text-sm">
            <strong>Unable to load forecast:</strong> {error}
          </div>
        ) : isLoading ? (
          <div className="py-20 text-center text-ink-soft font-mono text-sm">
            Calculating 7-day meal forecasts for your kitchen...
          </div>
        ) : !forecast || forecast.data_points_count === 0 ? (
          /* Real Zero / Empty State */
          <div className="border border-line bg-ledger-surface p-12 text-center rounded-xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-ledger-paper flex items-center justify-center text-ink-soft">
              <ForecastIcon size={24} />
            </div>
            <h2 className="font-serif text-xl font-bold text-ink">
              No Kitchen Logs Found Yet
            </h2>
            <p className="text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
              ZeroPlate AI needs a few daily kitchen logs to learn your dining rush patterns and predict meal demand accurately.
            </p>
            <div className="pt-2">
              <Link
                href="/app/institution/inventory"
                className="inline-block px-5 py-2.5 rounded-lg bg-basil text-[#FAF7F2] font-semibold text-xs hover:bg-basil/90 transition-colors shadow-xs"
              >
                Log Your First Batch of Food →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Plain English AI Status Banner */}
            {forecast.confidence === "low" ? (
              <div className="border border-amber-300 bg-amber-50/60 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <ForecastIcon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wide text-amber-900">
                        🌱 AI Kitchen Learning Mode (Day {forecast.data_points_count} of 14)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200 text-amber-900">
                        Early Calibration
                      </span>
                    </div>
                    <p className="text-xs text-amber-950/80 mt-1 leading-relaxed">
                      ZeroPlate AI is learning your kitchen&apos;s daily dining habits. Right now, predictions use standard community kitchen baselines. As you log more daily meals, accuracy becomes sharper every single day.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] text-amber-800 block font-medium">Reliability</span>
                  <span className="font-mono text-base font-bold text-amber-900">
                    {Math.round(forecast.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="border border-basil/30 bg-emerald-50/60 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-basil/20 text-basil flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheckIcon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wide text-emerald-900">
                        ✨ Smart Prediction Engine Active
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-basil/20 text-basil">
                        High Accuracy
                      </span>
                    </div>
                    <p className="text-xs text-emerald-950/80 mt-1 leading-relaxed">
                      Calibrated directly from your past {forecast.data_points_count} days of kitchen records. It accounts for weekday dining rushes, typical leftovers, and seasonal variations.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] text-emerald-800 block font-medium">Forecast Accuracy</span>
                  <span className="font-mono text-base font-bold text-basil">
                    {Math.round(forecast.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Friendly Metric Cards (Clear & Jargon-free) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Food Needed */}
              <div className="p-4 border border-line bg-ledger-surface rounded-xl shadow-2xs space-y-1.5">
                <div className="text-xs font-bold text-ink-soft uppercase tracking-wide">
                  Expected Food Needed (7 Days)
                </div>
                <div className="font-serif text-2xl font-bold text-ink flex items-baseline gap-1.5">
                  <span>{forecast.total_predicted_demand.toLocaleString()}</span>
                  <span className="text-xs font-sans text-ink-soft font-normal">kg</span>
                </div>
                <div className="text-xs text-ink-soft leading-snug">
                  Feeds approximately{" "}
                  <strong className="text-ink">
                    ~{Math.round(forecast.total_predicted_demand * 2.2).toLocaleString()} meals
                  </strong>{" "}
                  across the upcoming week.
                </div>
              </div>

              {/* Card 2: Likely Leftovers */}
              <div className="p-4 border border-line bg-ledger-surface rounded-xl shadow-2xs space-y-1.5">
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  Potential Extra Food (Surplus)
                </div>
                <div className="font-serif text-2xl font-bold text-amber-600 flex items-baseline gap-1.5">
                  <span>{forecast.total_projected_surplus_risk.toLocaleString()}</span>
                  <span className="text-xs font-sans text-ink-soft font-normal">kg</span>
                </div>
                <div className="text-xs text-ink-soft leading-snug">
                  Food likely left over if standard batches are cooked. Great to flag early for NGOs.
                </div>
              </div>

              {/* Card 3: Food Efficiency Target */}
              <div className="p-4 border border-line bg-ledger-surface rounded-xl shadow-2xs space-y-1.5">
                <div className="text-xs font-bold text-basil uppercase tracking-wide">
                  Food Waste Saved Target
                </div>
                <div className="font-serif text-2xl font-bold text-basil flex items-baseline gap-1.5">
                  <span>
                    {Math.round(
                      (1 -
                        forecast.total_projected_surplus_risk /
                          Math.max(1, forecast.total_predicted_demand)) *
                        100
                    )}%
                  </span>
                  <span className="text-xs font-sans text-ink-soft font-normal">efficiency</span>
                </div>
                <div className="text-xs text-ink-soft leading-snug">
                  Achieved when following our recommended cooking batch sizes.
                </div>
              </div>

              {/* Card 4: Learning Status */}
              <div className="p-4 border border-line bg-ledger-surface rounded-xl shadow-2xs space-y-1.5">
                <div className="text-xs font-bold text-ink-soft uppercase tracking-wide">
                  AI Kitchen Insights
                </div>
                <div className="font-serif text-xl font-bold text-ink">
                  {forecast.confidence === "high" ? "Fully Calibrated" : "Active Learning"}
                </div>
                <div className="text-xs text-ink-soft leading-snug">
                  Built on <strong>{forecast.data_points_count} days</strong> of real kitchen records and diner attendance.
                </div>
              </div>
            </div>

            {/* Time-Series Forecast Chart - Layman Friendly */}
            <div className="border border-line bg-ledger-surface p-5 sm:p-6 rounded-xl space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink">
                    Weekly Meal Demand &amp; Leftover Guide
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    The black line shows how much food you need each day. The soft amber area is your normal cooking window.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-ink rounded-full inline-block" />
                    <span className="text-ink">Food Needed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-2 bg-saffron/40 border border-saffron/70 rounded-xs inline-block" />
                    <span className="text-ink-soft">Normal Range</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-clay-rust rounded-full inline-block" />
                    <span className="text-ink-soft">Possible Leftovers</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#78716C", fontSize: 11, fontFamily: "var(--font-plex-sans)" }}
                      axisLine={{ stroke: "#D3CBBF" }}
                    />
                    <YAxis
                      tick={{ fill: "#78716C", fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
                      axisLine={{ stroke: "#D3CBBF" }}
                      unit=" kg"
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        const num = Number(value);
                        if (name === "Predicted Demand (kg)") {
                          return [`${num} kg (~${Math.round(num * 2.2)} meals)`, "Food Needed"];
                        }
                        if (name === "Surplus Risk (kg)") {
                          return [`${num} kg`, "Possible Leftovers"];
                        }
                        if (name === "Upper Bound (kg)") {
                          return [`${num} kg`, "Upper Safe Range"];
                        }
                        if (name === "Lower Bound (kg)") {
                          return [`${num} kg`, "Lower Safe Range"];
                        }
                        return [value, name];
                      }}
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        borderColor: "#D3CBBF",
                        fontSize: "12px",
                        fontFamily: "var(--font-plex-sans)",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    />
                    {/* Saffron Confidence Band Area */}
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill="#D9A441"
                      fillOpacity={0.25}
                      name="Upper Bound (kg)"
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="none"
                      fill="#FAF7F2"
                      fillOpacity={1}
                      name="Lower Bound (kg)"
                    />
                    {/* Predicted Demand Point Line */}
                    <Line
                      type="monotone"
                      dataKey="demand"
                      stroke="#1C1917"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#1C1917" }}
                      activeDot={{ r: 6, fill: "#2F5E41" }}
                      name="Predicted Demand (kg)"
                    />
                    {/* Projected Surplus Line */}
                    <Line
                      type="monotone"
                      dataKey="surplus"
                      stroke="#C15C3D"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: "#C15C3D" }}
                      name="Surplus Risk (kg)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Predictions Table - Layman Friendly */}
            <div className="border border-line bg-ledger-surface rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-line bg-ledger-paper flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-sm text-ink">
                    Day-by-Day Kitchen Guide
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Target cooking batches for your chefs each day to prevent overcooking and keep food fresh.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-ledger-paper text-[11px] uppercase tracking-wider text-ink-soft">
                      <th className="py-2.5 px-4 font-sans">Date &amp; Day</th>
                      <th className="py-2.5 px-4 font-mono text-right">Food Needed</th>
                      <th className="py-2.5 px-4 font-mono text-right">Normal Range</th>
                      <th className="py-2.5 px-4 font-mono text-right">Potential Leftovers</th>
                      <th className="py-2.5 px-4 font-sans text-right">Chef Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-xs font-sans">
                    {forecast.predictions.map((p) => {
                      const isHighSurplus = p.projected_surplus_risk > 15;
                      const isWeekend = p.day_name === "Saturday" || p.day_name === "Sunday";

                      return (
                        <tr key={p.date} className="hover:bg-black/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-ink flex items-center gap-1.5">
                              <span>{p.day_name}</span>
                              {isWeekend && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                                  Weekend
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-ink-soft">{p.date}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-ink text-right">
                            <div>{p.predicted_demand} kg</div>
                            <div className="text-[10px] text-ink-soft font-sans font-normal">
                              ~{Math.round(p.predicted_demand * 2.2)} meals
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-ink-soft text-right">
                            <span className="text-saffron font-medium">{p.lower_bound}</span>
                            {" – "}
                            <span className="text-saffron font-medium">{p.upper_bound} kg</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-right">
                            <span className={isHighSurplus ? "text-clay-rust font-bold" : "text-ink-soft"}>
                              {p.projected_surplus_risk} kg
                            </span>
                            {isHighSurplus && (
                              <span className="block text-[10px] text-clay-rust font-sans font-normal">
                                Flag for NGO
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-basil/10 text-basil border border-basil/20">
                              Cook ~{p.predicted_demand} kg (batch cap: {p.predicted_demand + 3}kg)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Breakdown Table - Layman Friendly */}
            {forecast.categories && forecast.categories.length > 0 && (
              <div className="border border-line bg-ledger-surface rounded-xl overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-line bg-ledger-paper">
                  <h3 className="font-serif font-bold text-sm text-ink">
                    Food Category Storage &amp; Cooking Guide
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Simple rules of thumb for your kitchen staff based on how long each food type stays fresh.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-ledger-paper text-[11px] uppercase tracking-wider text-ink-soft">
                        <th className="py-2.5 px-4 font-sans">Food Category</th>
                        <th className="py-2.5 px-4 font-mono text-right">Expected Need</th>
                        <th className="py-2.5 px-4 font-mono text-right">Target Cooking Limit</th>
                        <th className="py-2.5 px-4 font-mono text-right">Likely Extra</th>
                        <th className="py-2.5 px-4 font-sans text-right">What To Do With Extras</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-xs font-sans">
                      {forecast.categories.map((c) => {
                        const catIcons: Record<string, string> = {
                          cooked_food: "🍲 Cooked Meals",
                          bakery: "🥖 Bakery & Bread",
                          dairy: "🥛 Dairy Products",
                          raw_produce: "🥦 Fresh Fruits & Veg",
                          packaged_dry: "📦 Dry & Packaged",
                        };

                        const friendlyActions: Record<string, string> = {
                          cooked_food: "Post to ZeroPlate 1-2 hours before meal ends for quick hot pickup",
                          bakery: "Bundle and schedule pickup for evening distribution",
                          dairy: "Store chilled below 5°C; donate sealed containers before best-by date",
                          raw_produce: "Inspect daily; prioritize leafy greens for immediate redistribution",
                          packaged_dry: "Store in cool dry pantry; highly shelf-stable buffer",
                        };

                        const categoryName = catIcons[c.category] || c.category.replace("_", " ");
                        const advice = friendlyActions[c.category] || "Check freshness daily";

                        return (
                          <tr key={c.category} className="hover:bg-black/5 transition-colors">
                            <td className="py-3 px-4 font-medium text-ink">
                              {categoryName}
                            </td>
                            <td className="py-3 px-4 font-mono text-ink text-right font-semibold">
                              {c.predicted_demand} kg
                            </td>
                            <td className="py-3 px-4 font-mono text-basil text-right font-semibold">
                              {c.recommended_prep} kg
                            </td>
                            <td className="py-3 px-4 font-mono text-amber-700 text-right">
                              {c.surplus_risk} kg
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-[11px] text-ink-soft leading-snug block max-w-xs ml-auto">
                                {advice}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
  );
}
