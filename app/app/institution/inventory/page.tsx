"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  Layers,
  ArrowUpRight,
  Info,
  Calendar,
} from "lucide-react";
import { CrateIcon, TicketIcon } from "@/components/icons/ledger-icons";

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  preparedOrReceivedAt: string;
  expiryEstimateAt: string;
  status:
    | "in_stock"
    | "surplus"
    | "listed"
    | "in_progress"
    | "claimed"
    | "delivered"
    | "expired";
  createdAt: string;
  expiryStatus?: {
    isExpired: boolean;
    isNearingExpiry: boolean;
    hoursRemaining: number;
    thresholdHours: number;
  };
  linkedListing?: {
    id: string;
    status: string;
    deliveredAt?: string;
    claimedByNgoName?: string;
  };
}

export default function InstitutionInventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Add Item Dialog State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  // Form State
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("cooked_food");
  const [quantity, setQuantity] = React.useState("");
  const [unit, setUnit] = React.useState("kg");
  const [prepTimeHoursAgo, setPrepTimeHoursAgo] = React.useState("1");
  const [expiryHoursFromNow, setExpiryHoursFromNow] = React.useState("3");

  const fetchInventory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/inventory");
      const json = await res.json();
      if (res.ok) {
        setItems(json.items || []);
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setSubmitting(true);

    try {
      const now = new Date();
      const prepDate = new Date(
        now.getTime() - Number(prepTimeHoursAgo) * 60 * 60 * 1000
      );
      const expiryDate = new Date(
        now.getTime() + Number(expiryHoursFromNow) * 60 * 60 * 1000
      );

      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          quantity: Number(quantity),
          unit,
          preparedOrReceivedAt: prepDate.toISOString(),
          expiryEstimateAt: expiryDate.toISOString(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setAddError(json.error || "Failed to add inventory item.");
        setSubmitting(false);
        return;
      }

      // Reset form and reload list
      setName("");
      setQuantity("");
      setCategory("cooked_food");
      setUnit("kg");
      setIsAddOpen(false);
      fetchInventory();
    } catch (err: unknown) {
      setAddError(
        err instanceof Error ? err.message : "Error creating item."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (newCat === "cooked_food" || newCat === "raw_produce") {
      setUnit("kg");
    } else if (newCat === "dairy") {
      setUnit("L");
    } else if (newCat === "packaged" || newCat === "bakery") {
      setUnit("pcs");
    }
  };

  const handleMarkSurplus = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "surplus" }),
      });
      if (res.ok) {
        fetchInventory();
      }
    } catch (err) {
      console.error("Failed to mark surplus:", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to remove this item from the ledger?"))
      return;
    try {
      const res = await fetch(`/api/v1/inventory/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchInventory();
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  // Metrics calculation for top KPI cards
  const totalInStock = items.filter(
    (i) => i.status === "in_stock" && !i.expiryStatus?.isExpired
  );
  const totalInStockKg = totalInStock.reduce((acc, i) => acc + (i.quantity || 0), 0);

  const nearingExpiryCount = items.filter(
    (i) =>
      i.expiryStatus?.isNearingExpiry &&
      i.status !== "delivered" &&
      i.status !== "expired"
  ).length;

  const surplusOrRedistributingCount = items.filter(
    (i) =>
      i.status === "surplus" ||
      i.status === "listed" ||
      i.status === "in_progress" ||
      i.status === "claimed" ||
      (i.linkedListing &&
        ["pending", "claimed", "matched"].includes(i.linkedListing.status))
  ).length;

  const deliveredCount = items.filter(
    (i) =>
      i.status === "delivered" ||
      i.linkedListing?.status === "delivered"
  ).length;

  // Categories config with live item counters
  const categories = [
    { id: "all", label: "All Items", count: items.length },
    {
      id: "cooked_food",
      label: "Cooked Food",
      count: items.filter((i) => i.category === "cooked_food").length,
    },
    {
      id: "dairy",
      label: "Dairy",
      count: items.filter((i) => i.category === "dairy").length,
    },
    {
      id: "bakery",
      label: "Bakery",
      count: items.filter((i) => i.category === "bakery").length,
    },
    {
      id: "raw_produce",
      label: "Raw Produce",
      count: items.filter((i) => i.category === "raw_produce").length,
    },
    {
      id: "packaged",
      label: "Packaged",
      count: items.filter((i) => i.category === "packaged").length,
    },
  ];

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Operations Title & Fast Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Inventory &amp; Expiry Control
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Expiry Tracking
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Real-time kitchen inventory ledger, automated shelf-life countdowns, and instant surplus redistribution gating.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              {items.length} Total Ledger Batches
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              FSSAI 4-Hour Cooked Gating
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <Link
            href="/app/institution/forecast"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>AI Demand Forecast</span>
          </Link>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>+ Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Vibrant Theme KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emerald Theme - In Stock & Verified Safe */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
              In Stock &amp; Safe
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-baseline gap-1.5">
            {totalInStock.length}
            <span className="text-xs font-sans font-medium text-emerald-700">batches</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              ~{Math.round(totalInStockKg)} kg available
            </span>
            <span className="text-[11px] text-stone-500">active</span>
          </div>
        </div>

        {/* Card 2: Amber Theme - Nearing Expiry Window */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
              Nearing Expiry (&lt;2h)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
            {nearingExpiryCount}
            <span className="text-xs font-sans font-medium text-amber-800">urgent</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
              {nearingExpiryCount > 0 ? "Flag for NGO pickup" : "All batches safe"}
            </span>
          </div>
        </div>

        {/* Card 3: Blue Theme - In Redistribution */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
              Surplus &amp; In Transit
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
            {surplusOrRedistributingCount}
            <span className="text-xs font-sans font-medium text-blue-700">active</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
              Live matching
            </span>
            <span className="text-[11px] text-stone-500">with NGOs</span>
          </div>
        </div>

        {/* Card 4: Violet Theme - Delivered & Preserved */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
              Successfully Saved
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
            {deliveredCount}
            <span className="text-xs font-sans font-medium text-purple-700">batches</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
              Zero Waste
            </span>
            <span className="text-[11px] text-stone-500">redistributed</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Category Filter Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white border border-stone-200/90 p-2.5 rounded-2xl shadow-xs">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-emerald-700 text-white font-semibold shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-emerald-800 text-emerald-100 font-bold"
                      : "bg-stone-200/80 text-stone-600"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <div className="relative shrink-0 w-full lg:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item name..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50/70 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Dense Modern Ledger Table */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Loading active kitchen inventory ledger...
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="border border-stone-200 bg-white p-12 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200/80 mx-auto flex items-center justify-center text-stone-500 shadow-2xs">
            <CrateIcon size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              No inventory batches found
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No items match "${searchQuery}". Try clearing your search query.`
                : "Log prepared kitchen batches or ingredients to start tracking live shelf-life windows and automated surplus gating."}
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-100" />
            <span>+ Add inventory item now</span>
          </button>
        </div>
      ) : (
        <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Active Kitchen Ledger ({filteredItems.length})
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Audited stock with automated time-decay and surplus redistribution gates
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Real-Time Status</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-50/80 text-[11px] uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4 font-sans font-semibold">Item Name</th>
                  <th className="py-3 px-4 font-sans font-semibold">Category</th>
                  <th className="py-3 px-4 font-mono text-right font-semibold">Quantity</th>
                  <th className="py-3 px-4 font-sans font-semibold">Prepared / Logged</th>
                  <th className="py-3 px-4 font-sans font-semibold">Expiry Window</th>
                  <th className="py-3 px-4 font-sans font-semibold">Safety Status</th>
                  <th className="py-3 px-4 font-sans text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs font-sans">
                {filteredItems.map((item) => {
                  const exp = item.expiryStatus;
                  const isNearing = exp?.isNearingExpiry;
                  const isDelivered =
                    item.status === "delivered" ||
                    item.linkedListing?.status === "delivered";
                  const isInProgress =
                    !isDelivered &&
                    (item.status === "in_progress" ||
                      item.status === "claimed" ||
                      item.status === "listed" ||
                      item.status === "surplus" ||
                      item.linkedListing?.status === "claimed" ||
                      item.linkedListing?.status === "matched" ||
                      item.linkedListing?.status === "pending");
                  const isExp =
                    !isDelivered &&
                    !isInProgress &&
                    (item.status === "expired" || exp?.isExpired);

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-stone-50/90 transition-colors ${
                        isNearing && !isDelivered && !isInProgress
                          ? "bg-amber-50/40"
                          : ""
                      }`}
                    >
                      {/* 1. Item Name */}
                      <td className="py-3 px-4 font-medium text-stone-900">
                        <div className="flex items-center gap-2">
                          {isNearing && !isDelivered && !isInProgress ? (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping"
                              title="Nearing Expiry (Action Needed)"
                            />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          <span className="font-semibold text-stone-900">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td className="py-3 px-4 text-stone-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200 capitalize">
                          {item.category.replace("_", " ")}
                        </span>
                      </td>

                      {/* 3. Quantity */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-stone-900">
                        {item.quantity}{" "}
                        <span className="text-xs font-sans font-normal text-stone-500">
                          {item.unit}
                        </span>
                      </td>

                      {/* 4. Prepared / Logged */}
                      <td className="py-3 px-4 font-mono text-xs text-stone-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            {new Date(item.preparedOrReceivedAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* 5. Expiry Window */}
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {isDelivered ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Safely Delivered
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                            Redistribution Active
                          </span>
                        ) : isExp ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Expired
                          </span>
                        ) : isNearing ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            In {exp?.hoursRemaining}h (Urgent)
                          </span>
                        ) : (
                          <span className="font-mono text-stone-600">
                            In {exp?.hoursRemaining}h remaining
                          </span>
                        )}
                      </td>

                      {/* 6. Safety Status Badge */}
                      <td className="py-3 px-4">
                        {isDelivered ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Delivered
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            In Progress
                          </span>
                        ) : isExp ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Expired
                          </span>
                        ) : isNearing ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Nearing Expiry
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Verified Safe
                          </span>
                        )}
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "in_stock" &&
                            !isExp &&
                            !isDelivered &&
                            !isInProgress && (
                              <button
                                onClick={() => handleMarkSurplus(item._id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 text-xs font-semibold transition-all cursor-pointer"
                                title="Mark this batch as surplus for NGO redistribution"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Mark Surplus</span>
                              </button>
                            )}

                          {item.status === "surplus" && !isDelivered && (
                            <Link
                              href={`/app/institution/surplus-listings?itemId=${item._id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-semibold shadow-2xs transition-all"
                            >
                              <TicketIcon size={12} className="text-emerald-100" />
                              <span>List Batch</span>
                            </Link>
                          )}

                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from ledger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>
                Batches approaching 2 hours remaining are highlighted in amber for immediate surplus listing.
              </span>
            </div>
            <div className="font-mono text-[11px] text-stone-400">
              ZeroPlate Safety Engine v2.4
            </div>
          </div>
        </div>
      )}

      {/* 5. Modern Add Inventory Item Dialog Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 text-left animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs shrink-0">
                  <Package className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-stone-900">
                    Log Kitchen Inventory Batch
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Record prepared meals or ingredients with automated safety gating
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddItem} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Item / Dish Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Steamed Basmati Rice & Dal Makhani"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Category & Quantity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Food Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                  >
                    <option value="cooked_food">🍲 Cooked Food (4h rule)</option>
                    <option value="dairy">🥛 Dairy Products (12h limit)</option>
                    <option value="bakery">🍞 Bakery &amp; Breads</option>
                    <option value="raw_produce">🥦 Raw Produce / Veg</option>
                    <option value="packaged">📦 Packaged / FMCG</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="45"
                      className="w-full px-3 py-2.5 text-sm font-mono bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                    >
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="pcs">pcs</option>
                      <option value="portions">portions</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Prepared Time & Estimated Shelf Life */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Prepared / Received
                  </label>
                  <select
                    value={prepTimeHoursAgo}
                    onChange={(e) => setPrepTimeHoursAgo(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                  >
                    <option value="0.5">30 minutes ago</option>
                    <option value="1">1 hour ago</option>
                    <option value="2">2 hours ago</option>
                    <option value="3">3 hours ago</option>
                    <option value="5">5 hours ago (Exceeds cooked limit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Shelf-Life Estimate
                  </label>
                  <select
                    value={expiryHoursFromNow}
                    onChange={(e) => setExpiryHoursFromNow(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                  >
                    <option value="1.5">In 1.5 hours (Nearing limit)</option>
                    <option value="3">In 3 hours</option>
                    <option value="6">In 6 hours</option>
                    <option value="24">In 24 hours</option>
                    <option value="48">In 48 hours</option>
                  </select>
                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Rule:</strong> Hot cooked items must be logged within 4 hours of preparation to qualify for instant NGO redistribution.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl border border-stone-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-60 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Logging Batch...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Log to Ledger</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
