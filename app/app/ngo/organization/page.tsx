"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ShieldCheckIcon,
  AlertTriangleIcon,
} from "@/components/icons/ledger-icons";
import LocationPickerMap from "@/components/maps/location-picker-map";

interface NgoProfile {
  _id: string;
  orgName: string;
  registrationNumber: string;
  contactPhone: string;
  serviceArea: string;
  capacityPerWeek: number;
  kycStatus: "pending" | "approved" | "rejected";
  reliabilityScore: number;
  location: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export default function NgoOrganizationPage() {
  const [profile, setProfile] = React.useState<NgoProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form fields
  const [orgName, setOrgName] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [serviceArea, setServiceArea] = React.useState("");
  const [capacityPerWeek, setCapacityPerWeek] = React.useState("500");
  const [lat, setLat] = React.useState("28.6139");
  const [lng, setLng] = React.useState("77.2090");

  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/ngo/profile");
      const json = await res.json();
      if (res.ok && json.ngo) {
        setProfile(json.ngo);
        setOrgName(json.ngo.orgName || "");
        setContactPhone(json.ngo.contactPhone || "");
        setServiceArea(json.ngo.serviceArea || "");
        setCapacityPerWeek(String(json.ngo.capacityPerWeek || "500"));
        setLat(String(json.ngo.location?.lat || "28.6139"));
        setLng(String(json.ngo.location?.lng || "77.2090"));
      }
    } catch (err) {
      console.error("Failed to load NGO profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/ngo/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          contactPhone,
          serviceArea,
          capacityPerWeek: Number(capacityPerWeek),
          location: {
            lat: Number(lat),
            lng: Number(lng),
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || "Failed to update profile.");
        return;
      }

      setProfile(json.ngo);
      setSuccessMessage("Organization profile updated successfully.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs font-mono-numeral text-ink-soft">
        Loading organization KYC profile...
      </div>
    );
  }

  const isApproved = profile?.kycStatus === "approved";
  const isRejected = profile?.kycStatus === "rejected";

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Header */}
      <div className="border-b border-line pb-4">
        <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
          Verified Recipient Registration
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink mt-0.5">
          Organization KYC & Profile
        </h1>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-[4px] border border-basil/40 bg-basil/10 text-basil text-xs font-medium">
          ✓ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-[4px] border border-clay-rust/40 bg-clay-rust/10 text-clay-rust text-xs font-medium">
          ✕ {errorMessage}
        </div>
      )}

      {/* KYC Status Banner */}
      <div className="border border-line bg-[#FAF6EE] rounded-[6px] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="text-xs font-mono-numeral uppercase tracking-wider text-ink-soft">
              Verification Compliance Status
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-display text-2xl text-ink">
                {isApproved
                  ? "KYC Verified & Approved"
                  : isRejected
                  ? "KYC Verification Rejected"
                  : "KYC Pending Verification"}
              </span>
              <StatusBadge
                variant={isApproved ? "verified_safe" : isRejected ? "rejected" : "pending"}
                label={isApproved ? "Approved Recipient" : isRejected ? "Rejected" : "Pending Approval"}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-numeral">
            <div>
              <span className="text-ink-soft block text-[11px]">Reliability Score</span>
              <span className="text-ink font-semibold text-lg">
                {profile?.reliabilityScore || 100}%
              </span>
            </div>
          </div>
        </div>

        {/* Informative Note */}
        {!isApproved && (
          <div className="p-4 rounded-[4px] border border-saffron/40 bg-saffron/10 text-xs text-[#7E570A] space-y-1.5 leading-relaxed">
            <div className="font-semibold flex items-center gap-2">
              <AlertTriangleIcon size={14} />
              <span>Section 12.8 Food Safety Compliance Requirement</span>
            </div>
            <p>
              To maintain the platform's dual-layer food safety integrity, only vetted nonprofit
              organizations can claim commercial surplus food. Your legal registration number is
              currently queued for review by a Platform Administrator. Once approved, all marketplace
              listings become immediately claimable.
            </p>
          </div>
        )}

        {isApproved && (
          <div className="p-4 rounded-[4px] border border-basil/40 bg-basil/10 text-xs text-basil space-y-1 leading-relaxed">
            <div className="font-semibold flex items-center gap-2">
              <ShieldCheckIcon size={14} />
              <span>Recipient Organization Approved</span>
            </div>
            <p>
              Your organization is fully authorized to claim surplus batches across all commercial kitchen
              partners in your designated service area.
            </p>
          </div>
        )}
      </div>

      {/* KYC Profile Edit Form */}
      <form onSubmit={handleSave} className="border border-line bg-[#FAF6EE] rounded-[6px] p-6 space-y-6">
        <div className="border-b border-line pb-3">
          <h2 className="font-display text-xl font-normal text-ink">
            Legal Entity & Logistics Profile
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Keep your dispatch contact and service area coordinates current for accurate proximity matching.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
              Organization Legal Name *
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
              NGO Registration Number
            </label>
            <input
              type="text"
              value={profile?.registrationNumber || ""}
              disabled
              className="w-full px-3 py-2 text-xs bg-[#EAE3D4]/50 border border-line rounded-[4px] text-ink-soft font-mono-numeral cursor-not-allowed"
              title="Legal registration number can only be modified via Platform Admin"
            />
            <span className="text-[10px] text-ink-soft font-mono-numeral">
              Immutable KYC identifier
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
              Emergency Dispatch Contact Phone *
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink font-mono-numeral focus:ring-1 focus:ring-basil outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
              Weekly Distribution Capacity (kg/week) *
            </label>
            <input
              type="number"
              value={capacityPerWeek}
              onChange={(e) => setCapacityPerWeek(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink font-mono-numeral focus:ring-1 focus:ring-basil outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
            Designated Operational Service Area *
          </label>
          <input
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            required
            placeholder="e.g. South Delhi, Okhla, Ashram, Lajpat Nagar"
            className="w-full px-3 py-2 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
          />
        </div>

        {/* Interactive Location Pin on Leaflet Map */}
        <div className="space-y-2">
          <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft">
            NGO Facility Location & Service Coverage Map *
          </label>
          <p className="text-[11px] text-ink-soft">
            Drag the pin or click on the map to set your verified distribution center coordinates.
          </p>
          <LocationPickerMap
            lat={Number(lat) || 28.6139}
            lng={Number(lng) || 77.209}
            radiusMeters={6000}
            pinType="ngo"
            theme="light"
            label="Verified NGO Center"
            onChange={({ lat: newLat, lng: newLng }) => {
              setLat(String(newLat));
              setLng(String(newLng));
            }}
            className="w-full h-56 sm:h-64"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
              Latitude *
            </label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink font-mono-numeral focus:ring-1 focus:ring-basil outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
              Longitude *
            </label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink font-mono-numeral focus:ring-1 focus:ring-basil outline-none"
            />
          </div>
        </div>

        {profile && (
          <div className="text-xs text-ink-soft font-mono-numeral flex items-center justify-between border-t border-line pt-4">
            <span>NGO ID: {profile._id}</span>
            <span>Registered: {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="default" size="sm" disabled={saving}>
            {saving ? "Updating Profile..." : "Save Profile Details"}
          </Button>
        </div>
      </form>
    </div>
  );
}
