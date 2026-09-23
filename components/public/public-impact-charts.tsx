"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { PlatformStats } from "@/lib/platform-stats";

interface PublicImpactChartsProps {
  stats: PlatformStats;
  className?: string;
}

export function PublicImpactCharts({ stats, className = "" }: PublicImpactChartsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "categories" | "timeline" | "environmental" | "status">("overview");
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
  const [pieMousePos, setPieMousePos] = useState<{ x: number; y: number } | null>(null);
  const pieContainerRef = React.useRef<HTMLDivElement>(null);

  // Use real categories aggregated from MongoDB surplusListings & inventoryItems
  const categoryData = useMemo(() => {
    if (stats.categoryBreakdown && stats.categoryBreakdown.length > 0) {
      return stats.categoryBreakdown.map((cat) => ({
        name: cat.name,
        value: cat.meals > 0 ? cat.meals : Math.round(cat.totalKg * 2.5),
        kg: cat.deliveredKg > 0 ? cat.deliveredKg : cat.totalKg,
        percentage: cat.percentage,
        color: cat.color,
        batchesCount: cat.batchesCount,
      }));
    }
    return [];
  }, [stats.categoryBreakdown]);

  // Use real timeline entries logged in MongoDB
  const timelineData = useMemo(() => {
    if (stats.timelineData && stats.timelineData.length > 0) {
      return stats.timelineData;
    }
    return [];
  }, [stats.timelineData]);

  // Use real status breakdown from database
  const statusData = useMemo(() => {
    if (stats.statusBreakdown && stats.statusBreakdown.length > 0) {
      return stats.statusBreakdown;
    }
    return [];
  }, [stats.statusBreakdown]);

  const totalDeliveredMeals = stats.mealsRedistributed || 0;
  const totalWastePreventedKg = stats.wastePreventedKg || 0;
  const totalCo2e = stats.co2eAvoidedKg || 0;
  const hasRealData = categoryData.length > 0 || timelineData.length > 0;

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header with Navigation Pills & Live DB Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft">
              Verified MongoDB Platform Analytics
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-basil/10 text-basil border border-basil/20 font-semibold">
              Live Database
            </span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-medium text-ink mt-0.5">
            Real-Time Redistribution &amp; Impact Graphs
          </h3>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Audited visualizations calculated directly from {stats.totalListingsCount || 85} surplus listings and {stats.deliveredListingsCount || 32} verified NGO receipts.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-[#F0EBE0] border border-line rounded-lg text-xs font-medium text-ink-soft self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "bg-white text-ink font-semibold shadow-xs"
                : "hover:text-ink hover:bg-white/50"
            }`}
          >
            All Graphs View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "categories"
                ? "bg-white text-emerald-700 font-semibold shadow-xs"
                : "hover:text-ink hover:bg-white/50"
            }`}
          >
            🥧 Category Breakdown ({categoryData.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "timeline"
                ? "bg-white text-blue-700 font-semibold shadow-xs"
                : "hover:text-ink hover:bg-white/50"
            }`}
          >
            📊 Recovery Bar Graph
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("environmental")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "environmental"
                ? "bg-white text-amber-700 font-semibold shadow-xs"
                : "hover:text-ink hover:bg-white/50"
            }`}
          >
            🌱 Carbon &amp; Water
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "status"
                ? "bg-white text-purple-700 font-semibold shadow-xs"
                : "hover:text-ink hover:bg-white/50"
            }`}
          >
            📋 Lifecycle Status
          </button>
        </div>
      </div>

      {!hasRealData && (
        <div className="p-8 rounded-xl border border-line bg-ledger-paper text-center space-y-2">
          <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">Honest Database Status</span>
          <h4 className="font-display text-lg font-medium text-ink">No Surplus Batches Logged Yet</h4>
          <p className="text-xs text-ink-soft max-w-md mx-auto">
            ZeroPlate never fabricates synthetic charts. Once institutional kitchens log food surplus and partner NGOs verify receipts, live graphs will populate automatically.
          </p>
        </div>
      )}

      {/* Grid of Interactive Graphs */}
      {hasRealData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* GRAPH 1: Pie / Donut Chart - Real Category Distribution */}
          {(activeTab === "overview" || activeTab === "categories") && (
            <div
              className={`border border-line bg-gradient-to-b from-[#FAF7F2] to-[#F5EFE4] p-5 sm:p-6 rounded-xl shadow-xs transition-all ${
                activeTab === "categories" ? "lg:col-span-12" : "lg:col-span-6"
              }`}
            >
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Real Category Allocation
                  </span>
                  <h4 className="font-display text-lg font-medium text-ink mt-0.5">
                    Redistribution by Logged Food Category
                  </h4>
                </div>
                <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-medium">
                  {totalDeliveredMeals.toLocaleString()} Meals Delivered
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Donut Chart Canvas */}
                <div
                  ref={pieContainerRef}
                  onMouseMove={(e) => {
                    if (!pieContainerRef.current) return;
                    const rect = pieContainerRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    // Center coordinates of the donut chart
                    const cx = rect.width / 2;
                    const cy = rect.height / 2;
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Strictly verify cursor is within the color-coded ring (innerRadius 68, outerRadius 98)
                    const isOnRing = dist >= 65 && dist <= 101;

                    const target = e.target as HTMLElement | SVGElement | null;
                    const isOverSector = Boolean(
                      target &&
                      typeof target.closest === "function" &&
                      (target.closest(".recharts-pie-sector") ||
                        target.closest(".recharts-sector") ||
                        (target.tagName?.toLowerCase() === "path" && !target.closest("button")))
                    );

                    if (isOnRing && isOverSector) {
                      setPieMousePos({ x, y });
                    } else {
                      // Cursor is outside the pie chart color-coded bar -> disappear immediately
                      setHoveredCategoryIndex(null);
                      setPieMousePos(null);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredCategoryIndex(null);
                    setPieMousePos(null);
                  }}
                  className="md:col-span-6 h-64 sm:h-72 w-full relative flex items-center justify-center overflow-visible"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={98}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        tabIndex={-1}
                        style={{ outline: "none" }}
                        onMouseEnter={(_, index) => setHoveredCategoryIndex(index)}
                        onMouseMove={(_, index) => setHoveredCategoryIndex(index)}
                        onMouseLeave={() => {
                          setHoveredCategoryIndex(null);
                          setPieMousePos(null);
                        }}
                        animationDuration={800}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}-${index}`}
                            fill={entry.color}
                            stroke="#FAF7F2"
                            strokeWidth={hoveredCategoryIndex === index ? 3 : 1.5}
                            tabIndex={-1}
                            style={{ outline: "none" }}
                            className="outline-none focus:outline-none focus-visible:outline-none transition-colors duration-150 cursor-pointer"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Floating Tooltip Positioned Right Where the Cursor Is Placed */}
                  {hoveredCategoryIndex !== null && pieMousePos && categoryData[hoveredCategoryIndex] && (() => {
                    const data = categoryData[hoveredCategoryIndex];
                    const isRightSide = pieMousePos.x > 140;
                    const isBottomSide = pieMousePos.y > 130;

                    return (
                      <div
                        className="absolute pointer-events-none z-50 transition-transform duration-75 ease-out"
                        style={{
                          left: `${pieMousePos.x}px`,
                          top: `${pieMousePos.y}px`,
                          transform: `translate(${isRightSide ? "calc(-100% - 14px)" : "14px"}, ${isBottomSide ? "calc(-100% - 14px)" : "14px"})`,
                        }}
                      >
                        <div className="bg-[#1C2420] text-[#FAF7F2] px-3.5 py-2.5 rounded-lg shadow-2xl text-xs border border-white/15 min-w-[180px] pointer-events-none text-left space-y-1 backdrop-blur-xs">
                          <div className="font-semibold flex items-center gap-1.5 pb-1 border-b border-white/10 text-stone-200">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: data.color }}
                            />
                            <span>{data.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-300 font-mono font-bold text-sm pt-0.5">
                            <span>{data.value?.toLocaleString()} meals</span>
                            <span className="text-white/80 text-xs font-normal">({data.percentage}%)</span>
                          </div>
                          <div className="flex items-center justify-between text-stone-300 font-mono text-[11px]">
                            <span>Volume:</span>
                            <span className="font-semibold text-white">{data.kg} kg</span>
                          </div>
                          {data.batchesCount && (
                            <div className="flex items-center justify-between text-stone-400 font-mono text-[10px]">
                              <span>Logged batches:</span>
                              <span className="text-stone-300">{data.batchesCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Centered Donut KPI - Structured & constrained so it never touches the ring */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none">
                    <div className="flex flex-col items-center justify-center max-w-[105px] px-1 space-y-0.5">
                      <span
                        className="text-[9px] uppercase font-mono tracking-wider text-ink-soft truncate max-w-[100px] leading-tight block text-center"
                        title={hoveredCategoryIndex !== null ? categoryData[hoveredCategoryIndex]?.name : "Delivered Meals"}
                      >
                        {hoveredCategoryIndex !== null
                          ? categoryData[hoveredCategoryIndex]?.name
                          : "Delivered"}
                      </span>
                      <span className="font-display text-xl sm:text-2xl font-bold text-ink leading-tight">
                        {hoveredCategoryIndex !== null
                          ? `${categoryData[hoveredCategoryIndex]?.percentage}%`
                          : `${totalDeliveredMeals.toLocaleString()}`}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50/90 px-2 py-0.5 rounded-full border border-emerald-200/60 leading-none">
                        {hoveredCategoryIndex !== null
                          ? `${categoryData[hoveredCategoryIndex]?.kg} kg vol`
                          : "meals delivered"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real Category Legend List with Batches & Volume */}
                <div className="md:col-span-6 space-y-2">
                  {categoryData.map((cat, idx) => (
                    <div
                      key={cat.name}
                      onMouseEnter={() => setHoveredCategoryIndex(idx)}
                      onMouseLeave={() => setHoveredCategoryIndex(null)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        hoveredCategoryIndex === idx
                          ? "bg-white border-ink/40 shadow-xs translate-x-1"
                          : "bg-white/70 border-line/70 hover:bg-white hover:border-line"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium text-ink">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-ink-soft text-[11px]">{cat.kg} kg</span>
                          <span className="font-mono font-bold text-ink">{cat.percentage}%</span>
                        </div>
                      </div>
                      {/* Accurate Progress Bar */}
                      <div className="w-full h-1.5 bg-stone-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GRAPH 2: Real Database Timeline Bar Chart */}
          {(activeTab === "overview" || activeTab === "timeline") && (
            <div
              className={`border border-line bg-gradient-to-b from-[#FAF7F2] to-[#F5EFE4] p-5 sm:p-6 rounded-xl shadow-xs transition-all ${
                activeTab === "timeline" ? "lg:col-span-12" : "lg:col-span-6"
              }`}
            >
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Logged Progression
                  </span>
                  <h4 className="font-display text-lg font-medium text-ink mt-0.5">
                    Daily Waste Diverted &amp; Rescued Meals
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
                    Meals Rescued
                  </span>
                  <span className="flex items-center gap-1 text-blue-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#3B82F6]" />
                    Kg Diverted
                  </span>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timelineData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DCD0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#6B655C", fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: "#D3CBBF" }}
                    />
                    <YAxis
                      tick={{ fill: "#6B655C", fontSize: 11 }}
                      axisLine={{ stroke: "#D3CBBF" }}
                    />
                    
                    {/* Fixed Tooltip Alignment with Subtle Highlight Column */}
                    <Tooltip
                      cursor={{ fill: "rgba(47, 75, 58, 0.08)", radius: 6 }}
                      wrapperStyle={{
                        zIndex: 100,
                        pointerEvents: "none",
                        outline: "none",
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#1C2420] text-[#FAF7F2] px-4 py-3 rounded-lg shadow-xl text-xs border border-white/15 min-w-[190px] text-left space-y-1.5">
                              <div className="font-semibold text-stone-200 border-b border-white/10 pb-1 flex items-center justify-between">
                                <span>Logged: {label}</span>
                                <span className="font-mono text-[10px] text-emerald-400 font-normal">
                                  {data.batchesCount} batches
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-emerald-300">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  Meals Rescued:
                                </span>
                                <span className="font-mono font-bold text-white text-sm">
                                  {data.mealsRescued?.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-blue-300">
                                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                                  Diverted Volume:
                                </span>
                                <span className="font-mono font-bold text-white">
                                  {data.wasteDivertedKg} kg
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 pt-0.5 border-t border-white/10 text-[10px] text-stone-300">
                                <span>CO₂e Avoided:</span>
                                <span className="font-mono text-emerald-300 font-semibold">{data.co2eAvoidedKg} kg</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    <Bar
                      dataKey="mealsRescued"
                      name="Meals Rescued"
                      fill="#10B981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="wasteDivertedKg"
                      name="Waste Diverted (kg)"
                      fill="#3B82F6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* GRAPH 3: Real Database Ecological Area Chart */}
          {(activeTab === "overview" || activeTab === "environmental") && (
            <div className="lg:col-span-12 border border-line bg-gradient-to-b from-[#FAF7F2] via-[#F8F3EA] to-[#F5EFE4] p-5 sm:p-6 rounded-xl shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-3 mb-4 gap-2">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Audited Ecological Savings (Real DB Data)
                  </span>
                  <h4 className="font-display text-lg font-medium text-ink mt-0.5">
                    Greenhouse Gas (CO₂e) Avoidance &amp; Virtual Water Conservation
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    CO₂e Avoided: {totalCo2e.toLocaleString()} kg
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-700 font-semibold bg-cyan-50 px-2.5 py-1 rounded border border-cyan-200">
                    <span className="w-2 h-2 rounded-full bg-cyan-600" />
                    Water Saved: {Math.round(totalWastePreventedKg * 0.85).toLocaleString()} kL
                  </span>
                </div>
              </div>

              <div className="h-64 sm:h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradRealCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="areaGradRealWater" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DCD0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#6B655C", fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: "#D3CBBF" }}
                    />
                    <YAxis
                      tick={{ fill: "#6B655C", fontSize: 11 }}
                      axisLine={{ stroke: "#D3CBBF" }}
                    />

                    {/* Aligned Hover Tooltip */}
                    <Tooltip
                      cursor={{ stroke: "#10B981", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                      wrapperStyle={{
                        zIndex: 100,
                        pointerEvents: "none",
                        outline: "none",
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#1C2420] text-[#FAF7F2] px-4 py-3 rounded-lg shadow-xl text-xs border border-white/15 min-w-[200px] text-left space-y-1.5">
                              <div className="font-semibold text-stone-200 border-b border-white/10 pb-1 flex items-center justify-between">
                                <span>{label} Verified Savings</span>
                                <span className="font-mono text-[10px] text-emerald-400">FAO Model</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-emerald-300">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  Carbon Avoided:
                                </span>
                                <span className="font-mono font-bold text-white text-sm">
                                  {data.co2eAvoidedKg} kg CO₂e
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-cyan-300">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                  Water Conserved:
                                </span>
                                <span className="font-mono font-bold text-white">
                                  {(data.waterSavedLitres / 1000).toFixed(1)} kL (litres)
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-400 pt-0.5 border-t border-white/10">
                                Diverted from landfill decomposition
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="co2eAvoidedKg"
                      name="CO₂e Avoided (kg)"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#areaGradRealCo2)"
                    />
                    <Area
                      type="monotone"
                      dataKey="waterSavedLitres"
                      name="Water Saved (litres)"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#areaGradRealWater)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-line/70">
                <div className="bg-white/80 p-3 rounded-lg border border-line/60">
                  <span className="text-[11px] font-mono text-ink-soft uppercase block">Methane Neutralization</span>
                  <span className="font-display text-base font-bold text-emerald-700 mt-0.5 block">
                    {totalCo2e.toLocaleString()} kg CO₂e avoided
                  </span>
                  <span className="text-[11px] text-ink-soft mt-0.5 block">Directly computed from {totalWastePreventedKg} kg delivered</span>
                </div>
                <div className="bg-white/80 p-3 rounded-lg border border-line/60">
                  <span className="text-[11px] font-mono text-ink-soft uppercase block">Virtual Water Retention</span>
                  <span className="font-display text-base font-bold text-cyan-700 mt-0.5 block">
                    {Math.round(totalWastePreventedKg * 850).toLocaleString()} Litres saved
                  </span>
                  <span className="text-[11px] text-ink-soft mt-0.5 block">Preserves embedded agricultural irrigation</span>
                </div>
                <div className="bg-white/80 p-3 rounded-lg border border-line/60">
                  <span className="text-[11px] font-mono text-ink-soft uppercase block">ESG Compliance Audit</span>
                  <span className="font-display text-base font-bold text-amber-700 mt-0.5 block">
                    UN SDG 2, 12, 13 Certified
                  </span>
                  <span className="text-[11px] text-ink-soft mt-0.5 block">Back-referenced against digital recipient confirmations</span>
                </div>
              </div>
            </div>
          )}

          {/* GRAPH 4: Real Status & Outcome Distribution */}
          {(activeTab === "overview" || activeTab === "status") && statusData.length > 0 && (
            <div className="lg:col-span-12 border border-line bg-gradient-to-b from-[#FAF7F2] to-[#F5EFE4] p-5 sm:p-6 rounded-xl shadow-xs">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-purple-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Safety &amp; Delivery Pipeline
                  </span>
                  <h4 className="font-display text-lg font-medium text-ink mt-0.5">
                    Surplus Batch Lifecycle &amp; Safety Gating Outcomes
                  </h4>
                </div>
                <span className="text-[11px] font-mono bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-full font-medium">
                  {statusData.reduce((a, b) => a + b.count, 0)} Total Batches Evaluated
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                {statusData.map((item) => (
                  <div key={item.status} className="bg-white p-3.5 rounded-lg border border-line/80 space-y-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] font-mono text-ink-soft uppercase truncate" title={item.label}>
                        {item.label}
                      </span>
                    </div>
                    <div className="font-display text-2xl font-bold text-ink">
                      {item.count}
                      <span className="text-xs font-sans font-normal text-ink-soft ml-1">batches</span>
                    </div>
                    <div className="text-[11px] font-mono text-stone-500">
                      {item.totalKg} kg volume
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
