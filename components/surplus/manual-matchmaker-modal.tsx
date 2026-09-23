"use client";

import * as React from "react";
import {
  HeartHandshake,
  MapPin,
  Truck,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateNgo {
  ngoId: string;
  ngoName: string;
  address: string;
  distanceKm: number;
  dailyCapacityMeals: number;
  hasOwnVehicle: boolean;
  verificationStatus: string;
  compatibilityScore: number;
  recommendedEtaMinutes: number;
}

interface ManualMatchmakerModalProps {
  listingId: string;
  itemName: string;
  quantity: number;
  unit: string;
  urgencyTier?: "critical_red" | "urgent_yellow" | "safe_green";
  isOpen: boolean;
  onClose: () => void;
  onMatchedSuccess: () => void;
}

export default function ManualMatchmakerModal({
  listingId,
  itemName,
  quantity,
  unit,
  urgencyTier,
  isOpen,
  onClose,
  onMatchedSuccess,
}: ManualMatchmakerModalProps) {
  const [candidates, setCandidates] = React.useState<CandidateNgo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [assigningId, setAssigningId] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || !listingId) return;

    async function loadCandidates() {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        const res = await fetch(`/api/v1/institution/matchmake?listingId=${listingId}`);
        const data = await res.json();
        if (res.ok && data.candidates) {
          setCandidates(data.candidates);
        } else {
          setError(data.error || "No candidate NGOs available.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load candidate NGOs");
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, [isOpen, listingId]);

  const handleAssign = async (ngoId: string, ngoName: string) => {
    try {
      setAssigningId(ngoId);
      setError(null);
      const res = await fetch("/api/v1/institution/matchmake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, ngoId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Successfully assigned to ${ngoName}! Courier dispatch created.`);
        setTimeout(() => {
          onMatchedSuccess();
          onClose();
        }, 1500);
      } else {
        setError(data.error || "Failed to assign match.");
      }
    } catch (err: any) {
      setError(err.message || "Network error while assigning match.");
    } finally {
      setAssigningId(null);
    }
  };

  if (!isOpen) return null;

  const isRed = urgencyTier === "critical_red";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-ledger-paper border border-line rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-basil/15 text-basil">
                <HeartHandshake className="w-5 h-5" />
              </span>
              <h3 className="font-serif text-lg font-bold text-ink">
                Manual Matchmaking Engine
              </h3>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Select and assign a verified recipient organization ranked by distance, capacity, and urgency compatibility.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-soft hover:text-ink hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Listing Banner */}
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 ${
            isRed
              ? "bg-red-500/10 border-red-500/30 text-red-800"
              : "bg-ledger-surface border-line text-ink"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm">{itemName}</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-black/5">
                {quantity} {unit}
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              {isRed
                ? "🔴 CRITICAL RED PRIORITY (<2h) — Proximity and instant dispatch prioritized."
                : "Standard redistribution priority."}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider block opacity-75">
              Matching Formula
            </span>
            <span className="text-xs font-mono font-bold text-basil">
              M = 35%D + 30%Q + 20%T + 15%C
            </span>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Candidate List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-ink-soft">
            <span>RECOMMENDED RECIPIENT NGOS</span>
            <span>RANKED BY COMPATIBILITY</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-ink-soft">
              Computing multi-variable compatibility matrix across verified non-profits...
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-soft border border-dashed border-line rounded-lg">
              No verified NGOs currently registered in range. Check platform admin KYC approvals.
            </div>
          ) : (
            candidates.map((ngo, idx) => (
              <div
                key={ngo.ngoId}
                className="p-3.5 rounded-lg border border-line bg-ledger-surface hover:border-basil/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-basil/15 text-basil text-xs font-bold font-mono flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-serif font-bold text-sm text-ink">{ngo.ngoName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified 80G
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-ink-soft flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {ngo.distanceKm} km away
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      ~{ngo.recommendedEtaMinutes} min transit
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-stone-400" />
                      {ngo.hasOwnVehicle ? "Self-pickup fleet ready" : "Third-party courier"}
                    </span>
                    <span>•</span>
                    <span>Cap: {ngo.dailyCapacityMeals} meals/day</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-ink-soft block uppercase">
                      Compatibility
                    </span>
                    <span className="text-base font-mono font-extrabold text-basil">
                      {ngo.compatibilityScore}%
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={idx === 0 ? "default" : "outline"}
                    disabled={Boolean(assigningId)}
                    onClick={() => handleAssign(ngo.ngoId, ngo.ngoName)}
                    className="text-xs h-9 cursor-pointer"
                  >
                    {assigningId === ngo.ngoId ? "Assigning..." : "Assign & Dispatch"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
