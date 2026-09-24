"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Sparkles,
  Save,
  Layers,
  ArrowRight,
  Info,
  Lock,
  AlertTriangle,
  Phone,
  Scale,
  Clock,
  Ticket,
  Package,
  Award,
} from "lucide-react";
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
      setSuccessMessage("Organization profile and dispatch hub coordinates updated successfully.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl max-w-7xl mx-auto">
        <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
          Loading organization KYC compliance profile...
        </p>
      </div>
    );
  }

  const isApproved = profile?.kycStatus === "approved";
  const isRejected = profile?.kycStatus === "rejected";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Operations Title & Fast Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Organization KYC &amp; Logistics Profile
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border whitespace-nowrap ${
                isApproved
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-amber-100 text-amber-900 border-amber-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isApproved ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              <span>{isApproved ? "KYC Approved & Active" : "KYC Under Verification"}</span>
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Statutory non-profit registration, verified recipient compliance under Section 12.8, emergency dispatch routing, and distribution center coordinates.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              Section 12.8 Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <MapPin className="w-3 h-3 text-blue-600" />
              6 km Distribution Radius
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              FSSAI Vetted Recipient
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <Link
            href="/app/ngo/my-claims"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <Package className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>My Claimed Batches</span>
          </Link>
          <Link
            href="/app/ngo/browse"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Ticket className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>+ Browse Surplus Food</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. 4 Vibrant Theme KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emerald Theme - KYC Status */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
              Compliance Status
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-serif text-lg sm:text-xl font-bold text-stone-900">
            {isApproved ? "Approved Recipient" : isRejected ? "Rejected" : "Pending Verification"}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                isApproved
                  ? "bg-emerald-100/90 text-emerald-800 border-emerald-200"
                  : "bg-amber-100/90 text-amber-900 border-amber-200"
              }`}
            >
              {isApproved ? "Authorized to Claim" : "Under Platform Review"}
            </span>
          </div>
        </div>

        {/* Card 2: Blue Theme - Reliability Rating */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
              Reliability Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1">
            {profile?.reliabilityScore || 100}%
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
              Zero Missed Pickups
            </span>
          </div>
        </div>

        {/* Card 3: Amber Theme - Weekly Intake Quota */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
              Intake Quota
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
            {Number(capacityPerWeek).toLocaleString()}
            <span className="text-xs font-sans font-medium text-amber-800">kg/wk</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
              ~{Math.round(Number(capacityPerWeek) * 2.5).toLocaleString()} Meals / Wk
            </span>
          </div>
        </div>

        {/* Card 4: Violet Theme - Distribution Pin */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
              Hub Coordinates
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-base font-bold text-purple-900 truncate">
            {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
              6 km Proximity Matching
            </span>
          </div>
        </div>
      </div>

      {/* 3. KYC Verification Status Card */}
      <div className="border border-stone-200 bg-white rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-stone-500">
              Statutory Non-Profit Verification
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="font-serif text-2xl font-bold text-stone-900">
                {isApproved
                  ? "KYC Verified & Cleared"
                  : isRejected
                  ? "KYC Verification Rejected"
                  : "KYC Verification in Progress"}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
              >
                {isApproved ? "Approved Recipient" : "Pending Approval"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
              Reg: <strong>{profile?.registrationNumber || "Government Registered"}</strong>
            </span>
          </div>
        </div>

        {/* Informative Guidance */}
        {!isApproved ? (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-1.5 leading-relaxed">
            <div className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Section 12.8 Food Safety Compliance Requirement</span>
            </div>
            <p className="text-stone-700">
              To maintain dual-layer food safety traceability, only vetted non-profit organizations can claim commercial surplus batches. Your registration credentials are currently queued for verification by a Platform Administrator. Once approved, all marketplace listings become immediately claimable.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900 space-y-1 leading-relaxed">
            <div className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Recipient Organization Fully Approved</span>
            </div>
            <p className="text-stone-700">
              Your organization is authorized to claim surplus batches across all commercial kitchen partners in your designated service area with automated courier delivery dispatch.
            </p>
          </div>
        )}
      </div>

      {/* 4. Legal Entity & Logistics Profile Form */}
      <form
        onSubmit={handleSave}
        className="border border-stone-200 bg-white rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs"
      >
        <div className="border-b border-stone-100 pb-4">
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Legal Entity &amp; Logistics Hub Profile
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Keep your dispatch contact and service area coordinates current for accurate proximity matching and driver routing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Organization Legal Name *
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              placeholder="e.g. Hope Community Food Relief Foundation"
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                NGO Registration Number
              </label>
              <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked KYC ID
              </span>
            </div>
            <input
              type="text"
              value={profile?.registrationNumber || ""}
              disabled
              className="w-full px-3.5 py-2.5 text-sm bg-stone-100/70 border border-stone-200 rounded-xl text-stone-500 font-mono cursor-not-allowed"
              title="Legal registration number can only be modified via Platform Admin"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Emergency Dispatch Contact Phone *
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Weekly Distribution Capacity (kg/week) *
            </label>
            <input
              type="number"
              value={capacityPerWeek}
              onChange={(e) => setCapacityPerWeek(e.target.value)}
              required
              min="10"
              placeholder="500"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Designated Operational Service Area *
          </label>
          <input
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            required
            placeholder="e.g. South Delhi, Okhla, Ashram, Lajpat Nagar, Nizamuddin"
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
          />
        </div>

        {/* Interactive Location Pin on Leaflet Map */}
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-0.5">
              NGO Facility Center &amp; Service Coverage Radius Map *
            </label>
            <p className="text-xs text-stone-500">
              Drag the pin or click on the map to set your verified distribution center coordinates for algorithmic proximity dispatch.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xs">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Latitude Coordinates *
            </label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Longitude Coordinates *
            </label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
            />
          </div>
        </div>

        {profile && (
          <div className="text-xs text-stone-500 font-mono flex flex-col sm:flex-row sm:items-center justify-between border-t border-stone-100 pt-4 gap-2">
            <span>NGO Identifier: #{profile._id}</span>
            <span>Registered on ZeroPlate: {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-60 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-emerald-100" />
                <span>Save Profile Details</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
