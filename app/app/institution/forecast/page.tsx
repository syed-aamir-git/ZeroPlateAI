"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Package,
  Calculator,
  ArrowRight,
  Layers,
  Calendar,
  CheckCircle2,
  Info,
  Clock,
  Scale,
} from "lucide-react";
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
import SurplusAiCalculator from "@/components/calculator/surplus-ai-calculator";

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
  const chartData =
    forecast?.predictions.map((p) => ({
      day: `${p.day_name.slice(0, 3)} (${p.date.slice(5)})`,
      date: p.date,
      day_name: p.day_name,
      demand: p.predicted_demand,
      upper: p.upper_bound,
      lower: p.lower_bound,
      surplus: p.projected_surplus_risk,
    })) || [];

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Kitchen Demand &amp; Predictive Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              7-Day Kitchen Guide
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-2xl">
            {institution?.name || "Your Kitchen"} · Plan daily cooking portions, understand diner demand, and prevent food waste before it happens.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            href="/app/institution/inventory"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition-all shadow-xs hover:shadow-sm"
          >
            <Package className="w-4 h-4 text-stone-500" />
            <span>+ Log Meals / Inventory</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            {forecast?.confidence ? `${forecast.confidence.toUpperCase()} CONFIDENCE` : "CALIBRATING"}
          </span>
        </div>
      </div>

      {/* 2. Real-time Interactive AI Calculator (MealBalance) */}
      <SurplusAiCalculator />

      {error ? (
        <div className="p-6 border border-rose-200 bg-rose-50 text-rose-800 rounded-2xl text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Unable to load forecast:</strong> {error}
          </div>
        </div>
      ) : isLoading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Calculating 7-day meal demand forecasts for your kitchen...
          </p>
        </div>
      ) : !forecast || forecast.data_points_count === 0 ? (
        /* Empty State */
        <div className="border border-stone-200 bg-white p-12 text-center rounded-2xl space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200/80 mx-auto flex items-center justify-center text-stone-500 shadow-2xs">
            <TrendingUp className="w-7 h-7 text-stone-400" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              No Kitchen Logs Found Yet
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              ZeroPlate AI needs a few daily kitchen logs to learn your dining rush patterns and predict meal demand accurately.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/app/institution/inventory"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <span>+ Record First Kitchen Intake</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Four Modern Colorful Theme KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Blue Theme - Total 7-Day Demand */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
                  7-Day Food Needed
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-blue-900 flex items-baseline gap-1.5">
                <span>{forecast.total_predicted_demand.toLocaleString()}</span>
                <span className="text-xs font-sans text-stone-500 font-normal">kg</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-900 border border-blue-200">
                  ~{Math.round(forecast.total_predicted_demand * 2.2).toLocaleString()} meals
                </span>
                <span className="text-[11px] text-stone-500">projected need</span>
              </div>
            </div>

            {/* Card 2: Amber Theme - Likely Leftovers */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
                  Potential Extra (Surplus)
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
                <span>{forecast.total_projected_surplus_risk.toLocaleString()}</span>
                <span className="text-xs font-sans text-stone-500 font-normal">kg</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
                  Buffer Window
                </span>
                <span className="text-[11px] text-stone-500">flag early for NGOs</span>
              </div>
            </div>

            {/* Card 3: Emerald Theme - Waste Prevention Target */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
                  Food Efficiency Target
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-700 flex items-baseline gap-1.5">
                {Math.round(
                  (1 -
                    forecast.total_projected_surplus_risk /
                      Math.max(1, forecast.total_predicted_demand)) *
                    100
                )}%
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                  Calibrated
                </span>
                <span className="text-[11px] text-stone-500">following batch caps</span>
              </div>
            </div>

            {/* Card 4: Violet Theme - Forecasting Engine */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
                  AI Kitchen Insights
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-xl sm:text-2xl font-extrabold text-purple-900 truncate">
                {forecast.confidence === "high" ? "Fully Calibrated" : "Active Learning"}
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
                  {forecast.data_points_count} Logged Days
                </span>
                <span className="text-[11px] text-stone-500 font-mono">{forecast.model_used.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          {/* 4. Professional & Premium Time-Series Forecast Chart */}
          <div className="border border-stone-200 bg-white p-5 sm:p-7 rounded-2xl shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900">
                    Weekly Meal Demand &amp; Leftover Guide
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  The green line shows how much food you need each day. The soft amber area is your normal cooking window.
                </p>
              </div>

              {/* Colorful Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-sans flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-stone-800 font-semibold">Predicted Demand (kg)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-2.5 rounded-sm bg-amber-400/40 border border-amber-500 inline-block" />
                  <span className="text-stone-600">90% Confidence Window</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 inline-block border-b-2 border-dashed border-rose-500" />
                  <span className="text-stone-600">Possible Leftovers (kg)</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#8A8275"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#E5E0D5" }}
                  />
                  <YAxis
                    stroke="#8A8275"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#E5E0D5" }}
                    unit="kg"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5E0D5",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === "Demand") return [`${value} kg`, "Food Needed"];
                      if (name === "Upper") return [`${value} kg`, "High Ceiling"];
                      if (name === "Lower") return [`${value} kg`, "Low Floor"];
                      if (name === "Surplus") return [`${value} kg`, "Possible Extra"];
                      return [value, name || ""];
                    }}
                  />

                  {/* 90% Confidence Envelope (Area Band) */}
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="transparent"
                    fill="#F59E0B"
                    fillOpacity={0.12}
                    name="Upper"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="transparent"
                    fill="#FFFFFF"
                    fillOpacity={1}
                    name="Lower"
                  />

                  {/* Expected Demand Center Line */}
                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#059669", strokeWidth: 2, stroke: "#FFFFFF" }}
                    activeDot={{ r: 6 }}
                    name="Demand"
                  />

                  {/* Surplus Risk Overlay */}
                  <Line
                    type="monotone"
                    dataKey="surplus"
                    stroke="#E11D48"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Surplus"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. 7-Day Day-by-Day Forecast Breakdown Table */}
          <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60">
              <h3 className="font-serif font-bold text-base text-stone-900">
                7-Day Daily Cooking &amp; Leftover Guide
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Exact day-by-day cooking portions, confidence limits, and NGO surplus heads-up
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4 font-sans font-semibold">Date &amp; Day</th>
                    <th className="py-3 px-4 font-mono text-right font-semibold">Food Needed</th>
                    <th className="py-3 px-4 font-mono text-right font-semibold">Normal Range</th>
                    <th className="py-3 px-4 font-mono text-right font-semibold">Potential Leftovers</th>
                    <th className="py-3 px-4 font-sans text-right font-semibold">Chef Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs font-sans">
                  {forecast.predictions.map((p) => {
                    const isHighSurplus = p.projected_surplus_risk > 15;
                    const isWeekend = p.day_name === "Saturday" || p.day_name === "Sunday";

                    return (
                      <tr key={p.date} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <span>{p.day_name}</span>
                            {isWeekend && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                                Weekend
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-stone-400">{p.date}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-stone-900 text-right">
                          <div>{p.predicted_demand} kg</div>
                          <div className="text-[10px] text-stone-500 font-sans font-normal">
                            ~{Math.round(p.predicted_demand * 2.2)} meals
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-600 text-right">
                          <span className="text-amber-700 font-medium">{p.lower_bound}</span>
                          {" – "}
                          <span className="text-amber-700 font-medium">{p.upper_bound} kg</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-right">
                          <span className={isHighSurplus ? "text-rose-600 font-bold" : "text-stone-600"}>
                            {p.projected_surplus_risk} kg
                          </span>
                          {isHighSurplus && (
                            <span className="block text-[10px] text-rose-600 font-sans font-semibold">
                              Flag for NGO
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
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

          {/* 6. Category Breakdown Table - Layman Friendly */}
          {forecast.categories && forecast.categories.length > 0 && (
            <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60">
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Food Category Storage &amp; Cooking Guide
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Simple rules of thumb for your kitchen staff based on how long each food type stays fresh.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                      <th className="py-3 px-4 font-sans font-semibold">Food Category</th>
                      <th className="py-3 px-4 font-mono text-right font-semibold">Expected Need</th>
                      <th className="py-3 px-4 font-mono text-right font-semibold">Target Cooking Limit</th>
                      <th className="py-3 px-4 font-mono text-right font-semibold">Likely Extra</th>
                      <th className="py-3 px-4 font-sans text-right font-semibold">What To Do With Extras</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-sans">
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
                        <tr key={c.category} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4 font-medium text-stone-900">
                            {categoryName}
                          </td>
                          <td className="py-3 px-4 font-mono text-stone-700 text-right font-semibold">
                            {c.predicted_demand} kg
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-700 text-right font-bold">
                            {c.recommended_prep} kg
                          </td>
                          <td className="py-3 px-4 font-mono text-amber-700 text-right font-medium">
                            {c.surplus_risk} kg
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-[11px] text-stone-600 leading-snug block max-w-xs ml-auto">
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
