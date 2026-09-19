"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CrateIcon,
  ShieldCheckIcon,
  TicketIcon,
  RouteIcon,
} from "@/components/icons/ledger-icons";

interface ClaimRecord {
  _id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  institutionName: string;
  pickupWindow: {
    start: string;
    end: string;
  };
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  status: "claimed" | "delivered" | "expired";
  deliveryStatus: "assigned" | "accepted" | "picked_up" | "delivered" | "confirmed";
  isConfirmed: boolean;
  confirmedAt?: string;
  claimedAt?: string;
}

export default function NgoMyClaimsPage() {
  const [claims, setClaims] = React.useState<ClaimRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchClaims = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/ngo/claims");
      const json = await res.json();
      if (res.ok) {
        setClaims(json.claims || []);
      }
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchClaims();
    const interval = setInterval(fetchClaims, 5000);
    return () => clearInterval(interval);
  }, [fetchClaims]);

  const handleConfirmReceipt = async (claimId: string) => {
    setFeedback(null);
    setConfirmingId(claimId);

    try {
      const res = await fetch(`/api/v1/ngo/claims/${claimId}/confirm-receipt`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: json.error || "Failed to confirm receipt.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: "Delivery receipt confirmed! Quantity has been recorded toward your organization's impact.",
      });

      fetchClaims();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error confirming receipt.",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const totalClaimedBatches = claims.length;
  const confirmedCount = claims.filter((c) => c.isConfirmed || c.deliveryStatus === "confirmed").length;
  const inTransitCount = totalClaimedBatches - confirmedCount;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
            Redistribution Dispatch Log
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink mt-0.5">
            Claimed Surplus Batches
          </h1>
        </div>

        <Button asChild variant="default" size="sm">
          <Link href="/app/ngo/browse">
            <TicketIcon size={14} />
            <span>+ Browse new surplus</span>
          </Link>
        </Button>
      </div>

      {/* Metrics Rail */}
      <div className="border border-line bg-[#FAF6EE] rounded-[6px] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line text-ink">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            Total Batches Claimed
          </div>
          <div className="font-mono-numeral text-2xl font-normal text-ink mt-1">
            {totalClaimedBatches}
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">locked exclusively</div>
        </div>

        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            In Transit / Pending Handoff
          </div>
          <div className="font-mono-numeral text-2xl font-normal text-saffron mt-1">
            {inTransitCount}
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">awaiting confirmation</div>
        </div>

        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            Confirmed Delivered
          </div>
          <div className="font-mono-numeral text-2xl font-normal text-basil mt-1">
            {confirmedCount}
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">credited to impact ledger</div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-[4px] border text-xs font-medium ${
            feedback.type === "success"
              ? "bg-basil/10 border-basil/40 text-basil"
              : "bg-clay-rust/10 border-clay-rust/40 text-clay-rust"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Ledger Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono-numeral text-ink-soft">
          Loading claimed batches ledger...
        </div>
      ) : claims.length === 0 ? (
        <div className="border border-line bg-[#FAF6EE] p-12 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-line bg-ledger-paper mx-auto flex items-center justify-center text-ink-soft">
            <CrateIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-normal text-ink">
            No surplus batches claimed yet
          </h2>
          <p className="text-xs text-ink-soft max-w-md mx-auto">
            Browse active listings in the marketplace. When your KYC verification is approved, you can lock
            and claim batches for direct pickup or delivery.
          </p>
          <Button asChild variant="default" size="sm">
            <Link href="/app/ngo/browse">Browse surplus listings</Link>
          </Button>
        </div>
      ) : (
        <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-x-auto shadow-none">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#EAE3D4] border-b border-line text-xs uppercase tracking-wider text-ink font-mono-numeral">
              <tr>
                <th className="px-4 py-3 font-semibold">Surplus Item</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Donor Kitchen</th>
                <th className="px-4 py-3 font-semibold">Pickup Window</th>
                <th className="px-4 py-3 font-semibold">Delivery Status</th>
                <th className="px-4 py-3 font-semibold text-right">Receipt Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {claims.map((claim) => {
                const startDate = new Date(claim.pickupWindow.start);
                const endDate = new Date(claim.pickupWindow.end);
                const isConfirmed = claim.isConfirmed || claim.deliveryStatus === "confirmed";
                const isConfirming = confirmingId === claim._id;

                return (
                  <tr key={claim._id} className="hover:bg-[#F3EDE0]/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{claim.itemName}</div>
                      <div className="text-[11px] text-ink-soft capitalize">
                        {claim.category.replace("_", " ")}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono-numeral font-medium text-ink">
                      {claim.quantity}{" "}
                      <span className="text-xs text-ink-soft">{claim.unit}</span>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-ink">
                        {claim.institutionName || "Verified Institution"}
                      </div>
                      <div className="text-ink-soft truncate max-w-[180px]" title={claim.pickupLocation?.address}>
                        {claim.pickupLocation?.address || "Main Dispatch"}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono-numeral text-xs text-ink">
                      <div>
                        {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                        {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-ink-soft text-[11px]">
                        until {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {isConfirmed ? (
                        <StatusBadge variant="confirmed" label="Confirmed Received" />
                      ) : (
                        <div className="space-y-1">
                          <StatusBadge
                            variant={
                              claim.deliveryStatus === "delivered"
                                ? "in_stock"
                                : claim.deliveryStatus === "picked_up"
                                ? "in_transit"
                                : "pending"
                            }
                            label={
                              claim.deliveryStatus === "delivered"
                                ? "Delivered — Tap Confirm"
                                : claim.deliveryStatus === "picked_up"
                                ? "In Transit"
                                : claim.deliveryStatus === "accepted"
                                ? "Driver Assigned"
                                : "Delivery partner assigning soon..."
                            }
                          />
                          <div className="text-[10px] text-ink-soft font-mono-numeral">
                            Status: {claim.deliveryStatus}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {isConfirmed ? (
                        <div className="text-xs text-basil font-mono-numeral font-medium">
                          ✓ Confirmed
                          {claim.confirmedAt && (
                            <div className="text-[10px] text-ink-soft">
                              {new Date(claim.confirmedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleConfirmReceipt(claim._id)}
                          disabled={isConfirming}
                          className="bg-basil hover:bg-[#254B34] text-[#FAF7F2] font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          {isConfirming ? "Confirming..." : "✓ Confirm Receipt"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
