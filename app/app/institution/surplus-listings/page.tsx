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
  Minus,
  Maximize2,
} from "lucide-react";
import LocationPickerMap from "@/components/maps/location-picker-map";
import {
  calculatePiecesToPlates,
  evaluateSurplusUrgency,
  formatFoodQuantity,
  isPiecesUnit,
} from "@/lib/surplus-engine";
import ManualMatchmakerModal from "@/components/surplus/manual-matchmaker-modal";
import { HeartHandshake, Utensils } from "lucide-react";

interface SurplusListing {
  _id: string;
  inventoryItemId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  storageCondition?: string;
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
  urgencyTier?: "critical_red" | "urgent_yellow" | "safe_green";
  createdAt: string;
}

interface LedgerUrgencyInfo {
  tier: "critical_red" | "urgent_yellow" | "safe_green" | "completed" | "blocked" | "expired";
  label: string;
  badgeClass: string;
  dotClass: string;
  ping: boolean;
  isPriority: boolean;
  rowBg: string;
}

function getListingUrgency(item: SurplusListing): LedgerUrgencyInfo {
  // 1. Safety Blocked / Rejected items are NOT active dispatches
  if (item.safetyStatus === "rejected") {
    return {
      tier: "blocked",
      label: "Blocked",
      badgeClass: "bg-stone-100 text-stone-600 border-stone-200",
      dotClass: "bg-stone-400",
      ping: false,
      isPriority: false,
      rowBg: "hover:bg-stone-50/80 transition-colors opacity-85",
    };
  }

  // 2. Delivered / Completed items are fulfilled
  if (item.status === "delivered") {
    return {
      tier: "completed",
      label: "Fulfilled",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dotClass: "bg-emerald-500",
      ping: false,
      isPriority: false,
      rowBg: "hover:bg-stone-50/80 transition-colors",
    };
  }

  const now = Date.now();
  const endDate = item.pickupWindow?.end ? new Date(item.pickupWindow.end).getTime() : 0;
  const isPastDeadline = endDate > 0 && endDate < now;

  // 3. Expired items
  if (item.status === "expired" || (item.status === "pending" && isPastDeadline)) {
    return {
      tier: "expired",
      label: "Expired",
      badgeClass: "bg-stone-100 text-stone-600 border-stone-200",
      dotClass: "bg-stone-400",
      ping: false,
      isPriority: false,
      rowBg: "hover:bg-stone-50/80 transition-colors opacity-75",
    };
  }

  // 4. Packaged or dry goods (e.g. Coke, canned goods, pulses)
  const normCat = (item.category || "").toLowerCase();
  const isPackagedOrDry = normCat.includes("package") || normCat.includes("dry");

  // 5. Calculate remaining window time for active dispatches
  const hoursRemaining = endDate > 0 ? (endDate - now) / (1000 * 60 * 60) : 4;

  if (isPackagedOrDry && hoursRemaining > 0.5) {
    return {
      tier: "safe_green",
      label: "Safe",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dotClass: "bg-emerald-500",
      ping: false,
      isPriority: false,
      rowBg: "hover:bg-stone-50/80 transition-colors",
    };
  }

  // If item has explicit urgencyTier recorded
  if (item.urgencyTier) {
    if (item.urgencyTier === "critical_red") {
      return {
        tier: "critical_red",
        label: "Critical",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        dotClass: "bg-rose-500",
        ping: true,
        isPriority: true,
        rowBg: "bg-rose-50/20 hover:bg-rose-50/40 transition-colors",
      };
    }
    if (item.urgencyTier === "urgent_yellow") {
      return {
        tier: "urgent_yellow",
        label: "Urgent",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        dotClass: "bg-amber-500",
        ping: false,
        isPriority: false,
        rowBg: "hover:bg-stone-50/80 transition-colors",
      };
    }
    return {
      tier: "safe_green",
      label: "Safe",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dotClass: "bg-emerald-500",
      ping: false,
      isPriority: false,
      rowBg: "hover:bg-stone-50/80 transition-colors",
    };
  }

  // Dynamic calculation for perishable/cooked food active dispatches:
  if (hoursRemaining < 2.0 && hoursRemaining > 0) {
    return {
      tier: "critical_red",
      label: "Critical",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      dotClass: "bg-rose-500",
      ping: true,
      isPriority: true,
      rowBg: "bg-rose-50/20 hover:bg-rose-50/40 transition-colors",
    };
  } else if (hoursRemaining <= 5.0) {
    return {
      tier: "urgent_yellow",
      label: "Urgent",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      dotClass: "bg-amber-500",
      ping: false,
      isPriority: false,
      rowBg: "hover:bg-stone-50/80 transition-colors",
    };
  } else {
    return {
      tier: "safe_green",
      label: "Safe",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dotClass: "bg-emerald-500",
      ping: false,
      isPriority: false,
      rowBg: "hover:bg-stone-50/80 transition-colors",
    };
  }
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

const QUICK_PRESETS = [
  { label: "🍛 Cooked Rice & Dal", name: "Cooked Rice & Dal", category: "cooked_food", unit: "kg" },
  { label: "🫓 Roti & Chapati", name: "Fresh Rotis / Chapatis", category: "cooked_food", unit: "pcs" },
  { label: "🍲 Mixed Veg / Curry", name: "Mixed Vegetable Curry", category: "cooked_food", unit: "kg" },
  { label: "🥛 Fresh Milk / Paneer", name: "Fresh Milk & Paneer", category: "dairy", unit: "L" },
  { label: "🍞 Bread & Bakery", name: "Sandwich Bread & Buns", category: "bakery", unit: "pcs" },
  { label: "🥦 Fresh Produce", name: "Fresh Vegetables", category: "raw_produce", unit: "kg" },
];

function SurplusListingsContent() {
  const searchParams = useSearchParams();
  const preselectedItemId = searchParams.get("itemId");

  const [listings, setListings] = React.useState<SurplusListing[]>([]);
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Create Listing Modal - Defaults to simple 1-Step Food Listing
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"one_step" | "select">("one_step");
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

  // Quick 1-Step Food Details state
  const [quickName, setQuickName] = React.useState("");
  const [quickCategory, setQuickCategory] = React.useState("cooked_food");
  const [quickQuantity, setQuickQuantity] = React.useState("");
  const [quickUnit, setQuickUnit] = React.useState("kg");
  const [quickPrepAgoHours, setQuickPrepAgoHours] = React.useState("0");
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [pageNotification, setPageNotification] = React.useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

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

  // Handle URL deep-link with itemId or calculator query params
  React.useEffect(() => {
    if (preselectedItemId && inventoryItems.length > 0) {
      const target = inventoryItems.find((i) => i._id === preselectedItemId);
      if (target) {
        setSelectedItemId(target._id);
        setListingQty(String(target.quantity));
        setIsCreateOpen(true);
        setModalMode("select");
      }
    } else {
      const paramFoodName = searchParams.get("foodName");
      const paramQty = searchParams.get("qty");
      const paramUnit = searchParams.get("unit");
      const paramCategory = searchParams.get("category");
      const paramStorage = searchParams.get("storage");

      if (paramFoodName) {
        setQuickName(paramFoodName);
        if (paramQty) setQuickQuantity(paramQty);
        if (paramUnit) setQuickUnit(paramUnit);
        if (paramCategory) setQuickCategory(paramCategory);
        if (paramStorage) setStorageCondition(paramStorage);
        setModalMode("one_step");
        setIsCreateOpen(true);
      }
    }
  }, [preselectedItemId, inventoryItems, searchParams]);

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

  const applyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setQuickName(preset.name);
    setQuickCategory(preset.category);
    setQuickUnit(preset.unit);
    setQuickPrepAgoHours("0");
  };

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
      const startTime = new Date(now.getTime() + Number(windowStartHours) * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + Number(windowDurationHours) * 60 * 60 * 1000);
      const dispatchAddress = pickupAddress.trim() || "Main Kitchen Dispatch Gate";

      let res: Response;

      // 1-STEP DIRECT LISTING (No inventory prerequisite, directly live on NGO portal)
      if (modalMode === "one_step") {
        if (!quickName.trim()) {
          setGatingResult({
            type: "error",
            message: "Food / dish name is required. Please type or pick a food item.",
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

        res = await fetch("/api/v1/surplus-listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: quickName.trim(),
            category: quickCategory,
            quantity: qtyNum,
            unit: quickUnit,
            prepTimeHoursAgo: Number(quickPrepAgoHours) || 0,
            storageCondition,
            pickupWindow: {
              start: startTime.toISOString(),
              end: endTime.toISOString(),
            },
            pickupLocation: {
              address: dispatchAddress,
              lat: pickupCoords.lat,
              lng: pickupCoords.lng,
            },
          }),
        });
      } else {
        // SELECT FROM EXISTING INVENTORY
        if (!selectedItemId) {
          setGatingResult({
            type: "error",
            message: "Please select an inventory item to list.",
          });
          setSubmitting(false);
          return;
        }

        const qtyNum = Number(listingQty);
        if (!qtyNum || qtyNum <= 0) {
          setGatingResult({
            type: "error",
            message: "Please enter a valid quantity.",
          });
          setSubmitting(false);
          return;
        }

        res = await fetch("/api/v1/surplus-listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inventoryItemId: selectedItemId,
            quantity: qtyNum,
            storageCondition,
            pickupWindow: {
              start: startTime.toISOString(),
              end: endTime.toISOString(),
            },
            pickupLocation: {
              address: dispatchAddress,
              lat: pickupCoords.lat,
              lng: pickupCoords.lng,
            },
          }),
        });
      }

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

      // 201 Verified Safe - Live on NGO portal!
      const listedFoodName =
        (modalMode === "one_step" ? quickName.trim() : selectedItem?.name) ||
        "Food item";
      const listedQty = modalMode === "one_step" ? quickQuantity : listingQty;
      const listedUnit =
        modalMode === "one_step" ? quickUnit : (selectedItem?.unit || "kg");

      // Auto-minimize / close the modal window immediately!
      setIsCreateOpen(false);
      setIsMinimized(false);
      setGatingResult(null);

      // Show high-visibility confirmation banner on the main page
      setPageNotification({
        type: "success",
        title: "🎉 Food Listed Successfully on NGO Portal!",
        message: `${listedFoodName} (${listedQty} ${listedUnit}) is now LIVE on the NGO Portal and nearby verified charities have been notified for immediate pickup.`,
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

  // Sort listings: Active critical first, active urgent, active safe, fulfilled, expired, blocked
  const sortedListings = React.useMemo(() => {
    return [...filteredListings].sort((a, b) => {
      const uA = getListingUrgency(a);
      const uB = getListingUrgency(b);
      const rank: Record<string, number> = {
        critical_red: 5,
        urgent_yellow: 4,
        safe_green: 3,
        completed: 2,
        expired: 1,
        blocked: 0,
      };
      const diff = (rank[uB.tier] || 0) - (rank[uA.tier] || 0);
      if (diff !== 0) return diff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
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
              setIsMinimized(false);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>+ Create Surplus Listing</span>
          </button>
        </div>
      </div>

      {/* Real-time Confirmation Alert Banner after Listing Food */}
      {pageNotification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            pageNotification.type === "success"
              ? "bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-white border-emerald-300 text-emerald-950"
              : "bg-rose-50 border-rose-200 text-rose-950"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <span>{pageNotification.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live on NGO Marketplace
                </span>
              </div>
              <p className="text-stone-600 mt-0.5 text-xs">{pageNotification.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/app/ngo/browse"
              target="_blank"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
            >
              <span>Preview NGO View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setPageNotification(null)}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                {sortedListings.map((item) => {
                  const isRejected = item.safetyStatus === "rejected";
                  const startDate = new Date(item.pickupWindow.start);
                  const endDate = new Date(item.pickupWindow.end);
                  const urgency = getListingUrgency(item);
                  const meals = calculatePiecesToPlates(item.quantity, item.unit, item.category).plates;

                  return (
                    <tr
                      key={item._id}
                      className={`transition-colors ${urgency.rowBg}`}
                    >
                      {/* Urgency Tier */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${urgency.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotClass} ${urgency.ping ? "animate-ping" : ""}`} />
                          <span>{urgency.label}</span>
                        </span>
                      </td>

                      {/* Item & Category */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isRejected ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          ) : item.status === "delivered" ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          ) : urgency.isPriority ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                              <span>{item.itemName}</span>
                              {urgency.isPriority && (
                                <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-red-600 text-white rounded font-bold">
                                  PRIORITY
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 capitalize">
                              {item.category.replace(/_/g, " ")}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-stone-900 whitespace-nowrap">
                        <div>
                          {item.quantity}{" "}
                          <span className="text-xs font-sans font-normal text-stone-500">
                            {item.unit}
                          </span>
                          {isPiecesUnit(item.unit) && (
                            <span className="text-xs font-sans font-medium text-emerald-700 ml-1.5 whitespace-nowrap">
                              (~{meals} plates)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-sans font-normal">
                          ≈ {meals} meals
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
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isRejected ? (
                          <span
                            title={item.rejectionReason || "Threshold exceeded"}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 cursor-help"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>Safety Blocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Verified Safe</span>
                          </span>
                        )}
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isRejected ? (
                          <span className="text-xs font-mono text-stone-400">Non-distributable</span>
                        ) : item.status === "delivered" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Delivered</span>
                          </span>
                        ) : item.status === "claimed" || item.status === "matched" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>Claimed (In Transit)</span>
                          </span>
                        ) : item.status === "expired" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                            <span>Window Expired</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            <span>Pending Match</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
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

      {/* 6. Modern 1-Step Create Surplus Listing Modal */}
      {isCreateOpen && !isMinimized && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 text-stone-900 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    1-Step Food Listing
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Direct listing: food is verified &amp; immediately published on the NGO portal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Minimize window"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsMinimized(false);
                    setGatingResult(null);
                  }}
                  className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Close window"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border border-stone-200 rounded-xl p-1 bg-stone-50">
              <button
                type="button"
                onClick={() => {
                  setModalMode("one_step");
                  setGatingResult(null);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  modalMode === "one_step"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                ⚡ 1-Step Food Listing (Direct to NGO)
              </button>
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
                Choose from Stock ({availableItems.length})
              </button>
            </div>

            {/* Gating Feedback Result Banner */}
            {gatingResult && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                  gatingResult.type === "rejection"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : gatingResult.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-stone-50 border-stone-200 text-stone-800"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  {gatingResult.type === "rejection" && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  {gatingResult.type === "success" && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                  {gatingResult.type === "rejection"
                    ? "Safety Gating Decision: Listing Blocked"
                    : gatingResult.type === "success"
                    ? "🎉 Food is LIVE on the NGO Portal!"
                    : "Submission Alert"}
                </div>
                <div>{gatingResult.message}</div>
                {gatingResult.ruleApplied && (
                  <div className="font-mono text-[10px] pt-0.5 opacity-80">
                    Rule triggered: {gatingResult.ruleApplied} (Logged to MongoDB auditLogs)
                  </div>
                )}
                {gatingResult.type === "success" && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setGatingResult(null);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Done &amp; View Listings
                    </button>
                    <Link
                      href="/app/ngo/browse"
                      target="_blank"
                      className="px-3.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Preview NGO Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-4">
              {/* 1-Step Direct Listing Mode */}
              {modalMode === "one_step" && (
                <div className="space-y-3.5">
                  {/* Quick-Pick Food Chips for Layman Users */}
                  <div className="space-y-1.5 bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/80">
                    <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      Quick Pick (Click to Auto-Fill):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-stone-700 hover:text-emerald-800 transition-all font-medium flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Food / Dish Name *
                    </label>
                    <input
                      type="text"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      placeholder="e.g. Fresh Cooked Rice & Dal, Roti, Paneer Sabzi"
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                        Food Category *
                      </label>
                      <select
                        value={quickCategory}
                        onChange={(e) => handleQuickCategoryChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                      >
                        <option value="cooked_food">🍲 Cooked Meals / Curries</option>
                        <option value="dairy">🥛 Fresh Milk &amp; Dairy</option>
                        <option value="bakery">🍞 Bread &amp; Bakery</option>
                        <option value="raw_produce">🥦 Raw Produce &amp; Veggies</option>
                        <option value="packaged">📦 Packaged Foods</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                        Prepared / Freshness
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
                        placeholder="e.g. 20"
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
                        <option value="pcs">pcs (Pieces / Plates)</option>
                        <option value="L">L (Litres)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Select Mode (From Existing Logged Inventory) */}
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
                            onClick={() => setModalMode("one_step")}
                            className="px-3 py-1.5 text-xs bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
                          >
                            ⚡ 1-Step Food Listing
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
                        <option value="">-- Choose item from stock ({availableItems.length} available) --</option>
                        {availableItems.map((item) => {
                          const isSurplus = item.status === "surplus" || item.rawStatus === "surplus";
                          return (
                            <option key={item._id} value={item._id}>
                              {item.name} ({formatFoodQuantity(item.quantity, item.unit, item.category)} available) — {item.category.replace("_", " ")}
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
                        Max available: {formatFoodQuantity(selectedItem.quantity, selectedItem.unit, selectedItem.category)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Shared Dispatch Window Fields */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Ready for Pickup *
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
                    Pickup Window Duration *
                  </label>
                  <select
                    value={windowDurationHours}
                    onChange={(e) => setWindowDurationHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                  >
                    <option value="1">1 hour window</option>
                    <option value="2">2 hours window (Recommended)</option>
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
                    (modalMode === "one_step" && (!quickName.trim() || !quickQuantity))
                  }
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-60 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying &amp; Publishing to NGOs...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>🚀 List Food Directly to NGO Portal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minimized Docked Widget (Allows restoring the window at any time) */}
      {isCreateOpen && isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-emerald-900/95 border border-emerald-600/80 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" style={{ animationDuration: "4s" }} />
              <span>⚡ Food Listing Window Minimized</span>
              <Maximize2 className="w-3.5 h-3.5 text-emerald-200 ml-1" />
            </button>
            <button
              onClick={() => {
                setIsCreateOpen(false);
                setIsMinimized(false);
                setGatingResult(null);
              }}
              className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/80 rounded-xl transition-colors cursor-pointer"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>
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
            matchmakingListing.urgencyTier ||
            (() => {
              const u = getListingUrgency(matchmakingListing);
              if (u.tier === "critical_red" || u.tier === "urgent_yellow" || u.tier === "safe_green") {
                return u.tier;
              }
              return "safe_green";
            })()
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
