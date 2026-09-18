"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon, AlertTriangleIcon, UserIcon } from "@/components/icons/ledger-icons";

interface NgoItem {
  _id: string;
  userId: string;
  orgName: string;
  registrationNumber: string;
  contactPhone: string;
  serviceArea: string;
  capacityPerWeek: number;
  kycStatus: "pending" | "approved" | "rejected";
  reliabilityScore: number;
  createdAt: string;
  kycReviewedAt?: string;
  kycRejectionReason?: string;
}

export default function AdminNgoVerificationPage() {
  const [ngos, setNgos] = React.useState<NgoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchNgos = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/ngo-verification?status=${statusFilter}`);
      const json = await res.json();
      if (res.ok) {
        setNgos(json.ngos || []);
      }
    } catch (err) {
      console.error("Failed to fetch NGO queue:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchNgos();
  }, [fetchNgos]);

  const handleKycAction = async (ngoId: string, action: "approve" | "reject") => {
    let reason = "";
    if (action === "reject") {
      const input = prompt("Please provide a statutory compliance reason for rejecting this NGO's KYC:");
      if (input === null) return; // cancelled
      reason = input.trim() || "Failed statutory identity verification";
    }

    setActionLoadingId(ngoId);
    setFeedback(null);

    try {
      const res = await fetch("/api/v1/admin/ngo-verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoId, action, reason }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: json.error || `Failed to ${action} NGO.` });
        return;
      }

      setFeedback({
        type: "success",
        message: `NGO KYC ${action}d successfully. Action permanently archived to MongoDB auditLogs.`,
      });

      fetchNgos();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error executing KYC action.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = ngos.filter((n) => n.kycStatus === "pending").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#5A3653] pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-[#D9A441]">
            Regulatory Recipient Vetting (Section 12.8)
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-0.5">
            NGO KYC Verification Queue
          </h1>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-[6px] border text-xs font-medium ${
            feedback.type === "success"
              ? "bg-[#2F4B3A]/30 border-[#2F4B3A] text-[#86C29B]"
              : "bg-clay-rust/30 border-clay-rust text-[#F4A88E]"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border border-[#5A3653] bg-[#3D2538] p-2.5 rounded-[6px]">
        {[
          { id: "pending", label: "Pending Review Queue" },
          { id: "approved", label: "Approved Recipients" },
          { id: "rejected", label: "Rejected Applications" },
          { id: "all", label: "All Records" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 text-xs rounded-[4px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === tab.id
                ? "bg-[#D9A441] text-[#24211C] font-bold"
                : "bg-[#4A2E44] text-[#C9B9C7] hover:text-[#F3EEE2] border border-[#5A3653]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono-numeral text-[#C9B9C7]">
          Loading NGO verification queue...
        </div>
      ) : ngos.length === 0 ? (
        <div className="border border-[#5A3653] bg-[#3D2538] p-12 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-[#5A3653] bg-[#4A2E44] mx-auto flex items-center justify-center text-[#D9A441]">
            <ShieldCheckIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-medium text-[#F3EEE2]">
            No NGO applications in this queue
          </h2>
          <p className="text-xs text-[#C9B9C7] max-w-md mx-auto">
            {statusFilter === "pending"
              ? "All registered NGOs have been evaluated. New recipient registrations will appear here for statutory KYC review."
              : "No records found matching this status filter."}
          </p>
        </div>
      ) : (
        <div className="border border-[#5A3653] bg-[#3D2538] rounded-[6px] overflow-x-auto shadow-none">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#4A2E44] border-b border-[#5A3653] text-[#F3EEE2] uppercase font-mono-numeral text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Organization Name</th>
                <th className="px-4 py-3 font-semibold">Registration No.</th>
                <th className="px-4 py-3 font-semibold">Contact Phone</th>
                <th className="px-4 py-3 font-semibold">Service Area</th>
                <th className="px-4 py-3 font-semibold">Weekly Capacity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5A3653] text-[#D4CBBF]">
              {ngos.map((item) => {
                const isActionLoading = actionLoadingId === item._id;

                return (
                  <tr key={item._id} className="hover:bg-[#4A2E44]/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#F3EEE2] text-sm">{item.orgName}</div>
                      <div className="text-[10px] text-[#C9B9C7] font-mono-numeral">
                        Applied: {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono-numeral text-[#D9A441]">
                      {item.registrationNumber}
                    </td>

                    <td className="px-4 py-3 font-mono-numeral text-[#F3EEE2]">
                      {item.contactPhone}
                    </td>

                    <td className="px-4 py-3 text-[#D4CBBF] max-w-[180px] truncate" title={item.serviceArea}>
                      {item.serviceArea}
                    </td>

                    <td className="px-4 py-3 font-mono-numeral text-[#F3EEE2]">
                      {item.capacityPerWeek} <span className="text-[10px] text-[#C9B9C7]">kg/wk</span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono-numeral uppercase font-semibold ${
                          item.kycStatus === "approved"
                            ? "bg-[#2F4B3A] text-[#86C29B] border border-[#2F4B3A]"
                            : item.kycStatus === "rejected"
                            ? "bg-clay-rust/20 text-[#F4A88E] border border-clay-rust"
                            : "bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40"
                        }`}
                      >
                        {item.kycStatus === "pending" ? "Pending Review" : item.kycStatus}
                      </span>
                      {item.kycRejectionReason && (
                        <div className="text-[10px] text-[#F4A88E] mt-0.5 italic">
                          {item.kycRejectionReason}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {item.kycStatus === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleKycAction(item._id, "approve")}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-[4px] bg-[#2F4B3A] hover:bg-[#3D614B] text-[#F3EEE2] font-semibold text-xs transition-colors cursor-pointer"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleKycAction(item._id, "reject")}
                            disabled={isActionLoading}
                            className="px-2.5 py-1.5 rounded-[4px] bg-clay-rust/20 border border-clay-rust hover:bg-clay-rust text-[#F4A88E] hover:text-[#F3EEE2] font-medium text-xs transition-colors cursor-pointer"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono-numeral text-[#C9B9C7]">
                          Reviewed: {item.kycReviewedAt ? new Date(item.kycReviewedAt).toLocaleDateString() : "Done"}
                        </div>
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
