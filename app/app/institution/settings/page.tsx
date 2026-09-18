"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ShieldCheckIcon,
  TicketIcon,
} from "@/components/icons/ledger-icons";

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
      setSuccessMessage("Institution profile updated successfully.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlan = async (newPlan: "free" | "premium") => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/institution/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || "Failed to change plan.");
        return;
      }

      setPlan(newPlan);
      if (profile) {
        setProfile({ ...profile, plan: newPlan });
      }
      setSuccessMessage(`Plan tier updated to ${newPlan.toUpperCase()}.`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error changing plan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs font-mono-numeral text-ink-soft">
        Loading institution profile & plan settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Page Title */}
      <div className="border-b border-line pb-4">
        <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
          Administration & Subscription
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink mt-0.5">
          Institution Settings & Plan
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

      {/* Plan Tier Section (Ledger Strip Style) */}
      <div className="border border-line bg-[#FAF6EE] rounded-[6px] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="text-xs font-mono-numeral uppercase tracking-wider text-ink-soft">
              Active Subscription Tier
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-display text-2xl text-ink capitalize">
                {plan === "premium" ? "Enterprise Premium Tier" : "Community Free Tier"}
              </span>
              <StatusBadge
                variant={plan === "premium" ? "premium" : "confirmed"}
                label={plan === "premium" ? "Enterprise Plan" : "Standard Plan"}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {plan === "free" ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleTogglePlan("premium")}
                disabled={saving}
              >
                Upgrade to Premium Tier
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTogglePlan("free")}
                disabled={saving}
              >
                Downgrade to Free Tier
              </Button>
            )}
          </div>
        </div>

        {/* Ledger Comparison Table of Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Free Tier Details */}
          <div
            className={`border rounded-[6px] p-4 space-y-3 ${
              plan === "free"
                ? "border-basil bg-ledger-paper"
                : "border-line bg-ledger-paper/60 opacity-85"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-ink text-sm">Free Community Tier</span>
              <span className="font-mono-numeral text-ink-soft">₹0 / month</span>
            </div>
            <p className="text-ink-soft text-[11px] leading-relaxed">
              Full inventory ledger, automated FSSAI safety gating, and direct redistribution matching with verified recipient NGOs.
            </p>
            <ul className="space-y-1.5 text-ink-soft">
              <li className="flex items-center gap-2">
                <span className="text-basil">✓</span> Real-time kitchen inventory ledger
              </li>
              <li className="flex items-center gap-2">
                <span className="text-basil">✓</span> Server-side fail-closed safety gating
              </li>
              <li className="flex items-center gap-2">
                <span className="text-basil">✓</span> Redistribution matching with KYC-verified NGOs
              </li>
              <li className="flex items-center gap-2">
                <span className="text-basil">✓</span> Immutable MongoDB audit trail
              </li>
              <li className="flex items-center gap-2 text-ink-soft/60 line-through">
                <span>✕</span> AI demand & surplus forecasting
              </li>
              <li className="flex items-center gap-2 text-ink-soft/60 line-through">
                <span>✕</span> Downloadable ESG & sustainability reports
              </li>
            </ul>
          </div>

          {/* Premium Tier Details */}
          <div
            className={`border rounded-[6px] p-4 space-y-3 ${
              plan === "premium"
                ? "border-basil bg-ledger-paper"
                : "border-line bg-ledger-paper/60"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-ink text-sm">Premium Enterprise</span>
              <span className="font-mono-numeral text-basil font-medium">₹12,500 / month</span>
            </div>
            <p className="text-ink-soft text-[11px] leading-relaxed">
              Predictive kitchen management, automated overproduction forecasting, priority dispatch matching, and auditor-ready ESG exports.
            </p>
            <ul className="space-y-1.5 text-ink">
              <li className="flex items-center gap-2">
                <span className="text-basil">✓</span> Everything in Free Community tier
              </li>
              <li className="flex items-center gap-2 font-medium text-basil">
                <span className="text-basil">✓</span> AI Demand & Overproduction Forecasting
              </li>
              <li className="flex items-center gap-2 font-medium text-basil">
                <span className="text-basil">✓</span> Certified ESG & CO2e reporting exports
              </li>
              <li className="flex items-center gap-2">
                <span className="text-basil">✓</span> Dedicated logistics dispatch routing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-basil">✓</span> Multi-kitchen centralized visibility
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Institution Profile Form */}
      <form onSubmit={handleSaveProfile} className="border border-line bg-[#FAF6EE] rounded-[6px] p-6 space-y-6">
        <div className="border-b border-line pb-3">
          <h2 className="font-display text-xl font-normal text-ink">
            Facility Profile & Dispatch Coordinates
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            These coordinates and address details are shared with delivery partners and verified NGOs during pickup handoffs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
              Institution / Kitchen Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
              Facility Vertical *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InstitutionProfile["type"])}
              className="w-full px-3 py-2 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
            >
              <option value="corporate_cafeteria">Corporate Cafeteria</option>
              <option value="college">University / College Campus</option>
              <option value="hospital">Hospital & Healthcare Facility</option>
              <option value="hotel">Hotel & Hospitality Kitchen</option>
              <option value="processing_unit">Food Processing & Packaging Unit</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
            Physical Pickup / Dispatch Address *
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="e.g. North Gate Logistics Bay, Tech Park 4"
            className="w-full px-3 py-2 text-xs bg-ledger-paper border border-line rounded-[4px] text-ink focus:ring-1 focus:ring-basil outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono-numeral uppercase tracking-wider text-ink-soft mb-1">
              Latitude Coordinates *
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
              Longitude Coordinates *
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
            <span>Institution ID: {profile._id}</span>
            <span>Created: {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="default" size="sm" disabled={saving}>
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </Button>
        </div>
      </form>

      {/* Safety & Compliance Card */}
      <div className="border border-line bg-ledger-paper p-5 rounded-[6px] space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink font-mono-numeral uppercase">
          <ShieldCheckIcon size={16} />
          <span>FSSAI Regulatory Traceability Notice</span>
        </div>
        <p className="text-xs text-ink-soft leading-relaxed">
          ZeroPlate operates as a verifiable software facilitator connecting registered commercial food handlers with vetted NGO distribution networks. In compliance with Food Safety and Standards Authority of India (FSSAI) guidelines, all surplus food submissions require strict time-temperature integrity, and all safety evaluations are permanently recorded in the immutable audit log for liability traceability.
        </p>
      </div>
    </div>
  );
}
