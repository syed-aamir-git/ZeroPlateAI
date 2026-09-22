"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/ui/ticket-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TicketIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CrateIcon,
  RouteIcon,
} from "@/components/icons/ledger-icons";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";
import MarketplaceMap from "@/components/maps/marketplace-map";

interface SurplusListing {
  _id: string;
  inventoryItemId: string;
  institutionId: string;
  institutionName: string;
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
  createdAt: string;
}

interface NgoInfo {
  _id: string;
  orgName: string;
  kycStatus: "pending" | "approved" | "rejected";
  capacityPerWeek: number;
}

export default function NgoBrowsePage() {
  const [listings, setListings] = React.useState<SurplusListing[]>([]);
  const [ngo, setNgo] = React.useState<NgoInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "map">("grid");
  const [selectedMapId, setSelectedMapId] = React.useState<string | null>(null);
  const [claimingId, setClaimingId] = React.useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchBrowseData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/ngo/browse");
      const json = await res.json();
      if (res.ok) {
        setListings(json.listings || []);
        setNgo(json.ngo || null);
      }
    } catch (err) {
      console.error("Failed to fetch available surplus listings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBrowseData();
  }, [fetchBrowseData]);

  const handleClaim = async (listingId: string) => {
    setClaimFeedback(null);
    setClaimingId(listingId);

    try {
      const res = await fetch("/api/v1/ngo/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setClaimFeedback({
          type: "error",
          message: json.error || "Failed to claim surplus listing.",
        });
        // Refresh list if it was already claimed by another NGO
        if (res.status === 409) {
          fetchBrowseData();
        }
        return;
      }

      setClaimFeedback({
        type: "success",
        message: "Surplus listing claimed successfully! Pickup details are now in My Claims.",
      });

      // Refresh listings list
      fetchBrowseData();
    } catch (err: unknown) {
      setClaimFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error executing claim.",
      });
    } finally {
      setClaimingId(null);
    }
  };

  const isKycApproved = ngo?.kycStatus === "approved";

  const filteredListings = listings.filter((item) => {
    if (filterCategory === "all") return true;
    return item.category === filterCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
            Redistribution Marketplace
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink mt-0.5">
            Available Surplus Food
          </h1>
        </div>

        {ngo && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft font-mono-numeral">KYC Status:</span>
            <StatusBadge
              variant={isKycApproved ? "verified_safe" : "pending"}
              label={isKycApproved ? "KYC Approved" : "KYC Pending Verification"}
            />
          </div>
        )}
      </div>

      {/* KYC Warning Banner if not yet approved */}
      {!loading && !isKycApproved && (
        <div className="p-4 rounded-[6px] border border-saffron/40 bg-saffron/10 text-xs text-[#7E570A] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangleIcon size={16} />
            <span>KYC Verification Pending — Claiming Restricted</span>
          </div>
          <p className="leading-relaxed">
            Under Section 12.8 of the ZeroPlate Food Safety Policy, commercial food redistribution requires
            verified-recipient compliance. Your organization (<strong>{ngo?.orgName}</strong>) is currently in{" "}
            <strong>KYC Pending</strong> status. A Platform Administrator will review your registration details
            before you can claim active surplus batches.
          </p>
          <div>
            <Link
              href="/app/ngo/organization"
              className="font-medium underline hover:text-ink transition-colors"
            >
              Review or update KYC registration details →
            </Link>
          </div>
        </div>
      )}

      {/* Ledger-Line Orientation Checklist (Design PRD Section 12.3) */}
      <OnboardingChecklist
        storageKey="ngo_browse"
        title="NGO Recipient Onboarding Checklist"
        subtitle="Follow these operational milestones to safely claim and distribute surplus food."
        items={[
          {
            id: "kyc",
            title: "Complete organization KYC registration",
            description: "Provide statutory non-profit registration and service capacity",
            href: "/app/ngo/organization",
            isCompleted: isKycApproved,
          },
          {
            id: "browse",
            title: "Browse verified safe listings",
            description: "Inspect certified surplus batches with verified pickup windows",
            href: "/app/ngo/browse",
            isCompleted: listings.length > 0,
          },
          {
            id: "claim",
            title: "Lock and claim a surplus batch",
            description: "Coordinate with logistics delivery partners for prompt dispatch",
            href: "/app/ngo/browse",
            isCompleted: false,
          },
          {
            id: "confirm",
            title: "Confirm delivery receipt",
            description: "Close the loop to credit meals delivered and CO2e avoided",
            href: "/app/ngo/my-claims",
            isCompleted: false,
          },
        ]}
      />

      {/* Claim Feedback Banner */}
      {claimFeedback && (
        <div
          className={`p-3.5 rounded-[4px] border text-xs font-medium ${
            claimFeedback.type === "success"
              ? "bg-basil/10 border-basil/40 text-basil"
              : "bg-clay-rust/10 border-clay-rust/40 text-clay-rust"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{claimFeedback.message}</span>
            {claimFeedback.type === "success" && (
              <Link
                href="/app/ngo/my-claims"
                className="underline font-semibold hover:opacity-80"
              >
                View in My Claims →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Category Filter Pills and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-line bg-[#FAF6EE] p-2.5 rounded-[6px]">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: `All (${listings.length})` },
            { id: "cooked_food", label: "Cooked Food" },
            { id: "dairy", label: "Dairy" },
            { id: "bakery", label: "Bakery" },
            { id: "raw_produce", label: "Raw Produce" },
            { id: "packaged", label: "Packaged" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1 text-xs rounded-[4px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterCategory === tab.id
                  ? "bg-basil text-ledger-paper"
                  : "bg-ledger-paper text-ink-soft border border-line hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher: Grid vs Map */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-ledger-paper p-1 rounded border border-line">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === "grid"
                ? "bg-basil text-ledger-paper"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <span>⊞ Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === "map"
                ? "bg-basil text-ledger-paper"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <span>🗺️ Map View</span>
          </button>
        </div>
      </div>

      {/* Map View Display */}
      {viewMode === "map" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-soft font-mono-numeral bg-[#FAF6EE] p-3 rounded-[6px] border border-line">
            <span>Click any map pin to inspect batch details, pickup window, and claim directly.</span>
            <span className="font-semibold text-basil">{filteredListings.length} Active Listings Mapped</span>
          </div>
          <MarketplaceMap
            listings={filteredListings}
            selectedId={selectedMapId}
            onSelect={(id) => setSelectedMapId(id)}
            onClaim={handleClaim}
            isKycApproved={isKycApproved}
            className="w-full h-[520px]"
          />
        </div>
      ) : (
        <>
      {/* Ticket Card Grid (Design PRD Section 5.3) */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono-numeral text-ink-soft">
          Loading available surplus listings...
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="border border-line bg-[#FAF6EE] p-12 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-line bg-ledger-paper mx-auto flex items-center justify-center text-ink-soft">
            <TicketIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-normal text-ink">
            No active surplus listings in this category
          </h2>
          <p className="text-xs text-ink-soft max-w-md mx-auto">
            Participating kitchens publish surplus batches after production cycles. As soon as a batch passes
            automated safety gating, it will appear here for immediate claim.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => {
            const startDate = new Date(item.pickupWindow.start);
            const endDate = new Date(item.pickupWindow.end);
            const isClaiming = claimingId === item._id;

            return (
              <TicketCard
                key={item._id}
                className="flex flex-col justify-between hover:border-basil/60 transition-colors"
              >
                <div>
                  {/* Top stamp and Category */}
                  <div className="flex items-start justify-between gap-2 border-b border-line pb-3 mb-3">
                    <span className="text-[11px] font-mono-numeral uppercase tracking-wider text-ink-soft">
                      {item.category.replace("_", " ")}
                    </span>
                    <StatusBadge variant="verified_safe" label="Verified Safe" />
                  </div>

                  {/* Title & Quantity */}
                  <div className="space-y-1">
                    <h3 className="font-display text-xl font-normal text-ink leading-snug">
                      {item.itemName}
                    </h3>
                    <div className="font-mono-numeral text-2xl font-normal text-basil">
                      {item.quantity}{" "}
                      <span className="text-sm text-ink-soft font-normal">{item.unit}</span>
                    </div>
                  </div>

                  {/* Donor & Dispatch Details */}
                  <div className="mt-4 pt-3 border-t border-line text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-ink-soft">Donor Kitchen:</span>
                      <span className="font-medium text-ink text-right">
                        {item.institutionName || "Verified Institution"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-ink-soft">Pickup Point:</span>
                      <span className="text-ink text-right max-w-[200px] truncate" title={item.pickupLocation?.address}>
                        {item.pickupLocation?.address || "Main Dispatch Gate"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 font-mono-numeral text-[11px]">
                      <span className="text-ink-soft">Pickup Window:</span>
                      <span className="text-ink text-right">
                        {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Claim Action Button */}
                <div className="mt-5 pt-3 border-t border-line">
                  {isKycApproved ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleClaim(item._id)}
                      disabled={isClaiming}
                    >
                      {isClaiming ? "Locking Claim..." : "Claim Surplus Batch"}
                    </Button>
                  ) : (
                    <div className="space-y-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full opacity-60 cursor-not-allowed"
                        disabled
                      >
                        Claiming Restricted (KYC Pending)
                      </Button>
                      <p className="text-[10px] text-center text-ink-soft font-mono-numeral">
                        Section 12.8 compliance approval required
                      </p>
                    </div>
                  )}
                </div>
              </TicketCard>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
