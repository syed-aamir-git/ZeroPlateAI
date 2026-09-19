"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { ForecastIcon, CrateIcon, ShieldCheckIcon } from "@/components/icons/ledger-icons";
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
            <h1 className="font-serif text-2xl sm:text-3xl text-ink font-bold">
              AI Demand & Surplus Forecast
            </h1>
            <p className="text-sm text-ink-soft mt-1">
              {institution?.name || "Kitchen"} · Forward 7-day predictive production planning & surplus prevention
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app/institution/inventory"
              className="text-xs px-3 py-1.5 rounded border border-line bg-ledger-surface hover:bg-ledger-paper text-ink font-medium transition-colors"
            >
              Log Daily Inventory →
            </Link>
          </div>
        </div>

        {error ? (
          <div className="p-6 border border-clay-rust/40 bg-clay-rust/10 text-clay-rust rounded-md text-sm">
            <strong>Error:</strong> {error}
          </div>
        ) : isLoading ? (
          <div className="py-20 text-center text-ink-soft font-mono text-sm">
            Computing time-series models from verified inventory records...
          </div>
        ) : !forecast || forecast.data_points_count === 0 ? (
          /* Real Zero / Empty State */
          <div className="border border-line bg-ledger-surface p-12 text-center rounded-md space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-ledger-paper flex items-center justify-center text-ink-soft">
              <ForecastIcon size={24} />
            </div>
            <h2 className="font-serif text-xl font-bold text-ink">
              No Inventory History Logged Yet
            </h2>
            <p className="text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
              The AI forecasting engine relies on real historical inventory logs.
              Start by logging your daily food preparation and receipts to generate
              accurate production forecasts.
            </p>
            <div className="pt-2">
              <Link
                href="/app/institution/inventory"
                className="inline-block px-4 py-2 rounded bg-basil text-[#FAF7F2] font-medium text-xs hover:bg-basil/90 transition-colors"
              >
                Log First Inventory Batch
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Model Confidence Notice Banner */}
            {forecast.confidence === "low" ? (
              <div className="border border-saffron/50 bg-[#FDFBF7] p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-saffron/20 text-saffron flex items-center justify-center shrink-0 mt-0.5">
                    <ForecastIcon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-[#8C6D1F]">
                        Cold-Start Phase · Low Confidence Indicator
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-saffron/30 text-[#6B5214] font-semibold">
                        {forecast.data_points_count}/14 Days Logged
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                      {forecast.notes} Daily rolling averages and category baselines are applied until 14 days of inventory logs are established for full ARIMA time-series fitting.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-mono text-ink-soft block">Model Score</span>
                  <span className="font-mono text-base font-bold text-[#8C6D1F]">
                    {Math.round(forecast.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="border border-basil/40 bg-basil/5 p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-basil/20 text-basil flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheckIcon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-basil">
                        ARIMA Time-Series Model Active
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-basil/20 text-basil font-semibold">
                        {forecast.confidence.toUpperCase()} CONFIDENCE
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                      {forecast.notes} Captures weekly institutional periodicity and category consumption trends.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-mono text-ink-soft block">Confidence Index</span>
                  <span className="font-mono text-base font-bold text-basil">
                    {Math.round(forecast.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Ledger-Strip Metrics View (Design PRD Section 5.2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-line bg-ledger-surface rounded-md">
                <div className="text-[11px] uppercase tracking-wider text-ink-soft font-mono">
                  7-Day Expected Demand
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-ink">
                  {forecast.total_predicted_demand.toLocaleString()}{" "}
                  <span className="text-xs font-sans text-ink-soft font-normal">kg</span>
                </div>
                <div className="text-[11px] text-ink-soft mt-1 font-sans">
                  Forecasted consumption across planned meals
                </div>
              </div>

              <div className="p-4 border border-line bg-ledger-surface rounded-md">
                <div className="text-[11px] uppercase tracking-wider text-ink-soft font-mono">
                  Projected Surplus Risk
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-saffron">
                  {forecast.total_projected_surplus_risk.toLocaleString()}{" "}
                  <span className="text-xs font-sans text-ink-soft font-normal">kg</span>
                </div>
                <div className="text-[11px] text-ink-soft mt-1 font-sans">
                  Estimated buffer to flag early for redistribution
                </div>
              </div>

              <div className="p-4 border border-line bg-ledger-surface rounded-md">
                <div className="text-[11px] uppercase tracking-wider text-ink-soft font-mono">
                  Waste Prevention Target
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-basil">
                  {Math.round(
                    (1 -
                      forecast.total_projected_surplus_risk /
                        Math.max(1, forecast.total_predicted_demand)) *
                      100
                  )}%
                </div>
                <div className="text-[11px] text-ink-soft mt-1 font-sans">
                  Efficiency with calibrated prep targets
                </div>
              </div>

              <div className="p-4 border border-line bg-ledger-surface rounded-md">
                <div className="text-[11px] uppercase tracking-wider text-ink-soft font-mono">
                  Forecasting Engine
                </div>
                <div className="mt-2 font-mono text-lg font-bold text-ink truncate">
                  {forecast.model_used === "arima_time_series"
                    ? "ARIMA(1,0,1)"
                    : "Rolling Baseline"}
                </div>
                <div className="text-[11px] text-ink-soft mt-1 font-sans">
                  {forecast.data_points_count} sample days recorded
                </div>
              </div>
            </div>

            {/* Time-Series Forecast Chart with Saffron Confidence Envelope */}
            <div className="border border-line bg-ledger-surface p-5 rounded-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink">
                    Demand Trajectory & Confidence Envelope
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Projected daily consumption (kg) with 90% confidence bands in Saffron
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-ink inline-block" />
                    <span className="text-ink">Predicted Demand</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2 bg-saffron/30 border border-saffron/60 inline-block" />
                    <span className="text-ink-soft">Confidence Band</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-clay-rust inline-block border-dashed" />
                    <span className="text-ink-soft">Surplus Risk</span>
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
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        borderColor: "#D3CBBF",
                        fontSize: "12px",
                        fontFamily: "var(--font-plex-sans)",
                        borderRadius: "4px",
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

            {/* Daily Predictions Ledger Table */}
            <div className="border border-line bg-ledger-surface rounded-md overflow-hidden">
              <div className="p-4 border-b border-line bg-ledger-paper flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-sm text-ink">
                    7-Day Production Schedule & Batch Targets
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Calibrated batch sizes to prevent post-service waste
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-ledger-paper text-[11px] uppercase tracking-wider text-ink-soft">
                      <th className="py-2.5 px-4 font-sans">Date</th>
                      <th className="py-2.5 px-4 font-sans">Day</th>
                      <th className="py-2.5 px-4 font-mono text-right">Predicted Demand</th>
                      <th className="py-2.5 px-4 font-mono text-right">Confidence Band</th>
                      <th className="py-2.5 px-4 font-mono text-right">Projected Surplus Risk</th>
                      <th className="py-2.5 px-4 font-sans text-right">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-xs font-sans">
                    {forecast.predictions.map((p) => (
                      <tr key={p.date} className="hover:bg-black/5 transition-colors">
                        <td className="py-3 px-4 font-mono text-ink-soft">{p.date}</td>
                        <td className="py-3 px-4 font-medium text-ink">{p.day_name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-ink text-right">
                          {p.predicted_demand} kg
                        </td>
                        <td className="py-3 px-4 font-mono text-ink-soft text-right">
                          <span className="text-saffron font-medium">{p.lower_bound}</span>
                          {" – "}
                          <span className="text-saffron font-medium">{p.upper_bound} kg</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-clay-rust font-medium text-right">
                          {p.projected_surplus_risk} kg
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-basil/15 text-basil">
                            Cap prep at {p.predicted_demand + 3}kg
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Breakdown Table */}
            {forecast.categories && forecast.categories.length > 0 && (
              <div className="border border-line bg-ledger-surface rounded-md overflow-hidden">
                <div className="p-4 border-b border-line bg-ledger-paper">
                  <h3 className="font-serif font-bold text-sm text-ink">
                    Category Production Recommendations
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Targeted preparation limits based on category shelf-life and consumption volatility
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-ledger-paper text-[11px] uppercase tracking-wider text-ink-soft">
                        <th className="py-2.5 px-4 font-sans">Category</th>
                        <th className="py-2.5 px-4 font-mono text-right">Expected Demand</th>
                        <th className="py-2.5 px-4 font-mono text-right">Recommended Prep</th>
                        <th className="py-2.5 px-4 font-mono text-right">Surplus Risk</th>
                        <th className="py-2.5 px-4 font-sans text-right">Redistribution Strategy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-xs font-sans">
                      {forecast.categories.map((c) => (
                        <tr key={c.category} className="hover:bg-black/5 transition-colors">
                          <td className="py-3 px-4 font-medium text-ink capitalize">
                            {c.category.replace("_", " ")}
                          </td>
                          <td className="py-3 px-4 font-mono text-ink text-right font-semibold">
                            {c.predicted_demand} kg
                          </td>
                          <td className="py-3 px-4 font-mono text-basil text-right font-semibold">
                            {c.recommended_prep} kg
                          </td>
                          <td className="py-3 px-4 font-mono text-saffron text-right">
                            {c.surplus_risk} kg
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-[11px] text-ink-soft">
                              {c.category === "cooked_food"
                                ? "Auto-flag 2h before meal service ends"
                                : "Check best-before date on intake"}
                            </span>
                          </td>
                        </tr>
                      ))}
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
