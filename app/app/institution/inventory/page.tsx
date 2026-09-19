"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CrateIcon,
  TicketIcon,
} from "@/components/icons/ledger-icons";

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  preparedOrReceivedAt: string;
  expiryEstimateAt: string;
  status: "in_stock" | "surplus" | "listed" | "in_progress" | "claimed" | "delivered" | "expired";
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
      const prepDate = new Date(now.getTime() - Number(prepTimeHoursAgo) * 60 * 60 * 1000);
      const expiryDate = new Date(now.getTime() + Number(expiryHoursFromNow) * 60 * 60 * 1000);

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
      setAddError(err instanceof Error ? err.message : "Error creating item.");
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
    if (!confirm("Are you sure you want to remove this item from the ledger?")) return;
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

  const filteredItems = items.filter((item) => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
            Operational Kitchen Ledger
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink mt-0.5">
            Inventory & Expiry Control
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddOpen(true)}
          >
            <CrateIcon size={14} />
            <span>+ Add inventory item</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-line bg-[#FAF6EE] p-3 rounded-[6px]">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All Items" },
            { id: "cooked_food", label: "Cooked Food" },
            { id: "dairy", label: "Dairy" },
            { id: "bakery", label: "Bakery" },
            { id: "raw_produce", label: "Raw Produce" },
            { id: "packaged", label: "Packaged" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1 text-xs rounded-[4px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterCategory === cat.id
                  ? "bg-basil text-ledger-paper"
                  : "bg-ledger-paper text-ink-soft border border-line hover:text-ink"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by item name..."
          className="px-3 py-1.5 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-1 focus:ring-basil w-full sm:w-56"
        />
      </div>

      {/* Dense Ledger Table (Design PRD Section 5.2) */}
      {loading ? (
        <div className="p-8 text-center text-xs font-mono-numeral text-ink-soft">
          Loading active inventory ledger...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="border border-line bg-[#FAF6EE] p-10 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-line bg-ledger-paper mx-auto flex items-center justify-center text-ink-soft">
            <CrateIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-normal text-ink">
            No items match this ledger filter
          </h2>
          <p className="text-xs text-ink-soft max-w-sm mx-auto">
            Log raw ingredients or completed batches to begin tracking safety windows and automated surplus flagging.
          </p>
          <Button variant="default" size="sm" onClick={() => setIsAddOpen(true)}>
            + Add item now
          </Button>
        </div>
      ) : (
        <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-x-auto shadow-none">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#EAE3D4] border-b border-line text-xs uppercase tracking-wider text-ink font-mono-numeral">
              <tr>
                <th className="px-4 py-3 font-semibold">Item Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Prepared / Logged</th>
                <th className="px-4 py-3 font-semibold">Expiry Window</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredItems.map((item) => {
                const exp = item.expiryStatus;
                const isNearing = exp?.isNearingExpiry;
                const isDelivered = item.status === "delivered" || item.linkedListing?.status === "delivered";
                const isInProgress =
                  !isDelivered &&
                  (item.status === "in_progress" ||
                    item.status === "claimed" ||
                    item.status === "listed" ||
                    item.status === "surplus" ||
                    item.linkedListing?.status === "claimed" ||
                    item.linkedListing?.status === "matched" ||
                    item.linkedListing?.status === "pending");
                const isExp = !isDelivered && !isInProgress && (item.status === "expired" || exp?.isExpired);

                return (
                  <tr
                    key={item._id}
                    className={`hover:bg-[#F3EDE0]/80 transition-colors ${
                      isNearing && !isDelivered && !isInProgress ? "bg-clay-rust/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-ink">
                      <div className="flex items-center gap-2">
                        {isNearing && !isDelivered && !isInProgress && (
                          <span
                            className="w-2 h-2 rounded-full bg-clay-rust shrink-0"
                            title="Nearing Expiry (Auto-Flagged)"
                          />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-ink-soft text-xs">
                      {item.category.replace("_", " ")}
                    </td>

                    <td className="px-4 py-3 font-ledger-mono text-ink">
                      {item.quantity} <span className="text-xs text-ink-soft">{item.unit}</span>
                    </td>

                    <td className="px-4 py-3 font-ledger-mono text-xs text-ink-soft">
                      {new Date(item.preparedOrReceivedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-3 font-ledger-mono text-xs">
                      {isDelivered ? (
                        <span className="text-basil font-semibold">Delivered</span>
                      ) : isInProgress ? (
                        <span className="text-[#7E570A] font-semibold">In Redistribution</span>
                      ) : isExp ? (
                        <span className="text-[#8A4331] font-semibold">Expired</span>
                      ) : isNearing ? (
                        <span className="text-clay-rust font-semibold">
                          In {exp?.hoursRemaining}h (Nearing limit)
                        </span>
                      ) : (
                        <span className="text-ink-soft">
                          In {exp?.hoursRemaining}h
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {isDelivered ? (
                        <StatusBadge variant="delivered" label="Delivered" />
                      ) : isInProgress ? (
                        <StatusBadge variant="pending" label="In Progress" />
                      ) : isExp ? (
                        <StatusBadge variant="expired" label="Expired" />
                      ) : isNearing ? (
                        <StatusBadge variant="nearing_expiry" label="Nearing Expiry" />
                      ) : (
                        <StatusBadge variant="verified_safe" label="In Stock" />
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === "in_stock" && !isExp && !isDelivered && !isInProgress && (
                          <button
                            onClick={() => handleMarkSurplus(item._id)}
                            className="px-2.5 py-1 rounded-[4px] bg-ledger-paper border border-basil text-basil text-xs font-medium hover:bg-basil hover:text-ledger-paper transition-colors cursor-pointer"
                          >
                            Mark surplus
                          </button>
                        )}

                        {item.status === "surplus" && !isDelivered && (
                          <Button asChild variant="default" size="sm">
                            <Link href={`/app/institution/surplus-listings?itemId=${item._id}`}>
                              <TicketIcon size={12} />
                              <span>List batch</span>
                            </Link>
                          </Button>
                        )}

                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-ink-soft hover:text-[#8A4331] p-1 text-xs transition-colors cursor-pointer"
                          title="Delete item"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Inventory Item Dialog Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#FAF6EE] border border-line rounded-[6px] shadow-warm-overlay p-6 sm:p-8 space-y-6 text-left">
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
                  Operational Input
                </span>
                <h2 className="font-display text-xl font-normal text-ink">
                  Log Kitchen Inventory Batch
                </h2>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-ink-soft hover:text-ink text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-[6px] bg-[#8A4331]/10 border border-[#8A4331]/30 text-[#8A4331] text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Steamed Basmati Rice & Dal"
                  className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink focus:outline-none focus:ring-2 focus:ring-basil"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Food Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink cursor-pointer"
                  >
                    <option value="cooked_food">Cooked Food (4h rule)</option>
                    <option value="dairy">Dairy Products (12h limit)</option>
                    <option value="bakery">Bakery & Breads</option>
                    <option value="raw_produce">Raw Produce / Veg</option>
                    <option value="packaged">Packaged / FMCG</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
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
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink font-ledger-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink cursor-pointer"
                    >
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="pcs">pcs</option>
                      <option value="portions">portions</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Prepared Time
                  </label>
                  <select
                    value={prepTimeHoursAgo}
                    onChange={(e) => setPrepTimeHoursAgo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink cursor-pointer"
                  >
                    <option value="0.5">30 minutes ago</option>
                    <option value="1">1 hour ago</option>
                    <option value="2">2 hours ago</option>
                    <option value="3">3 hours ago</option>
                    <option value="5">5 hours ago (Exceeds cooked limit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Estimated Shelf-Life
                  </label>
                  <select
                    value={expiryHoursFromNow}
                    onChange={(e) => setExpiryHoursFromNow(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink cursor-pointer"
                  >
                    <option value="1.5">In 1.5 hours (Nearing limit)</option>
                    <option value="3">In 3 hours</option>
                    <option value="6">In 6 hours</option>
                    <option value="24">In 24 hours</option>
                    <option value="48">In 48 hours</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="default"
                  size="sm"
                >
                  {submitting ? "Logging batch..." : "Log to Ledger"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
