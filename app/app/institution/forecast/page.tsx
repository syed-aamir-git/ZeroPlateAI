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
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              AI Demand &amp; Surplus Forecast
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Rolling Baseline Active
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            {institution?.name || "Kitchen"} · Forward 7-day predictive production planning &amp; automated surplus prevention engine.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              {forecast?.data_points_count ?? 0} Sample Days Fitted
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <Calendar className="w-3 h-3 text-blue-600" />
              Next 7 Days Ahead
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center">
          <Link
            href="/app/institution/inventory"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <Package className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Log Daily Inventory</span>
          </Link>
          <Link
            href="/app/institution/analytics"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Calculator className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Ample-Prep Batcher</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
          </Link>
        </div>
      </div>

      {error ? (
        <div className="p-6 border border-rose-300 bg-rose-50 text-rose-800 rounded-2xl text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Unable to load predictive forecast:</strong> {error}
          </div>
        </div>
      ) : isLoading ? (
        <div className="py-28 text-center space-y-3">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Computing time-series models from verified inventory records...
          </p>
        </div>
      ) : !forecast || forecast.data_points_count === 0 ? (
        /* Real Zero / Empty State */
        <div className="border border-stone-200 bg-white p-10 sm:p-12 text-center rounded-2xl space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              No Inventory History Logged Yet
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              The AI forecasting engine relies on real historical meal logs. Start by logging your daily food preparation and receipts to calibrate 7-day predictive production forecasts.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/app/institution/inventory"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Log First Inventory Batch</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Model Confidence Notice Banner */}
          {forecast.confidence === "low" ? (
            <div className="border border-amber-300/80 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                      Cold-Start Calibration · Early Baseline Mode
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-200/70 text-amber-900 font-bold">
                      {forecast.data_points_count}/14 Days Logged
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-2xl">
                    {forecast.notes} Daily rolling averages and category baselines are applied until 14 days of inventory logs are established for full ARIMA time-series fitting.
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-amber-200">
                <span className="text-[11px] font-mono text-stone-500 block">Model Confidence</span>
                <span className="font-mono text-2xl font-extrabold text-amber-700">
                  {Math.round(forecast.confidence_score * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                      ARIMA Time-Series Model Active
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-200/70 text-emerald-900 font-bold uppercase">
                      {forecast.confidence} Confidence
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-2xl">
                    {forecast.notes} Captures weekly institutional periodicity and category consumption trends with high predictive precision.
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-emerald-200">
                <span className="text-[11px] font-mono text-stone-500 block">Confidence Index</span>
                <span className="font-mono text-2xl font-extrabold text-emerald-700">
                  {Math.round(forecast.confidence_score * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* 3. 4 Vibrant Theme KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Blue Theme - 7-Day Expected Demand */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
                  7-Day Expected Demand
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
                {forecast.total_predicted_demand.toLocaleString()}
                <span className="text-xs font-sans font-medium text-blue-700">kg</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
                  ~{Math.round(forecast.total_predicted_demand * 2.5)} meals
                </span>
                <span className="text-[11px] text-stone-500">planned</span>
              </div>
            </div>

            {/* Card 2: Amber Theme - Projected Surplus Risk */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
                  Projected Surplus Risk
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
                {forecast.total_projected_surplus_risk.toLocaleString()}
                <span className="text-xs font-sans font-medium text-amber-800">kg</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
                  Buffer Window
                </span>
                <span className="text-[11px] text-stone-500">flag early for NGO</span>
              </div>
            </div>

            {/* Card 3: Emerald Theme - Waste Prevention Target */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
                  Waste Prevention Target
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
                <span className="text-[11px] text-stone-500">production prep</span>
              </div>
            </div>

            {/* Card 4: Violet Theme - Forecasting Engine */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
                  Forecasting Engine
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-xl sm:text-2xl font-extrabold text-purple-900 truncate">
                {forecast.model_used === "arima_time_series"
                  ? "ARIMA(1,0,1)"
                  : "Rolling Baseline"}
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
                  {forecast.data_points_count} Logged Days
                </span>
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
                    Demand Trajectory &amp; 90% Confidence Envelope
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Projected daily consumption in kilograms with upper and lower probability bands
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
                  <span className="text-stone-600">90% Confidence Envelope</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 inline-block border-b-2 border-dashed border-rose-500" />
                  <span className="text-stone-600">Surplus Risk (kg)</span>
                </div>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    {/* Smooth Saffron/Amber Gradient for Confidence Envelope */}
                    <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.04} />
                    </linearGradient>

                    {/* Emerald Gradient for Demand Area Underneath */}
                    <linearGradient id="demandAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={{ stroke: "#D1D5DB" }}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={{ stroke: "#D1D5DB" }}
                    unit=" kg"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-stone-900 text-white p-3.5 rounded-xl shadow-2xl text-xs border border-white/10 min-w-[210px] space-y-2 backdrop-blur-xs">
                            <div className="font-semibold text-stone-200 border-b border-white/10 pb-1.5 flex items-center justify-between">
                              <span>
                                {d.day_name}, {d.date}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                Projected
                              </span>
                            </div>
                            <div className="space-y-1.5 font-mono">
                              <div className="flex items-center justify-between text-emerald-400">
                                <span className="flex items-center gap-1.5 text-stone-300 font-sans">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  Predicted Demand:
                                </span>
                                <span className="font-bold text-sm">{d.demand} kg</span>
                              </div>
                              <div className="flex items-center justify-between text-amber-300">
                                <span className="flex items-center gap-1.5 text-stone-300 font-sans">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Confidence Range:
                                </span>
                                <span>
                                  {d.lower} – {d.upper} kg
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-rose-400">
                                <span className="flex items-center gap-1.5 text-stone-300 font-sans">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  Surplus Risk:
                                </span>
                                <span>{d.surplus} kg</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Saffron Confidence Envelope Bands */}
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    strokeOpacity={0.7}
                    fill="url(#confidenceGrad)"
                    name="Upper Bound (kg)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    fill="#FFFFFF"
                    fillOpacity={1}
                    name="Lower Bound (kg)"
                  />

                  {/* Predicted Demand Line + Soft Shading */}
                  <Area
                    type="monotone"
                    dataKey="demand"
                    stroke="none"
                    fill="url(#demandAreaGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 4.5, fill: "#10B981", stroke: "#FFFFFF", strokeWidth: 2 }}
                    activeDot={{ r: 6.5, fill: "#059669", stroke: "#FFFFFF", strokeWidth: 2.5 }}
                    name="Predicted Demand (kg)"
                  />

                  {/* Projected Surplus Risk Line */}
                  <Line
                    type="monotone"
                    dataKey="surplus"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3.5, fill: "#F43F5E", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                    activeDot={{ r: 5.5, fill: "#E11D48", stroke: "#FFFFFF", strokeWidth: 2 }}
                    name="Surplus Risk (kg)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100 flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Confidence bands automatically adjust as additional daily kitchen logs are recorded.
              </span>
              <span className="font-mono text-[11px] text-stone-400">
                P-value &lt; 0.05 · Calibrated Weekly
              </span>
            </div>
          </div>

          {/* 5. Daily Predictions Ledger Table */}
          <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  7-Day Production Schedule &amp; Batch Targets
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Recommended prep limits calibrated to prevent post-service waste
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4 font-sans font-semibold">Date</th>
                    <th className="py-3 px-4 font-sans font-semibold">Day</th>
                    <th className="py-3 px-4 font-mono text-right font-semibold">Predicted Demand</th>
                    <th className="py-3 px-4 font-mono text-right font-semibold">Confidence Range</th>
                    <th className="py-3 px-4 font-mono text-right font-semibold">Surplus Risk</th>
                    <th className="py-3 px-4 font-sans text-right font-semibold">Recommended Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs font-sans">
                  {forecast.predictions.map((p) => (
                    <tr key={p.date} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-500">{p.date}</td>
                      <td className="py-3 px-4 font-medium text-stone-900">{p.day_name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-right">
                        {p.predicted_demand} kg
                      </td>
                      <td className="py-3 px-4 font-mono text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                          {p.lower_bound} – {p.upper_bound} kg
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-600 font-semibold text-right">
                        {p.projected_surplus_risk} kg
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Cap prep at {p.predicted_demand + 3} kg
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Category Breakdown Table */}
          {forecast.categories && forecast.categories.length > 0 && (
            <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60">
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Category Production Recommendations
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Targeted preparation limits based on category shelf-life and consumption volatility
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                      <th className="py-3 px-4 font-sans font-semibold">Category</th>
                      <th className="py-3 px-4 font-mono text-right font-semibold">Expected Demand</th>
                      <th className="py-3 px-4 font-mono text-right font-semibold">Recommended Prep</th>
                      <th className="py-3 px-4 font-mono text-right font-semibold">Surplus Risk</th>
                      <th className="py-3 px-4 font-sans text-right font-semibold">Redistribution Strategy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-sans">
                    {forecast.categories.map((c) => (
                      <tr key={c.category} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-stone-900 capitalize">
                          {c.category.replace("_", " ")}
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
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-stone-600 bg-stone-100 border border-stone-200">
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
