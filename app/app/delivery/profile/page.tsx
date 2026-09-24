"use client";

import * as React from "react";
import { UserIcon, ShieldCheckIcon, LogOutIcon } from "@/components/icons/ledger-icons";
import { signOut } from "@/lib/auth-client";
import LocationPickerMap from "@/components/maps/location-picker-map";

interface PartnerProfile {
  _id: string;
  name?: string;
  email?: string;
  phone: string;
  vehicleType: "two_wheeler" | "four_wheeler" | "van" | "electric_cargo";
  vehicleNumber?: string;
  serviceArea: string;
  active: boolean;
  totalCompleted: number;
  activeCount: number;
  createdAt: string;
}

export default function DeliveryProfilePage() {
  const [profile, setProfile] = React.useState<PartnerProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [phone, setPhone] = React.useState("");
  const [vehicleType, setVehicleType] = React.useState<PartnerProfile["vehicleType"]>("two_wheeler");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [serviceArea, setServiceArea] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/delivery/profile");
      const json = await res.json();
      if (res.ok && json.partner) {
        setProfile(json.partner);
        setPhone(json.partner.phone || "");
        setVehicleType(json.partner.vehicleType || "two_wheeler");
        setVehicleNumber(json.partner.vehicleNumber || "");
        setServiceArea(json.partner.serviceArea || "");
        setActive(json.partner.active !== false);
      }
    } catch (err) {
      console.error("Failed to load partner profile:", err);
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
    setMessage(null);

    try {
      const res = await fetch("/api/v1/delivery/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          vehicleType,
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          serviceArea,
          active,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.error || "Failed to update profile." });
        return;
      }

      setMessage({ type: "success", text: "Profile updated successfully." });
      fetchProfile();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error saving profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Partner sign out error:", err);
    } finally {
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono-numeral text-[#9E9587]">
        Loading driver partner profile...
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* Page Title */}
      <div className="border-b border-[#3B362E] pb-3">
        <span className="font-mono-numeral text-[11px] uppercase tracking-wider text-[#9E9587]">
          Driver Credentials
        </span>
        <h1 className="font-display text-xl font-bold text-[#F3EEE2] mt-0.5">
          Partner Profile
        </h1>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-3 rounded-[6px] border text-xs font-medium ${
            message.type === "success"
              ? "bg-[#2F4B3A]/20 border-[#2F4B3A] text-[#86C29B]"
              : "bg-clay-rust/20 border-clay-rust text-[#F4A88E]"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-2 gap-2 border border-[#3B362E] bg-[#1D1B17] p-3 rounded-[6px]">
        <div>
          <div className="text-[10px] uppercase font-mono-numeral text-[#9E9587]">
            Completed Runs
          </div>
          <div className="font-mono-numeral text-xl font-bold text-[#F3EEE2] mt-0.5">
            {profile?.totalCompleted || 0}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-mono-numeral text-[#9E9587]">
            Active Dispatches
          </div>
          <div className="font-mono-numeral text-xl font-bold text-[#D9A441] mt-0.5">
            {profile?.activeCount || 0}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="border border-[#3B362E] bg-[#1D1B17] rounded-[6px] p-4 space-y-4 text-xs">
        <div>
          <label className="block text-[11px] font-mono-numeral uppercase text-[#9E9587] mb-1">
            Partner Name
          </label>
          <input
            type="text"
            value={profile?.name || ""}
            disabled
            className="w-full px-3 py-2 text-xs bg-[#24211C] border border-[#3B362E] rounded-[4px] text-[#D4CBBF] cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono-numeral uppercase text-[#9E9587] mb-1">
            Account Email
          </label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className="w-full px-3 py-2 text-xs bg-[#24211C] border border-[#3B362E] rounded-[4px] text-[#D4CBBF] cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono-numeral uppercase text-[#9E9587] mb-1">
            Contact Phone Number *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs bg-[#24211C] border border-[#3B362E] rounded-[4px] text-[#F3EEE2] font-mono-numeral focus:border-[#D9A441] outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono-numeral uppercase text-[#9E9587] mb-1">
            Assigned Vehicle Type *
          </label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as PartnerProfile["vehicleType"])}
            className="w-full px-3 py-2 text-xs bg-[#24211C] border border-[#3B362E] rounded-[4px] text-[#F3EEE2] focus:border-[#D9A441] outline-none"
          >
            <option value="two_wheeler">Two Wheeler (Motorcycle / Scooter)</option>
            <option value="electric_cargo">Electric Cargo / EV 3-Wheeler</option>
            <option value="four_wheeler">Four Wheeler (Car / Hatchback)</option>
            <option value="van">Commercial Delivery Van</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono-numeral uppercase text-[#9E9587] mb-1">
            Vehicle Number Plate (Registration) *
          </label>
          <input
            type="text"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            required
            placeholder="e.g. DL 01 AB 1234"
            className="w-full px-3 py-2 text-xs bg-[#24211C] border border-[#3B362E] rounded-[4px] text-[#F3EEE2] font-mono uppercase tracking-wider focus:border-[#D9A441] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
          />
          <span className="text-[10px] text-[#9E9587] mt-1 block">
            This plate number is displayed along with your name and phone number on active deliveries.
          </span>
        </div>

        <div>
          <label className="block text-[11px] font-mono-numeral uppercase text-[#9E9587] mb-1">
            Operating Service Area *
          </label>
          <input
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            required
            placeholder="e.g. South Delhi, Okhla Logistics Corridor"
            className="w-full px-3 py-2 text-xs bg-[#24211C] border border-[#3B362E] rounded-[4px] text-[#F3EEE2] focus:border-[#D9A441] outline-none"
          />
          <div className="mt-2 space-y-1">
            <span className="text-[10px] font-mono-numeral text-[#9E9587] block">
              Logistics Service Hub & Coverage Radius (8 km zone):
            </span>
            <LocationPickerMap
              lat={28.6139}
              lng={77.209}
              radiusMeters={8000}
              pinType="courier"
              theme="dark"
              label="Delivery Hub & Service Radius"
              className="w-full h-48 sm:h-56"
            />
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between border-t border-[#3B362E] pt-3">
          <div>
            <div className="font-medium text-[#F3EEE2]">Active for Dispatches</div>
            <div className="text-[10px] text-[#9E9587]">Receive new pickup assignments nearby</div>
          </div>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              active ? "bg-[#2F4B3A]" : "bg-[#3B362E]"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-[#F3EEE2] w-4 h-4 rounded-full transition-transform ${
                active ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-[6px] bg-[#D9A441] hover:bg-[#E2B359] text-[#24211C] font-bold text-xs transition-colors cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </form>

      {/* Safety Standard Notice */}
      <div className="border border-[#3B362E] bg-[#1D1B17] p-3 rounded-[6px] text-xs text-[#9E9587] space-y-1">
        <div className="flex items-center gap-1.5 text-[#F3EEE2] text-[11px] font-mono-numeral uppercase">
          <ShieldCheckIcon size={14} />
          <span>FSSAI Safe Transport Protocol</span>
        </div>
        <p className="leading-relaxed">
          Ensure insulated food containers remain sealed during transport. For cooked meals, direct delivery
          must be executed promptly within the designated dispatch window to preserve food safety integrity.
        </p>
      </div>

      {/* Account Session & Sign Out Section */}
      <div className="border border-[#3B362E] bg-[#1D1B17] p-4 rounded-[6px] space-y-3">
        <div>
          <div className="font-mono-numeral text-[11px] uppercase tracking-wider text-[#9E9587]">
            Account Session
          </div>
          <div className="text-xs text-[#D4CBBF] mt-0.5">
            Signed in as <span className="text-[#F3EEE2] font-semibold">{profile?.name || "Partner"}</span> ({profile?.email || "driver@zeroplate.ai"})
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={loggingOut}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-[6px] border border-rose-800/60 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <LogOutIcon size={16} />
          <span>{loggingOut ? "Signing out..." : "Sign Out of Partner Account"}</span>
        </button>
      </div>
    </div>
  );
}
