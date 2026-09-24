"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Ticket,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  X,
  MapPin,
  Layers,
  ArrowRight,
  Package,
  Route,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";
import LocationPickerMap from "@/components/maps/location-picker-map";
import { calculatePiecesToPlates, evaluateSurplusUrgency } from "@/lib/surplus-engine";
import ManualMatchmakerModal from "@/components/surplus/manual-matchmaker-modal";
import { HeartHandshake, Utensils } from "lucide-react";

interface SurplusListing {
  _id: string;
  inventoryItemId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  pickupWindow: {
    start: string;
    end: string;
  };
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  safetyStatus: "verified_safe" | "rejected";
  status: "pending" | "matched" | "claimed" | "delivered" | "expired";
  rejectionReason?: string;
  ruleApplied?: string;
  createdAt: string;
}

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
    | "expired"
    | "delivered"
    | "in_progress";
  rawStatus?: string;
}

function SurplusListingsContent() {
  const searchParams = useSearchParams();
  const preselectedItemId = searchParams.get("itemId");

  const [listings, setListings] = React.useState<SurplusListing[]>([]);
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Create Listing Modal
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"select" | "quick_add">("select");
  const [selectedItemId, setSelectedItemId] = React.useState<string>("");
  const [listingQty, setListingQty] = React.useState<string>("");
  const [windowStartHours, setWindowStartHours] = React.useState<string>("0"); // hours from now
  const [windowDurationHours, setWindowDurationHours] = React.useState<string>("2"); // duration
  const [pickupAddress, setPickupAddress] = React.useState<string>("");
  const [pickupCoords, setPickupCoords] = React.useState<{ lat: number; lng: number }>({
    lat: 28.6139,
    lng: 77.209,
  });
  const [storageCondition, setStorageCondition] = React.useState<string>("ambient");
  const [matchmakingListing, setMatchmakingListing] = React.useState<SurplusListing | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Quick Add Form state
  const [quickName, setQuickName] = React.useState("");
  const [quickCategory, setQuickCategory] = React.useState("cooked_food");
  const [quickQuantity, setQuickQuantity] = React.useState("");
  const [quickUnit, setQuickUnit] = React.useState("kg");
  const [quickPrepAgoHours, setQuickPrepAgoHours] = React.useState("0");

  // Safety Gating Alert state
  const [gatingResult, setGatingResult] = React.useState<{
    type: "success" | "rejection" | "error";
    message: string;
    ruleApplied?: string;
  } | null>(null);

  const fetchListings = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/surplus-listings");
      const json = await res.json();
      if (res.ok) {
        setListings(json.listings || []);
      }
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInventory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/inventory");
      const json = await res.json();
      if (res.ok) {
        setInventoryItems(json.items || []);
      }
    } catch (err) {
      console.error("Failed to load inventory for listing creation:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchListings();
    fetchInventory();
  }, [fetchListings, fetchInventory]);

  // Handle URL deep-link with itemId
  React.useEffect(() => {
    if (preselectedItemId && inventoryItems.length > 0) {
      const target = inventoryItems.find((i) => i._id === preselectedItemId);
      if (target) {
        setSelectedItemId(target._id);
        setListingQty(String(target.quantity));
        setIsCreateOpen(true);
        setModalMode("select");
      }
    }
  }, [preselectedItemId, inventoryItems]);

  // Compute items that are eligible for surplus listing
  const availableItems = React.useMemo(() => {
    return inventoryItems.filter((i) => {
      if (i.status === "delivered" || i.status === "expired") return false;
      if (Number(i.quantity) <= 0) return false;
      return (
        i.status === "in_stock" ||
        i.status === "surplus" ||
        i.rawStatus === "surplus" ||
        i.rawStatus === "in_stock" ||
        !i.status
      );
    });
  }, [inventoryItems]);

  // When selected inventory item changes, auto-fill quantity
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = inventoryItems.find((i) => i._id === itemId);
    if (item) {
      setListingQty(String(item.quantity));
    }
  };

  const handleQuickCategoryChange = (newCat: string) => {
    setQuickCategory(newCat);
    if (newCat === "cooked_food" || newCat === "raw_produce") {
      setQuickUnit("kg");
    } else if (newCat === "dairy") {
      setQuickUnit("L");
    } else if (newCat === "packaged" || newCat === "bakery") {
      setQuickUnit("pcs");
    }
  };

  const selectedItem = inventoryItems.find((i) => i._id === selectedItemId);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatingResult(null);
    setSubmitting(true);

    try {
      const now = new Date();
      let targetItemId = selectedItemId;
      let finalQty = Number(listingQty);

      // If in Quick Add mode, first create the inventory item
      if (modalMode === "quick_add") {
        if (!quickName.trim()) {
          setGatingResult({
            type: "error",
            message: "Product / dish name is required.",
          });
          setSubmitting(false);
          return;
        }

        const qtyNum = Number(quickQuantity);
        if (!qtyNum || qtyNum <= 0) {
          setGatingResult({
            type: "error",
            message: "Please enter a valid quantity greater than zero.",
          });
          setSubmitting(false);
          return;
        }

        const prepHoursAgo = Number(quickPrepAgoHours) || 0;
        const prepDate = new Date(now.getTime() - prepHoursAgo * 60 * 60 * 1000);
        // Default shelf life: cooked_food = 4 hours, dairy = 12 hours, bakery = 12 hours, raw_produce = 24 hours, packaged = 48 hours
        const shelfLifeHours =
          quickCategory === "cooked_food"
            ? 4
            : quickCategory === "dairy" || quickCategory === "bakery"
            ? 12
            : quickCategory === "raw_produce"
            ? 24
            : 48;
        const expiryDate = new Date(prepDate.getTime() + shelfLifeHours * 60 * 60 * 1000);

        const invRes = await fetch("/api/v1/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: quickName.trim(),
            category: quickCategory,
            quantity: qtyNum,
            unit: quickUnit,
            preparedOrReceivedAt: prepDate.toISOString(),
            expiryEstimateAt: expiryDate.toISOString(),
          }),
        });

        const invData = await invRes.json();
        if (!invRes.ok || !invData.item?._id) {
          setGatingResult({
            type: "error",
            message: invData.error || "Failed to log new inventory item before listing.",
          });
          setSubmitting(false);
          return;
        }

        targetItemId = invData.item._id;
        finalQty = qtyNum;
      }

      if (!targetItemId) {
        setGatingResult({
          type: "error",
          message: "Please select or enter an inventory item to list.",
        });
        setSubmitting(false);
        return;
      }

      const startTime = new Date(now.getTime() + Number(windowStartHours) * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + Number(windowDurationHours) * 60 * 60 * 1000);

      const res = await fetch("/api/v1/surplus-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: targetItemId,
          quantity: finalQty,
          storageCondition,
          pickupWindow: {
            start: startTime.toISOString(),
            end: endTime.toISOString(),
          },
          pickupLocation: {
            address: pickupAddress.trim() || "Main Kitchen Dispatch Gate",
            lat: pickupCoords.lat,
            lng: pickupCoords.lng,
          },
        }),
      });

      const data = await res.json();

      if (res.status === 422) {
        // Safety Gating Rejection
        setGatingResult({
          type: "rejection",
          message: data.reason || "Safety gating criteria not satisfied.",
          ruleApplied: data.ruleApplied,
        });
        fetchListings(); // refresh to show rejection in ledger
        return;
      }

      if (!res.ok) {
        setGatingResult({
          type: "error",
          message: data.error || "Failed to submit surplus listing.",
        });
        return;
      }

      // 201 Verified Safe
      setGatingResult({
        type: "success",
        message: "Verified Safe to List. Listing published to active NGO redistribution network.",
      });

      // Reset form and reload
      setSelectedItemId("");
      setListingQty("");
      setQuickName("");
      setQuickQuantity("");
      fetchListings();
      fetchInventory();
    } catch (err: unknown) {
      setGatingResult({
        type: "error",
        message: err instanceof Error ? err.message : "Internal error submitting listing.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredListings = listings.filter((l) => {
    const matchesFilter = (() => {
      if (statusFilter === "all") return true;
      if (statusFilter === "verified_safe") return l.safetyStatus === "verified_safe";
      if (statusFilter === "rejected") return l.safetyStatus === "rejected";
      return l.status === statusFilter;
    })();

    const matchesSearch =
      !searchQuery ||
      l.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.pickupLocation?.address || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Sort with 🔴 Critical Red items (<2 hours remaining) pinned to the top
  const sortedListings = React.useMemo(() => {
    return [...filteredListings].sort((a, b) => {
      const urgencyA = evaluateSurplusUrgency({
        category: a.category,
        quantity: a.quantity,
        unit: a.unit,
        expiryDeadline: a.pickupWindow?.end || new Date(),
      });
      const urgencyB = evaluateSurplusUrgency({
        category: b.category,
        quantity: b.quantity,
        unit: b.unit,
        expiryDeadline: b.pickupWindow?.end || new Date(),
      });
      const rank: Record<string, number> = { critical_red: 3, urgent_yellow: 2, safe_green: 1 };
      const diff = (rank[urgencyB.urgencyTier] || 0) - (rank[urgencyA.urgencyTier] || 0);
      if (diff !== 0) return diff;
      return new Date(a.pickupWindow?.end || 0).getTime() - new Date(b.pickupWindow?.end || 0).getTime();
    });
  }, [filteredListings]);

  // Live previews for creation modal
  const effectiveQty = Number(modalMode === "select" ? listingQty : quickQuantity) || 0;
  const effectiveUnit = modalMode === "select" ? (inventoryItems.find((i) => i._id === selectedItemId)?.unit || "kg") : quickUnit;
  const effectiveCategory = modalMode === "select" ? (inventoryItems.find((i) => i._id === selectedItemId)?.category || "cooked_food") : quickCategory;

  const livePlatePreview = React.useMemo(() => {
    if (effectiveQty <= 0) return null;
    return calculatePiecesToPlates(effectiveQty, effectiveUnit, effectiveCategory);
  }, [effectiveQty, effectiveUnit, effectiveCategory]);

  const liveUrgencyPreview = React.useMemo(() => {
    const hours = Number(windowDurationHours) || 2;
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
    return evaluateSurplusUrgency({
      category: effectiveCategory,
      quantity: effectiveQty || 10,
      unit: effectiveUnit,
      expiryDeadline: deadline,
      storageCondition,
    });
  }, [effectiveCategory, effectiveQty, effectiveUnit, windowDurationHours, storageCondition]);

  const verifiedCount = listings.filter((l) => l.safetyStatus === "verified_safe").length;
  const pendingCount = listings.filter((l) => l.status === "pending" && l.safetyStatus !== "rejected").length;
  const claimedCount = listings.filter(
    (l) => (l.status === "claimed" || l.status === "delivered" || l.status === "matched") && l.safetyStatus !== "rejected"
  ).length;
  const rejectedCount = listings.filter((l) => l.safetyStatus === "rejected").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Operations Title & Fast Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Surplus Listings &amp; Safety Gating
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Fail-Closed FSSAI Gating Active
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Publish verified surplus batches for instant NGO claiming with automated time-decay validation and real-time logistics coordination.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              {listings.length} Total Listings Recorded
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <Route className="w-3 h-3 text-blue-600" />
              Real-Time NGO Matching
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              MongoDB Audited
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <Link
            href="/app/institution/inventory"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <Package className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Kitchen Inventory Ledger</span>
          </Link>
          <button
            onClick={() => {
              setGatingResult(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>+ Create Surplus Listing</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Vibrant Theme KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emerald Theme - Verified Safe & Published */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
              Verified Safe
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-baseline gap-1.5">
            {verifiedCount}
            <span className="text-xs font-sans font-medium text-emerald-700">batches</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              Passed FSSAI Gating
            </span>
          </div>
        </div>

        {/* Card 2: Amber Theme - Pending NGO Claims */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
              Pending Claims
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
            {pendingCount}
            <span className="text-xs font-sans font-medium text-amber-800">batches</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
              Live for NGO matching
            </span>
          </div>
        </div>

        {/* Card 3: Blue Theme - Claimed & Delivered */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
              Claimed / Delivered
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
            {claimedCount}
            <span className="text-xs font-sans font-medium text-blue-700">rescued</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
              Zero Waste Impact
            </span>
          </div>
        </div>

        {/* Card 4: Rose Theme - Safety Gated / Blocked */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 border border-rose-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-rose-800 font-mono font-bold">
              Safety Blocked
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-rose-700 flex items-baseline gap-1.5">
            {rejectedCount}
            <span className="text-xs font-sans font-medium text-rose-800">blocked</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100/90 text-rose-900 border border-rose-200">
              Biogas / Compost diverted
            </span>
          </div>
        </div>
      </div>

      {/* 3. Safety Gating Informational Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/90 text-xs text-stone-700 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
        </div>
        <div className="space-y-1">
          <div className="font-semibold text-stone-900 text-sm flex items-center gap-2">
            <span>Server-Side FSSAI Safety Gating Active (Fail-Closed Architecture)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              SECURE
            </span>
          </div>
          <p className="text-stone-600 leading-relaxed max-w-4xl">
            All surplus postings are evaluated against elapsed time and temperature window thresholds prior to being published to NGOs. Cooked meals older than 4 hours or listings with expired pickup windows are strictly rejected. Every evaluation is recorded into the immutable MongoDB audit log for ESG compliance.
          </p>
        </div>
      </div>

      {/* 4. Filter Tabs and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white border border-stone-200/90 p-2.5 rounded-2xl shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Listings", count: listings.length },
            { id: "verified_safe", label: "Verified Safe", count: verifiedCount },
            { id: "pending", label: "Pending Matching", count: pendingCount },
            { id: "claimed", label: "Claimed & Rescued", count: claimedCount },
            { id: "rejected", label: "Safety Blocked", count: rejectedCount },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 text-xs rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-emerald-700 text-white font-semibold shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-emerald-800 text-emerald-100 font-bold"
                      : "bg-stone-200/80 text-stone-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative shrink-0 w-full lg:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search listings..."
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

      {/* 5. Listings Ledger Table */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Loading surplus listings ledger &amp; safety validations...
          </p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="border border-stone-200 bg-white p-12 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200/80 mx-auto flex items-center justify-center text-stone-500 shadow-2xs">
            <Ticket className="w-7 h-7 text-stone-400" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              No surplus listings match this ledger filter
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No listings match "${searchQuery}". Try clearing your search query.`
                : "When you mark items from your inventory as surplus and specify a pickup window, our safety engine validates the food before notifying verified recipient NGOs."}
            </p>
          </div>
          <button
            onClick={() => {
              setGatingResult(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-100" />
            <span>+ Create first surplus listing</span>
          </button>
        </div>
      ) : (
        <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Surplus Redistribution Ledger ({filteredListings.length})
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Real-time dispatch batches verified through automated safety checks &amp; urgency triage
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Broadcast Active</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-50/80 text-[11px] uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4 font-sans font-semibold">Urgency Tier</th>
                  <th className="py-3 px-4 font-sans font-semibold">Item &amp; Category</th>
                  <th className="py-3 px-4 font-mono text-right font-semibold">Quantity</th>
                  <th className="py-3 px-4 font-sans font-semibold">Pickup Window</th>
                  <th className="py-3 px-4 font-sans font-semibold">Dispatch Address</th>
                  <th className="py-3 px-4 font-sans font-semibold">Safety Gating</th>
                  <th className="py-3 px-4 font-sans font-semibold">Fulfillment Status</th>
                  <th className="py-3 px-4 font-sans font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs font-sans">
                {filteredListings.map((item) => {
                  const isRejected = item.safetyStatus === "rejected";
                  const startDate = new Date(item.pickupWindow.start);
                  const endDate = new Date(item.pickupWindow.end);
                  const urgency = evaluateSurplusUrgency({
                    category: item.category,
                    quantity: item.quantity,
                    unit: item.unit,
                    expiryDeadline: item.pickupWindow.end,
                  });
                  const isRed = urgency.urgencyTier === "critical_red";

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-stone-50/90 transition-colors ${
                        isRejected
                          ? "bg-rose-50/40"
                          : isRed
                          ? "bg-rose-50/20 font-medium"
                          : ""
                      }`}
                    >
                      {/* Urgency Tier */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${urgency.tierColor.bg} ${urgency.tierColor.text} ${urgency.tierColor.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${urgency.tierColor.dot} ${isRed ? "animate-ping" : ""}`} />
                          {urgency.urgencyTier === "critical_red"
                            ? "🔴 Critical"
                            : urgency.urgencyTier === "urgent_yellow"
                            ? "🟡 Urgent"
                            : "🟢 Safe"}
                        </span>
                      </td>

                      {/* Item & Category */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isRejected ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                              {item.itemName}
                              {isRed && (
                                <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-red-600 text-white rounded font-bold">
                                  PRIORITY
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 capitalize">
                              {item.category.replace("_", " ")}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-stone-900">
                        <div>
                          {item.quantity}{" "}
                          <span className="text-xs font-sans font-normal text-stone-500">
                            {item.unit}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-sans font-normal">
                          ≈ {urgency.estimatedMeals} meals
                        </div>
                      </td>

                      {/* Pickup Window */}
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                        <div className="font-semibold text-stone-800">
                          {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                          {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-stone-500 text-[11px]">
                          until {endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Dispatch Address */}
                      <td className="py-3 px-4 text-xs text-stone-600 max-w-[200px] truncate" title={item.pickupLocation?.address}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{item.pickupLocation?.address || "Main Dispatch"}</span>
                        </div>
                      </td>

                      {/* Safety Gating */}
                      <td className="py-3 px-4">
                        {isRejected ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Safety Blocked
                            </span>
                            <div className="text-[10px] text-rose-700 font-mono leading-tight max-w-[200px]">
                              {item.rejectionReason || "Threshold exceeded"}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified Safe
                          </span>
                        )}
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-3 px-4">
                        {isRejected ? (
                          <span className="text-xs font-mono text-stone-400">Non-distributable</span>
                        ) : item.status === "delivered" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Delivered
                          </span>
                        ) : item.status === "claimed" || item.status === "matched" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Claimed (In Transit)
                          </span>
                        ) : item.status === "expired" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                            Window Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            Pending Match
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {!isRejected && item.status === "pending" ? (
                          <button
                            type="button"
                            onClick={() => setMatchmakingListing(item)}
                            className="h-8 px-3 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] rounded-xl flex items-center gap-1.5 ml-auto cursor-pointer transition-all shadow-2xs"
                          >
                            <HeartHandshake className="w-3.5 h-3.5" />
                            <span>Match NGO</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-stone-400">
                            {item.status === "matched" ? "Matched ✓" : item.status === "claimed" ? "Claimed ✓" : item.status === "delivered" ? "Completed ✓" : "—"}
                          </span>
                        )}
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
                Safety decisions are cryptographically certified and cannot be overwritten manually.
              </span>
            </div>
            <div className="font-mono text-[11px] text-stone-400">
              Automated Dispatch Engine
            </div>
          </div>
        </div>
      )}

      {/* 6. Modern Create Surplus Listing Modal / Drawer */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 text-stone-900 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs shrink-0">
                  <Ticket className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    List Surplus Food
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    FSSAI food safety gating verified before NGO broadcast
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setGatingResult(null);
                }}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border border-stone-200 rounded-xl p-1 bg-stone-50">
              <button
                type="button"
                onClick={() => {
                  setModalMode("select");
                  setGatingResult(null);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  modalMode === "select"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Choose from Ledger ({availableItems.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode("quick_add");
                  setGatingResult(null);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  modalMode === "quick_add"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                + Quick Add New Batch
              </button>
            </div>

            {/* Gating Feedback Result Banner */}
            {gatingResult && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                  gatingResult.type === "rejection"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : gatingResult.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-stone-50 border-stone-200 text-stone-800"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {gatingResult.type === "rejection" && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  {gatingResult.type === "success" && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                  {gatingResult.type === "rejection"
                    ? "Safety Gating Decision: Listing Blocked"
                    : gatingResult.type === "success"
                    ? "Safety Gating Passed: Verified Safe"
                    : "Submission Alert"}
                </div>
                <div>{gatingResult.message}</div>
                {gatingResult.ruleApplied && (
                  <div className="font-mono text-[10px] pt-1 opacity-80">
                    Rule triggered: {gatingResult.ruleApplied} (Logged to MongoDB auditLogs)
                  </div>
                )}
                {gatingResult.type === "success" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setGatingResult(null);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors"
                    >
                      Done &amp; View Listings
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-4">
              {/* Select Mode */}
              {modalMode === "select" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Select In-Stock Inventory Item *
                    </label>
                    {availableItems.length === 0 ? (
                      <div className="text-xs border border-stone-200 bg-stone-50 p-4 rounded-xl space-y-2">
                        <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-stone-500" />
                          <span>No available ledger items found</span>
                        </div>
                        <p className="text-stone-500 text-xs">
                          All logged kitchen items have either expired or been dispatched.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setModalMode("quick_add")}
                            className="px-3 py-1.5 text-xs bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
                          >
                            + Quick Add Batch Now
                          </button>
                          <Link
                            href="/app/institution/inventory"
                            className="px-3 py-1.5 text-xs border border-stone-200 bg-white rounded-lg text-stone-700 hover:bg-stone-50 font-semibold"
                          >
                            Go to Inventory Ledger
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <select
                        value={selectedItemId}
                        onChange={(e) => handleItemSelect(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                      >
                        <option value="">-- Choose item from ledger ({availableItems.length} available) --</option>
                        {availableItems.map((item) => {
                          const isSurplus = item.status === "surplus" || item.rawStatus === "surplus";
                          return (
                            <option key={item._id} value={item._id}>
                              {item.name} ({item.quantity} {item.unit} available) — {item.category.replace("_", " ")}
                              {isSurplus ? " ★ FLAGGED SURPLUS" : ""}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {selectedItem && (
                    <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between text-stone-500">
                        <span>Preparation / Logged:</span>
                        <span className="text-stone-900 font-semibold">
                          {new Date(selectedItem.preparedOrReceivedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-stone-500">
                        <span>Expiry Estimate:</span>
                        <span className="text-stone-900 font-semibold">
                          {new Date(selectedItem.expiryEstimateAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {selectedItem.category === "cooked_food" && (
                        <div className="text-amber-800 text-[11px] pt-1 flex items-center gap-1 font-sans">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Cooked food 4-hour window strictly enforced server-side.</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Surplus Quantity *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={listingQty}
                      onChange={(e) => setListingQty(e.target.value)}
                      placeholder="e.g. 25"
                      required
                      max={selectedItem ? selectedItem.quantity : undefined}
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                    />
                    {selectedItem && (
                      <span className="text-[11px] text-stone-500 mt-1 block font-mono">
                        Max available: {selectedItem.quantity} {selectedItem.unit}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Add Mode */}
              {modalMode === "quick_add" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Item / Dish Name *
                    </label>
                    <input
                      type="text"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      placeholder="e.g. Fresh Palak Paneer & Rice"
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                        Category *
                      </label>
                      <select
                        value={quickCategory}
                        onChange={(e) => handleQuickCategoryChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                      >
                        <option value="cooked_food">🍲 Cooked Food</option>
                        <option value="dairy">🥛 Dairy &amp; Milk</option>
                        <option value="bakery">🍞 Bakery &amp; Bread</option>
                        <option value="raw_produce">🥦 Raw Produce</option>
                        <option value="packaged">📦 Packaged Goods</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                        Prepared Time
                      </label>
                      <select
                        value={quickPrepAgoHours}
                        onChange={(e) => setQuickPrepAgoHours(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                      >
                        <option value="0">Just now (Fresh batch)</option>
                        <option value="0.5">30 minutes ago</option>
                        <option value="1">1 hour ago</option>
                        <option value="2">2 hours ago</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                        Surplus Quantity *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={quickQuantity}
                        onChange={(e) => setQuickQuantity(e.target.value)}
                        placeholder="e.g. 25"
                        required
                        className="w-full px-3.5 py-2.5 text-xs font-mono bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                        Unit *
                      </label>
                      <select
                        value={quickUnit}
                        onChange={(e) => setQuickUnit(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                      >
                        <option value="kg">kg (Kilograms)</option>
                        <option value="pcs">pcs (Pieces)</option>
                        <option value="L">L (Litres)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Dispatch Window Fields */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Pickup Start *
                  </label>
                  <select
                    value={windowStartHours}
                    onChange={(e) => setWindowStartHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                  >
                    <option value="0">Immediate (Now)</option>
                    <option value="0.5">In 30 minutes</option>
                    <option value="1">In 1 hour</option>
                    <option value="2">In 2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Window Duration *
                  </label>
                  <select
                    value={windowDurationHours}
                    onChange={(e) => setWindowDurationHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                  >
                    <option value="1">1 hour window</option>
                    <option value="2">2 hours window</option>
                    <option value="3">3 hours window</option>
                    <option value="4">4 hours window</option>
                  </select>
                </div>
              </div>

              {/* Storage Condition & Engine Evaluation */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Storage &amp; Holding Condition
                  </label>
                  <select
                    value={storageCondition}
                    onChange={(e) => setStorageCondition(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                  >
                    <option value="ambient">Ambient (Room Temperature)</option>
                    <option value="refrigerated">Refrigerated / Chilled (&lt; 5°C)</option>
                    <option value="hot_hold">Hot-Held (&gt; 60°C Warmer)</option>
                  </select>
                </div>

                {/* Live Surplus Engine Feedback */}
                {effectiveQty > 0 && liveUrgencyPreview && (
                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/80 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Estimated Impact:</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          ~{livePlatePreview?.plates || 0} meal portions
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {livePlatePreview?.analogyText}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${liveUrgencyPreview.tierColor.bg} ${liveUrgencyPreview.tierColor.text} ${liveUrgencyPreview.tierColor.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${liveUrgencyPreview.tierColor.dot}`} />
                        {liveUrgencyPreview.urgencyTier === "critical_red"
                          ? "🔴 Critical Tier"
                          : liveUrgencyPreview.urgencyTier === "urgent_yellow"
                          ? "🟡 Urgent Tier"
                          : "🟢 Safe Tier"}
                      </span>
                      <span className="text-[10px] text-stone-500 block font-mono mt-0.5">
                        {liveUrgencyPreview.timeRemainingHours.toFixed(1)}h window
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dispatch Location & Map Picker */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Dispatch Point / Gate &amp; Location Pin
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. Loading Dock B, Main Kitchen Gate"
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                />
                <div className="mt-2.5 space-y-1.5">
                  <span className="text-[11px] font-mono text-stone-500 block">
                    Confirm Pickup Dock Coordinates for Logistics Courier:
                  </span>
                  <div className="rounded-xl overflow-hidden border border-stone-200">
                    <LocationPickerMap
                      lat={pickupCoords.lat}
                      lng={pickupCoords.lng}
                      pinType="kitchen"
                      theme="light"
                      label="Pickup Dock"
                      onChange={({ lat: newLat, lng: newLng }) => {
                        setPickupCoords({ lat: newLat, lng: newLng });
                      }}
                      className="w-full h-44 sm:h-48"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setGatingResult(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl border border-stone-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (modalMode === "select" && (!selectedItemId || !listingQty)) ||
                    (modalMode === "quick_add" && (!quickName.trim() || !quickQuantity))
                  }
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-60 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Evaluating Safety Rules...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Run Safety Gating &amp; Publish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Recipient NGO Matchmaking Engine Modal */}
      {matchmakingListing && (
        <ManualMatchmakerModal
          listingId={matchmakingListing._id}
          itemName={matchmakingListing.itemName}
          quantity={matchmakingListing.quantity}
          unit={matchmakingListing.unit}
          urgencyTier={
            evaluateSurplusUrgency({
              category: matchmakingListing.category,
              quantity: matchmakingListing.quantity,
              unit: matchmakingListing.unit,
              expiryDeadline: matchmakingListing.pickupWindow.end,
            }).urgencyTier
          }
          isOpen={!!matchmakingListing}
          onClose={() => setMatchmakingListing(null)}
          onMatchedSuccess={() => {
            fetchListings();
            setMatchmakingListing(null);
          }}
        />
      )}
    </div>
  );
}

export default function InstitutionSurplusListingsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-xs font-mono text-stone-500">
          Loading surplus redistribution ledger...
        </div>
      }
    >
      <SurplusListingsContent />
    </React.Suspense>
  );
}
