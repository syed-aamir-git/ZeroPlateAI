"use client";

import * as React from "react";
import Link from "next/link";
import {
  Utensils,
  Search,
  RefreshCw,
  Truck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Filter,
  ShieldCheck,
  Clock,
} from "lucide-react";

interface FoodItemRecord {
  _id: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  institutionId?: string;
  institutionName: string;
  ngoName: string;
  driver?: {
    name: string;
    vehicleNumber?: string;
    vehicleType?: string;
    phone?: string;
  };
  status: string;
  safetyStatus: string;
  rejectionReason?: string;
  pickupAddress?: string;
  createdAt: string;
}

interface FoodItemsResponse {
  success: boolean;
  metrics: {
    totalItems: number;
    deliveredCount: number;
    activeCount: number;
    totalQuantity: number;
  };
  items: FoodItemRecord[];
}

function formatStatus(status: string, hasDriver: boolean) {
  const s = status.toLowerCase();
  if (s === "delivered" || s === "confirmed") {
    return {
      label: "Safely Delivered",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-600",
    };
  }
  if (s === "in_transit" || s === "picked_up") {
    return {
      label: "In Transit",
      color: "bg-purple-50 text-purple-800 border-purple-200",
      dot: "bg-purple-600 animate-pulse",
    };
  }
  if (s === "accepted" || s === "driver_assigned") {
    return {
      label: "Driver En Route",
      color: "bg-blue-50 text-blue-800 border-blue-200",
      dot: "bg-blue-600",
    };
  }
  if (s === "claimed") {
    return {
      label: hasDriver ? "Driver Assigned" : "Looking for Driver",
      color: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500 animate-pulse",
    };
  }
  if (s === "expired" || s === "rejected") {
    return {
      label: "Expired / Cancelled",
      color: "bg-rose-50 text-rose-800 border-rose-200",
      dot: "bg-rose-600",
    };
  }
  return {
    label: "Available Surplus",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-600",
  };
}

function formatQuantity(qty: number, unit: string, category: string): string {
  const cleanUnit = (unit || "kg").toLowerCase().trim();
  if (cleanUnit === "pcs" || cleanUnit === "pieces") {
    const estimatedPlates = Math.max(1, Math.round(qty / 2));
    return `${qty} pcs (~${estimatedPlates} plates)`;
  }
  if (cleanUnit === "l" || cleanUnit === "litres" || cleanUnit === "liters" || cleanUnit === "liter") {
    return `${qty} L`;
  }
  return `${qty} kg`;
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminFoodItemsPage() {
  const [data, setData] = React.useState<FoodItemsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/food-items");
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load food items.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const items = data?.items || [];

  // Available categories
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  // Filtered items
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = !q || item.foodName.toLowerCase().includes(q);
      const instMatch = !q || item.institutionName.toLowerCase().includes(q);
      const ngoMatch = !q || item.ngoName.toLowerCase().includes(q);
      const driverMatch = !q || (item.driver?.name && item.driver.name.toLowerCase().includes(q));
      const matchesSearch = nameMatch || instMatch || ngoMatch || driverMatch;

      let matchesStatus = true;
      if (statusFilter === "delivered") {
        matchesStatus = item.status === "delivered" || item.status === "confirmed";
      } else if (statusFilter === "active") {
        matchesStatus = item.status !== "delivered" && item.status !== "confirmed" && item.status !== "expired";
      }

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchQuery, statusFilter, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/app/admin/overview"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </Link>
          </div>

          <span className="font-mono-numeral text-xs uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" />
            Food Recovery &amp; Surplus Directory
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
            All Listed Food Items ({items.length})
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Complete real-time record of all surplus food batches, donor facilities, charity recipients, and delivery progress.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="text-xs text-zinc-600 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-xs">
            Total Quantity: <span className="text-emerald-700 font-bold">{data?.metrics.totalQuantity || 0} kg/units</span>
          </div>
          <div className="text-xs text-zinc-600 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-xs">
            Safely Delivered: <span className="text-blue-700 font-bold">{data?.metrics.deliveredCount || 0} batches</span>
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-zinc-600 hover:text-zinc-900 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
            title="Refresh Food Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-900">Failed to load food items</div>
              <div className="text-rose-700 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          {[
            { id: "all", label: `All Items (${items.length})` },
            { id: "delivered", label: `Safely Delivered (${data?.metrics.deliveredCount || 0})` },
            { id: "active", label: `In Transit / Active (${data?.metrics.activeCount || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-white text-zinc-900 font-semibold shadow-xs border border-slate-200/60"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food item, kitchen, charity..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs transition-all"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-zinc-800 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs cursor-pointer font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {formatCategory(c)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-16 text-center space-y-3 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-zinc-500">
            Loading food items directory...
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="border border-slate-200/90 bg-white p-12 rounded-2xl text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-zinc-600">
            <Utensils size={24} />
          </div>
          <h2 className="font-display text-lg font-bold text-zinc-900">
            {items.length === 0 ? "No food items listed yet" : "No food items matching your search"}
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {items.length === 0
              ? "Surplus food donations created by dining halls and commercial kitchens will appear here automatically."
              : "Try adjusting your search query or status filter."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              className="px-3.5 py-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
            >
              Clear search filters
            </button>
          )}
        </div>
      ) : (
        <div className="border border-slate-200/90 bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Food Item &amp; Quantity</th>
                  <th className="px-4 py-3.5">Pickup &amp; Drop-off</th>
                  <th className="px-4 py-3.5">Assigned Courier</th>
                  <th className="px-4 py-3.5">Delivery Status</th>
                  <th className="px-4 py-3.5">Food Safety</th>
                  <th className="px-5 py-3.5 text-right">Listed Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-zinc-700">
                {filteredItems.map((item) => {
                  const statusInfo = formatStatus(item.status, Boolean(item.driver));

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Food Item */}
                      <td className="px-5 py-3.5 font-medium text-zinc-900">
                        <div className="font-bold text-sm text-zinc-900">{item.foodName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-amber-700 font-mono font-bold">
                            {formatQuantity(item.quantity, item.unit, item.category)}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                            · {formatCategory(item.category)}
                          </span>
                        </div>
                      </td>

                      {/* Pickup & Drop-off */}
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-zinc-400">From:</span>
                          <span className="font-semibold text-zinc-900">{item.institutionName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-zinc-400">To:</span>
                          <span className="font-semibold text-emerald-800">{item.ngoName}</span>
                        </div>
                      </td>

                      {/* Courier */}
                      <td className="px-4 py-3.5">
                        {item.driver ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>{item.driver.name}</span>
                              {item.driver.vehicleNumber && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px] border border-amber-300">
                                  {item.driver.vehicleNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 capitalize">
                              {item.driver.vehicleType?.replace("_", " ")} {item.driver.phone ? `· ${item.driver.phone}` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Looking for nearby driver...
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${statusInfo.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Food Safety */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${
                            item.safetyStatus === "verified_safe"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                          {item.safetyStatus === "verified_safe" ? "Verified Safe" : "Safety Flagged"}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-3.5 font-mono text-right text-zinc-500 whitespace-nowrap">
                        <div className="font-medium text-zinc-700">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
