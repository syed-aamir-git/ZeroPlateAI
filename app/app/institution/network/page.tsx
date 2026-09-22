"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheckIcon, UserIcon } from "@/components/icons/ledger-icons";
import { StatusBadge } from "@/components/ui/status-badge";
import NetworkDirectoryMap from "@/components/maps/network-directory-map";

interface VerifiedNGO {
  _id: string;
  orgName: string;
  registrationNumber: string;
  serviceArea: string;
  capacityPerWeek: number;
  location?: {
    address?: string;
    lat?: number;
    lng?: number;
  };
  kycStatus: string;
  updatedAt?: string;
}

export default function InstitutionNetworkPage() {
  const [ngos, setNgos] = React.useState<VerifiedNGO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "map">("grid");

  React.useEffect(() => {
    async function loadNetwork() {
      try {
        const res = await fetch("/api/v1/institution/network");
        if (res.ok) {
          const data = await res.json();
          setNgos(data.network || []);
        }
      } catch (err) {
        console.error("Failed to load NGO network:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNetwork();
  }, []);

  const filteredNgos = ngos.filter(
    (ngo) =>
      ngo.orgName?.toLowerCase().includes(search.toLowerCase()) ||
      ngo.serviceArea?.toLowerCase().includes(search.toLowerCase()) ||
      ngo.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">
              Verified NGO Partner Directory
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-basil/15 text-basil border border-basil/20">
              Active Network
            </span>
          </div>
          <p className="text-sm text-ink-soft mt-1">
            Browse verified recipient organizations operating within regional redistribution routes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/institution/surplus-listings"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-[6px] bg-basil text-ledger-paper hover:bg-basil/90 transition-colors"
          >
            Create Surplus Listing
          </Link>
        </div>
      </div>

      {/* Trust Notice Block */}
      <div className="p-4 rounded-[6px] bg-ledger-paper border border-line text-xs text-ink-soft space-y-1">
        <div className="flex items-center gap-2 text-ink font-semibold text-sm">
          <ShieldCheckIcon size={16} className="text-basil" />
          <span>FSSAI & KYC Compliance Guarantee</span>
        </div>
        <p>
          All NGOs in this directory have submitted government registration credentials and completed verified food-safety onboarding.
          Direct contact information is routed automatically through verified matches to protect recipient privacy and dispatch integrity.
        </p>
      </div>

      {/* Filter / Search & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search by NGO name, area, or registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-line rounded-[6px] text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded border border-line">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === "grid"
                  ? "bg-basil text-ledger-paper"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <span>⊞ Directory Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === "map"
                  ? "bg-basil text-ledger-paper"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <span>🗺️ Partner Map</span>
            </button>
          </div>

          <div className="text-xs font-mono text-ink-soft whitespace-nowrap">
            {filteredNgos.length} verified {filteredNgos.length === 1 ? "partner" : "partners"}
          </div>
        </div>
      </div>

      {/* Directory Map View Display */}
      {viewMode === "map" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-soft font-mono bg-ledger-paper p-3 rounded-[6px] border border-line">
            <span>Geographical coverage of all verified NGO distribution hubs across your dispatch territory.</span>
            <span className="font-semibold text-basil">{filteredNgos.length} Hubs Plotted</span>
          </div>
          <NetworkDirectoryMap
            entities={filteredNgos.map((n) => ({
              _id: n._id,
              name: n.orgName,
              subtitle: n.serviceArea,
              location: n.location,
              badgeText: "Verified Recipient",
              details: {
                Registration: n.registrationNumber,
                Capacity: `${n.capacityPerWeek} kg/week`,
                "Service Area": n.serviceArea,
              },
            }))}
            entityType="ngo"
            theme="light"
            className="w-full h-[500px]"
          />
        </div>
      ) : loading ? (
        <div className="py-16 text-center text-sm text-ink-soft font-mono animate-pulse">
          Loading verified NGO network...
        </div>
      ) : filteredNgos.length === 0 ? (
        <div className="p-12 text-center rounded-[6px] border border-dashed border-line bg-white/40 space-y-3">
          <UserIcon size={32} className="mx-auto text-ink-soft" />
          <h3 className="font-semibold text-ink">No Verified NGOs Found</h3>
          <p className="text-xs text-ink-soft max-w-md mx-auto">
            {search
              ? "No verified NGOs match your search filter."
              : "No NGOs have been verified in this cluster yet. When pending applications are approved by Platform Admins, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNgos.map((ngo) => (
            <div
              key={ngo._id}
              className="p-5 rounded-[6px] bg-white border border-line flex flex-col justify-between space-y-4 hover:border-basil/40 transition-colors shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-ink text-base">
                    {ngo.orgName}
                  </h3>
                  <StatusBadge status="verified_safe" label="Approved KYC" />
                </div>
                <div className="text-xs text-ink-soft font-mono">
                  Reg: {ngo.registrationNumber || "Government Registered"}
                </div>
              </div>

              <div className="pt-3 border-t border-line/60 text-xs space-y-1.5 text-ink-soft">
                <div className="flex justify-between">
                  <span>Service Area:</span>
                  <span className="font-medium text-ink">
                    {ngo.serviceArea || "Metropolitan Zone"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly Intake Capacity:</span>
                  <span className="font-mono font-semibold text-ink">
                    {ngo.capacityPerWeek?.toLocaleString() || 0} kg/wk
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-[11px] text-basil font-medium flex items-center gap-1.5">
                  <ShieldCheckIcon size={14} className="shrink-0" />
                  <span>Eligible for automatic surplus dispatch match</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
