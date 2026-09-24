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
  AlertTriangle,
  Check,
  Package,
  Clock,
} from "lucide-react";
import LocationPickerMap from "@/components/maps/location-picker-map";

interface InstitutionProfile {
  _id: string;
  name: string;
  type: "college" | "hospital" | "hotel" | "corporate_cafeteria" | "processing_unit";
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  plan: "free" | "premium";
  createdAt: string;
}

export default function InstitutionSettingsPage() {
  const [profile, setProfile] = React.useState<InstitutionProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form states
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<InstitutionProfile["type"]>("corporate_cafeteria");
  const [address, setAddress] = React.useState("");
  const [lat, setLat] = React.useState("28.6139");
  const [lng, setLng] = React.useState("77.2090");
  const [plan, setPlan] = React.useState<"free" | "premium">("free");

  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/institution/profile");
      const json = await res.json();
      if (res.ok && json.institution) {
        setProfile(json.institution);
        setName(json.institution.name || "");
        setType(json.institution.type || "corporate_cafeteria");
        setAddress(json.institution.address || "");
        setLat(String(json.institution.location?.lat || "28.6139"));
        setLng(String(json.institution.location?.lng || "77.2090"));
        setPlan(json.institution.plan || "free");
      }
    } catch (err) {
      console.error("Failed to load institution profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/institution/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          address,
          plan,
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

      setProfile(json.institution);
      setSuccessMessage("Institution facility profile & dispatch coordinates updated successfully.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const verticalLabels: Record<string, string> = {
    corporate_cafeteria: "Corporate Cafeteria",
    college: "University / College Campus",
    hospital: "Hospital & Healthcare Facility",
    hotel: "Hotel & Hospitality Kitchen",
    processing_unit: "Food Processing & Packaging Unit",
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Administration Title & Quick Links */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Facility Settings &amp; Platform Access
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Facility Operational
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Configure commercial kitchen parameters, precise GPS dispatch bay coordinates for courier pickups, and open-platform licensing settings.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              FSSAI Registered Entity
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              100% Free Public Benefit Platform
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <MapPin className="w-3 h-3 text-blue-600" />
              Geo-Tagged Dispatch Bay
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <Link
            href="/app/institution/overview"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Operational Ledger</span>
          </Link>
          <Link
            href="/app/institution/inventory"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Package className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Kitchen Inventory</span>
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

      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Loading institution profile &amp; facility coordinates...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 2. 4 Vibrant Theme KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Emerald Theme - Platform Licensing */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
                  Platform Licensing
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-xl sm:text-2xl font-extrabold text-emerald-950">
                Community Access
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                  100% Free Forever
                </span>
              </div>
            </div>

            {/* Card 2: Blue Theme - Facility Category */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
                  Facility Vertical
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-serif text-lg font-bold text-stone-900 truncate">
                {verticalLabels[type] || "Commercial Kitchen"}
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
                  FSSAI Gating Active
                </span>
              </div>
            </div>

            {/* Card 3: Amber Theme - GPS Calibration */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
                  Dispatch Bay Pin
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-base font-bold text-amber-900 truncate">
                {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
                  Calibrated for Couriers
                </span>
              </div>
            </div>

            {/* Card 4: Violet Theme - Security & Ledger */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
                  Ledger Entity ID
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-base font-bold text-purple-900 truncate">
                #{profile?._id.slice(-8).toUpperCase() || "PENDING"}
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
                  Immutable Records
                </span>
              </div>
            </div>
          </div>

          {/* 3. Community Open Access Licensing Card */}
          <div className="border border-stone-200 bg-white rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Public Benefit Licensing
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-2">
                  Community Open Access Tier
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                  ZeroPlate operates as a public benefit platform. All predictive modeling, surplus gating, and dispatch infrastructure are 100% free with zero subscription costs.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-800 font-bold px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                  ₹0 / month · All Modules Unlocked
                </span>
              </div>
            </div>

            {/* Feature Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                { title: "Daily Kitchen Inventory Ledger", desc: "Automated shelf-life countdowns & tracking" },
                { title: "AI Demand & Surplus Forecasting", desc: "Rolling baseline & ARIMA predictive models" },
                { title: "Server-Side Fail-Closed Safety Gating", desc: "Enforced FSSAI 4-hour cooked food limits" },
                { title: "Verified NGO Recipient Directory", desc: "Direct matching with KYC-vetted charities" },
                { title: "Live Logistics Fleet Coordination", desc: "Automated driver dispatch & GPS map routes" },
                { title: "Downloadable ESG Audit Ledgers", desc: "GHG Protocol Scope 3 Category 5 reporting" },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-stone-200/90 bg-stone-50/60 flex items-start gap-2.5"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900 text-xs">{feat.title}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Facility Profile & Dispatch Coordinates Form */}
          <form
            onSubmit={handleSaveProfile}
            className="border border-stone-200 bg-white rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs"
          >
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Facility Profile &amp; Dispatch Coordinates
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                These coordinates and address details are shared with delivery partners and verified recipient NGOs during surplus food pickups.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Institution / Kitchen Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Acme Tech Park Main Cafeteria"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Facility Vertical *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as InstitutionProfile["type"])}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer transition-all"
                >
                  <option value="corporate_cafeteria">🏢 Corporate Cafeteria</option>
                  <option value="college">🎓 University / College Campus</option>
                  <option value="hospital">🏥 Hospital &amp; Healthcare Facility</option>
                  <option value="hotel">🏨 Hotel &amp; Hospitality Kitchen</option>
                  <option value="processing_unit">🏭 Food Processing &amp; Packaging Unit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Physical Pickup / Dispatch Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="e.g. North Gate Logistics Bay, Building 4, Tech Boulevard"
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
              />
            </div>

            {/* Interactive Kitchen Facility Location Pin */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-0.5">
                  Kitchen Facility Dispatch Bay Map *
                </label>
                <p className="text-xs text-stone-500">
                  Drag or click to calibrate your commercial kitchen&apos;s exact pickup bay coordinates for courier route guidance.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xs">
                <LocationPickerMap
                  lat={Number(lat) || 28.6139}
                  lng={Number(lng) || 77.209}
                  pinType="kitchen"
                  theme="light"
                  label="Kitchen Dispatch Bay"
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
                <span>Institution ID: {profile._id}</span>
                <span>Facility Created: {new Date(profile.createdAt).toLocaleDateString()}</span>
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
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-100" />
                    <span>Save Facility Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 5. FSSAI Regulatory Traceability Notice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 uppercase font-mono tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>FSSAI Regulatory Traceability Notice</span>
            </div>
            <p className="leading-relaxed">
              ZeroPlate operates as a verifiable software platform connecting registered commercial food handlers with vetted NGO distribution networks. In compliance with Food Safety and Standards Authority of India (FSSAI) guidelines, all surplus food submissions require strict time-temperature integrity, and all safety evaluations are permanently recorded in the immutable audit log for liability traceability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
