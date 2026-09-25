"use client";

import * as React from "react";
import { ShieldCheckIcon, AlertTriangleIcon, UserIcon, RouteIcon } from "@/components/icons/ledger-icons";
import LocationPickerMap from "@/components/maps/location-picker-map";
import { CheckCircle2, XCircle, ShieldAlert, Building2 } from "lucide-react";

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
  location?: { lat?: number; lng?: number; address?: string };
}

export default function AdminNgoVerificationPage() {
  const [ngos, setNgos] = React.useState<NgoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const [openMapIds, setOpenMapIds] = React.useState<Record<string, boolean>>({});

  const toggleMap = (id: string) => {
    setOpenMapIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchNgos = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/ngo-verification?status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        setNgos(json.ngos || []);
      }
    } catch (err) {
      console.warn("Notice: Failed to fetch NGO queue:", err);
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
      const input = prompt("Please provide a compliance reason for rejecting this NGO's verification:");
      if (input === null) return; // cancelled
      reason = input.trim() || "Failed identity or document verification";
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
        message: `NGO verification status updated to ${action}d successfully.`,
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
            <ShieldCheckIcon size={14} />
            Compliance &amp; Verification
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
            NGO Verification Queue
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review and approve registered non-profit organizations and shelters before dispatching food batches.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium shadow-xs flex items-center gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 max-w-fit">
        {[
          { id: "pending", label: "Pending Review" },
          { id: "approved", label: "Approved NGOs" },
          { id: "rejected", label: "Rejected" },
          { id: "all", label: "All Records" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === tab.id
                ? "bg-white text-zinc-900 font-semibold shadow-xs border border-slate-200/60"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      {loading ? (
        <div className="p-16 text-center space-y-3 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-zinc-500">
            Loading NGO verification queue...
          </div>
        </div>
      ) : ngos.length === 0 ? (
        <div className="border border-slate-200/90 bg-white p-12 rounded-2xl text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-zinc-600">
            <ShieldCheckIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-bold text-zinc-900">
            No NGO applications in this queue
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {statusFilter === "pending"
              ? "All registered NGOs have been evaluated. New recipient registrations will appear here automatically for review."
              : "No records found matching this status filter."}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200/90 bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Organization Name</th>
                  <th className="px-4 py-3.5">Registration No.</th>
                  <th className="px-4 py-3.5">Contact Phone</th>
                  <th className="px-4 py-3.5">Service Area</th>
                  <th className="px-4 py-3.5">Weekly Capacity</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-zinc-700">
                {ngos.map((item) => {
                  const isActionLoading = actionLoadingId === item._id;

                  return (
                    <React.Fragment key={item._id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-zinc-900">
                          <div className="text-sm font-bold text-zinc-900">{item.orgName}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            Applied: {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-zinc-700 font-medium">
                          {item.registrationNumber}
                        </td>

                        <td className="px-4 py-3.5 text-zinc-700 font-medium">
                          {item.contactPhone}
                        </td>

                        <td className="px-4 py-3.5 text-zinc-600">
                          <div className="max-w-[180px] truncate" title={item.serviceArea}>
                            {item.serviceArea}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMap(item._id)}
                            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 mt-1 cursor-pointer hover:underline"
                          >
                            <RouteIcon size={11} />
                            <span>{openMapIds[item._id] ? "Hide Location" : "View Map 🗺️"}</span>
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-zinc-900 font-medium">
                          {item.capacityPerWeek} <span className="text-[11px] text-zinc-400 font-normal">kg/wk</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                              item.kycStatus === "approved"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : item.kycStatus === "rejected"
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {item.kycStatus === "pending" ? "Pending Review" : item.kycStatus === "approved" ? "Approved" : "Rejected"}
                          </span>
                          {item.kycRejectionReason && (
                            <div className="text-[11px] text-rose-600 mt-1 italic">
                              {item.kycRejectionReason}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          {item.kycStatus === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleKycAction(item._id, "approve")}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                {isActionLoading ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => handleKycAction(item._id, "reject")}
                                disabled={isActionLoading}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-400">
                              Reviewed: {item.kycReviewedAt ? new Date(item.kycReviewedAt).toLocaleDateString() : "Done"}
                            </div>
                          )}
                        </td>
                      </tr>
                      {openMapIds[item._id] && (
                        <tr key={`${item._id}-map`}>
                          <td colSpan={7} className="p-4 bg-slate-50/80 border-b border-slate-200/80">
                            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                              <div className="flex items-center justify-between text-xs text-zinc-600">
                                <span className="font-semibold text-zinc-900">
                                  Facility Location &amp; Operational Coverage Area
                                </span>
                                <span className="font-mono text-[11px] text-zinc-500">
                                  Coordinates: {item.location?.lat || 28.6139}, {item.location?.lng || 77.209}
                                </span>
                              </div>
                              <div className="rounded-xl overflow-hidden border border-slate-200">
                                <LocationPickerMap
                                  lat={item.location?.lat || 28.6139}
                                  lng={item.location?.lng || 77.209}
                                  radiusMeters={6000}
                                  pinType="ngo"
                                  theme="light"
                                  readOnly={true}
                                  label={`Applicant: ${item.orgName}`}
                                  className="w-full h-52 sm:h-60"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
