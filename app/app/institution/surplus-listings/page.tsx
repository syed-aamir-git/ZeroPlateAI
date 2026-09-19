"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TicketIcon, ShieldCheckIcon, AlertTriangleIcon, CrateIcon } from "@/components/icons/ledger-icons";

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
  status: "in_stock" | "surplus" | "listed" | "expired" | "delivered" | "in_progress";
  rawStatus?: string;
}

function SurplusListingsContent() {
  const searchParams = useSearchParams();
  const preselectedItemId = searchParams.get("itemId");

  const [listings, setListings] = React.useState<SurplusListing[]>([]);
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Create Listing Modal
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"select" | "quick_add">("select");
  const [selectedItemId, setSelectedItemId] = React.useState<string>("");
  const [listingQty, setListingQty] = React.useState<string>("");
  const [windowStartHours, setWindowStartHours] = React.useState<string>("0"); // hours from now
  const [windowDurationHours, setWindowDurationHours] = React.useState<string>("2"); // duration
  const [pickupAddress, setPickupAddress] = React.useState<string>("");
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
          pickupWindow: {
            start: startTime.toISOString(),
            end: endTime.toISOString(),
          },
          pickupLocation: {
            address: pickupAddress.trim() || "Main Kitchen Dispatch Gate",
            lat: 28.6139,
            lng: 77.209,
          },
        }),
      });

      const data = await res.json();

      if (res.status === 422) {
        // Safety Gating Rejection!
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

      // 201 Verified Safe!
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
    if (statusFilter === "all") return true;
    if (statusFilter === "verified_safe") return l.safetyStatus === "verified_safe";
    if (statusFilter === "rejected") return l.safetyStatus === "rejected";
    return l.status === statusFilter;
  });

  const verifiedCount = listings.filter((l) => l.safetyStatus === "verified_safe").length;
  const pendingCount = listings.filter((l) => l.status === "pending").length;
  const claimedCount = listings.filter((l) => l.status === "claimed" || l.status === "delivered").length;
  const rejectedCount = listings.filter((l) => l.safetyStatus === "rejected").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
            Redistribution Dispatch Control
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink mt-0.5">
            Surplus Listings & Gating
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setGatingResult(null);
              setIsCreateOpen(true);
            }}
          >
            <TicketIcon size={14} />
            <span>+ Create surplus listing</span>
          </Button>
        </div>
      </div>

      {/* Real-time Ledger Strip for Listings */}
      <div className="border border-line bg-[#FAF6EE] rounded-[6px] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-line text-ink">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            Total Published
          </div>
          <div className="font-mono-numeral text-2xl font-normal text-ink mt-1">
            {verifiedCount}
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">verified safe items</div>
        </div>

        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            Pending Claims
          </div>
          <div className="font-mono-numeral text-2xl font-normal text-saffron mt-1">
            {pendingCount}
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">live for NGO matching</div>
        </div>

        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            Claimed / Delivered
          </div>
          <div className="font-mono-numeral text-2xl font-normal text-basil mt-1">
            {claimedCount}
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">successful pickups</div>
        </div>

        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            Safety Gated (Blocked)
          </div>
          <div className="font-mono-numeral text-2xl font-normal text-clay-rust mt-1">
            {rejectedCount}
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">failed safety threshold</div>
        </div>
      </div>

      {/* Safety Gating Notice Banner */}
      <div className="border border-line bg-ledger-paper p-4 rounded-[6px] text-xs text-ink-soft flex items-start gap-3">
        <div className="p-1 rounded bg-basil/10 text-basil shrink-0 mt-0.5">
          <ShieldCheckIcon size={16} />
        </div>
        <div className="space-y-1">
          <div className="font-semibold text-ink">
            Server-Side FSSAI Safety Gating Active (Fail-Closed)
          </div>
          <p>
            All listings are evaluated against elapsed time and temperature window thresholds prior
            to being published to NGOs. Cooked meals older than 4 hours or listings with expired
            pickup windows are strictly rejected. Every evaluation is recorded to the MongoDB
            audit log.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border border-line bg-[#FAF6EE] p-2.5 rounded-[6px]">
        {[
          { id: "all", label: `All Listings (${listings.length})` },
          { id: "verified_safe", label: `Verified Safe (${verifiedCount})` },
          { id: "pending", label: `Pending Matching (${pendingCount})` },
          { id: "claimed", label: `Claimed (${claimedCount})` },
          { id: "rejected", label: `Safety Blocked (${rejectedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1 text-xs rounded-[4px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === tab.id
                ? "bg-basil text-ledger-paper"
                : "bg-ledger-paper text-ink-soft border border-line hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings Ledger Table */}
      {loading ? (
        <div className="p-8 text-center text-xs font-mono-numeral text-ink-soft">
          Loading surplus listings ledger...
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="border border-line bg-[#FAF6EE] p-10 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-line bg-ledger-paper mx-auto flex items-center justify-center text-ink-soft">
            <TicketIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-normal text-ink">
            No surplus listings match this ledger filter
          </h2>
          <p className="text-xs text-ink-soft max-w-md mx-auto">
            When you mark items from your inventory as surplus and specify a pickup window, our
            safety engine validates the food before notifying verified recipient NGOs.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setGatingResult(null);
              setIsCreateOpen(true);
            }}
          >
            + Create first surplus listing
          </Button>
        </div>
      ) : (
        <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-x-auto shadow-none">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#EAE3D4] border-b border-line text-xs uppercase tracking-wider text-ink font-mono-numeral">
              <tr>
                <th className="px-4 py-3 font-semibold">Item & Category</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Pickup Window</th>
                <th className="px-4 py-3 font-semibold">Dispatch Address</th>
                <th className="px-4 py-3 font-semibold">Safety Gating</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredListings.map((item) => {
                const isRejected = item.safetyStatus === "rejected";
                const startDate = new Date(item.pickupWindow.start);
                const endDate = new Date(item.pickupWindow.end);

                return (
                  <tr
                    key={item._id}
                    className={`hover:bg-[#F3EDE0]/80 transition-colors ${
                      isRejected ? "bg-clay-rust/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{item.itemName}</div>
                      <div className="text-[11px] text-ink-soft capitalize">
                        {item.category.replace("_", " ")}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono-numeral font-medium text-ink">
                      {item.quantity} <span className="text-xs text-ink-soft">{item.unit}</span>
                    </td>

                    <td className="px-4 py-3 font-mono-numeral text-xs text-ink">
                      <div>
                        {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                        {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-ink-soft text-[11px]">
                        until {endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-ink-soft max-w-[200px] truncate" title={item.pickupLocation?.address}>
                      {item.pickupLocation?.address || "Main Dispatch"}
                    </td>

                    <td className="px-4 py-3">
                      {isRejected ? (
                        <div className="space-y-1">
                          <StatusBadge variant="rejected" label="Safety Blocked" />
                          <div className="text-[10px] text-clay-rust font-mono-numeral leading-tight max-w-[180px]">
                            {item.rejectionReason || "Threshold exceeded"}
                          </div>
                        </div>
                      ) : (
                        <StatusBadge variant="verified_safe" label="Verified Safe" />
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {isRejected ? (
                        <span className="text-xs font-mono-numeral text-ink-soft">Non-distributable</span>
                      ) : (
                        <StatusBadge
                          variant={
                            item.status === "delivered"
                              ? "delivered"
                              : item.status === "claimed" || item.status === "matched"
                              ? "in_transit"
                              : item.status === "expired"
                              ? "expired"
                              : "pending"
                          }
                          label={
                            item.status === "delivered"
                              ? "Delivered"
                              : item.status === "claimed"
                              ? "Claimed (In Progress)"
                              : item.status === "matched"
                              ? "Matched"
                              : item.status === "pending"
                              ? "Pending Match"
                              : item.status.charAt(0).toUpperCase() + item.status.slice(1)
                          }
                        />
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono-numeral text-xs text-ink-soft">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Surplus Listing Modal / Drawer */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-ledger-paper border border-line rounded-[6px] max-w-lg w-full p-6 space-y-5 text-ink shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
                  FSSAI Compliant Dispatch
                </span>
                <h3 className="font-display text-xl font-normal text-ink">
                  List Surplus Food
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setGatingResult(null);
                }}
                className="text-ink-soft hover:text-ink text-sm font-mono-numeral cursor-pointer"
              >
                [ESC]
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border border-line rounded-[4px] p-0.5 bg-[#FAF6EE]">
              <button
                type="button"
                onClick={() => {
                  setModalMode("select");
                  setGatingResult(null);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-[3px] transition-colors cursor-pointer ${
                  modalMode === "select"
                    ? "bg-basil text-ledger-paper"
                    : "text-ink-soft hover:text-ink"
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
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-[3px] transition-colors cursor-pointer ${
                  modalMode === "quick_add"
                    ? "bg-basil text-ledger-paper"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                + Quick Add New Batch
              </button>
            </div>

            {/* Gating Feedback Result Banner */}
            {gatingResult && (
              <div
                className={`p-3 rounded-[4px] border text-xs leading-relaxed ${
                  gatingResult.type === "rejection"
                    ? "bg-clay-rust/10 border-clay-rust/40 text-clay-rust"
                    : gatingResult.type === "success"
                    ? "bg-basil/10 border-basil/40 text-basil"
                    : "bg-ink-soft/10 border-line text-ink"
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  {gatingResult.type === "rejection" && <AlertTriangleIcon size={14} />}
                  {gatingResult.type === "success" && <ShieldCheckIcon size={14} />}
                  {gatingResult.type === "rejection"
                    ? "Safety Gating Decision: Listing Blocked"
                    : gatingResult.type === "success"
                    ? "Safety Gating Passed"
                    : "Submission Alert"}
                </div>
                <div className="mt-1">{gatingResult.message}</div>
                {gatingResult.ruleApplied && (
                  <div className="font-mono-numeral text-[10px] mt-1 opacity-80">
                    Rule triggered: {gatingResult.ruleApplied} (Logged to MongoDB auditLogs)
                  </div>
                )}
                {gatingResult.type === "success" && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setGatingResult(null);
                      }}
                    >
                      Done & View Listings
                    </Button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-4">
              {/* Select Mode */}
              {modalMode === "select" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
                      Select In-Stock Inventory Item *
                    </label>
                    {availableItems.length === 0 ? (
                      <div className="text-xs border border-line bg-[#FAF6EE] p-3.5 rounded-[4px] space-y-2">
                        <div className="font-medium text-ink flex items-center gap-1.5">
                          <CrateIcon size={14} />
                          <span>No available ledger items found</span>
                        </div>
                        <p className="text-ink-soft">
                          All logged kitchen items have either expired or been dispatched.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setModalMode("quick_add")}
                            className="px-2.5 py-1 text-xs bg-basil text-ledger-paper rounded-[4px] font-medium cursor-pointer"
                          >
                            + Quick Add Batch Now
                          </button>
                          <Link
                            href="/app/institution/inventory"
                            className="px-2.5 py-1 text-xs border border-line rounded-[4px] text-ink hover:bg-black/5 font-medium"
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
                        className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none cursor-pointer"
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
                    <div className="bg-[#FAF6EE] border border-line p-3 rounded-[4px] text-xs space-y-1 font-mono-numeral">
                      <div className="flex justify-between text-ink-soft">
                        <span>Preparation / Logged:</span>
                        <span className="text-ink">
                          {new Date(selectedItem.preparedOrReceivedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-ink-soft">
                        <span>Expiry Estimate:</span>
                        <span className="text-ink">
                          {new Date(selectedItem.expiryEstimateAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {selectedItem.category === "cooked_food" && (
                        <div className="text-saffron text-[11px] pt-1">
                          ⚠️ Cooked food 4-hour window strictly enforced server-side.
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
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
                      className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink font-mono-numeral focus:ring-1 focus:ring-basil outline-none"
                    />
                    {selectedItem && (
                      <span className="text-[10px] text-ink-soft font-mono-numeral">
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
                    <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
                      Item / Dish Name *
                    </label>
                    <input
                      type="text"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      placeholder="e.g. Fresh Palak Paneer & Rice"
                      required
                      className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
                        Category *
                      </label>
                      <select
                        value={quickCategory}
                        onChange={(e) => handleQuickCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
                      >
                        <option value="cooked_food">Cooked Food (Hot Meals)</option>
                        <option value="dairy">Dairy & Milk</option>
                        <option value="bakery">Bakery & Bread</option>
                        <option value="raw_produce">Raw Produce / Fruits</option>
                        <option value="packaged">Packaged Goods</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
                        Cooked / Prepared Time
                      </label>
                      <select
                        value={quickPrepAgoHours}
                        onChange={(e) => setQuickPrepAgoHours(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
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
                      <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
                        Surplus Quantity *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={quickQuantity}
                        onChange={(e) => setQuickQuantity(e.target.value)}
                        placeholder="e.g. 25"
                        required
                        className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink font-mono-numeral focus:ring-1 focus:ring-basil outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
                        Unit *
                      </label>
                      <select
                        value={quickUnit}
                        onChange={(e) => setQuickUnit(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
                      >
                        <option value="kg">kg (Kilograms)</option>
                        <option value="pcs">pcs (Pieces / Portions)</option>
                        <option value="L">L (Litres)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Dispatch Window Fields */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-line">
                <div>
                  <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
                    Pickup Start *
                  </label>
                  <select
                    value={windowStartHours}
                    onChange={(e) => setWindowStartHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
                  >
                    <option value="0">Immediate (Now)</option>
                    <option value="0.5">In 30 minutes</option>
                    <option value="1">In 1 hour</option>
                    <option value="2">In 2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
                    Pickup Window Duration *
                  </label>
                  <select
                    value={windowDurationHours}
                    onChange={(e) => setWindowDurationHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
                  >
                    <option value="1">1 hour window</option>
                    <option value="2">2 hours window</option>
                    <option value="3">3 hours window</option>
                    <option value="4">4 hours window</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
                  Dispatch Point / Gate
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. Loading Dock B, Main Kitchen Gate"
                  className="w-full px-3 py-2 text-xs bg-[#FAF6EE] border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setGatingResult(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={
                    submitting ||
                    (modalMode === "select" && (!selectedItemId || !listingQty)) ||
                    (modalMode === "quick_add" && (!quickName.trim() || !quickQuantity))
                  }
                >
                  {submitting ? "Evaluating Safety Rules..." : "Run Safety Gating & Publish"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InstitutionSurplusListingsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-8 text-xs font-mono-numeral text-ink-soft">
          Loading surplus redistribution ledger...
        </div>
      }
    >
      <SurplusListingsContent />
    </React.Suspense>
  );
}
