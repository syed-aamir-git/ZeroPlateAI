"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Selected role (must not be defaulted silently)
  const [selectedRole, setSelectedRole] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Institution Admin Fields
  const [instName, setInstName] = React.useState("");
  const [instType, setInstType] = React.useState("college");
  const [instAddress, setInstAddress] = React.useState("");
  const [instLat, setInstLat] = React.useState("28.545");
  const [instLng, setInstLng] = React.useState("77.192");
  const [instPlan, setInstPlan] = React.useState("free");

  // NGO Fields
  const [ngoName, setNgoName] = React.useState("");
  const [ngoRegNumber, setNgoRegNumber] = React.useState("");
  const [ngoPhone, setNgoPhone] = React.useState("");
  const [ngoServiceArea, setNgoServiceArea] = React.useState("");
  const [ngoCapacity, setNgoCapacity] = React.useState("500");
  const [ngoLat, setNgoLat] = React.useState("28.613");
  const [ngoLng, setNgoLng] = React.useState("77.209");

  // Delivery Partner Fields
  const [deliveryPhone, setDeliveryPhone] = React.useState("");
  const [deliveryVehicle, setDeliveryVehicle] = React.useState("two_wheeler");
  const [deliveryVehicleNumber, setDeliveryVehicleNumber] = React.useState("");
  const [deliveryArea, setDeliveryArea] = React.useState("South Delhi Metro Zone");

  // Platform Admin Fields
  const [adminDepartment, setAdminDepartment] = React.useState("Operations & Food Safety");
  const [adminKey, setAdminKey] = React.useState("");

  const isProfileCompleted = Boolean(
    session?.user && (session.user as { profileCompleted?: boolean }).profileCompleted
  );

  // Sync role if already chosen at registration
  React.useEffect(() => {
    if (session?.user) {
      const userRole = (session.user as { role?: string }).role;
      if (userRole && !selectedRole) {
        setSelectedRole(userRole);
      }
      const isCompleted = (session.user as { profileCompleted?: boolean }).profileCompleted;
      if (isCompleted && userRole) {
        // Already completed, route to role dashboard directly
        const dashboardMap: Record<string, string> = {
          institution_admin: "/app/institution/overview",
          ngo: "/app/ngo/browse",
          delivery_partner: "/app/delivery/assignments",
          platform_admin: "/app/admin/overview",
        };
        router.replace(dashboardMap[userRole] || "/app/institution/overview");
      }
    }
  }, [session, selectedRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError("Please select your organization role to continue.");
      return;
    }

    setError(null);
    setLoading(true);

    let details: Record<string, unknown> = {};

    if (selectedRole === "institution_admin") {
      details = {
        name: instName,
        type: instType,
        address: instAddress,
        lat: Number(instLat) || 28.545,
        lng: Number(instLng) || 77.192,
        plan: instPlan,
      };
    } else if (selectedRole === "ngo") {
      details = {
        orgName: ngoName,
        registrationNumber: ngoRegNumber,
        contactPhone: ngoPhone,
        serviceArea: ngoServiceArea,
        capacityPerWeek: Number(ngoCapacity) || 500,
        lat: Number(ngoLat) || 28.613,
        lng: Number(ngoLng) || 77.209,
      };
    } else if (selectedRole === "delivery_partner") {
      details = {
        phone: deliveryPhone,
        vehicleType: deliveryVehicle,
        vehicleNumber: deliveryVehicleNumber.trim().toUpperCase(),
        serviceArea: deliveryArea,
      };
    } else if (selectedRole === "platform_admin") {
      details = {
        department: adminDepartment,
        accessKey: adminKey,
      };
    }

    try {
      const res = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to complete onboarding.");
        setLoading(false);
        return;
      }

      // Hard redirect to refresh session and role cookies
      window.location.href = data.redirect || "/dashboard/institution";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit profile.";
      setError(message);
      setLoading(false);
    }
  };

  if (isPending || isProfileCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ledger-paper text-ink">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-basil border-t-transparent rounded-full animate-spin" />
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
            {isProfileCompleted
              ? "Directing to your dashboard..."
              : "Loading authentication session..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav hideAuthButtons />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="bg-[#FAF6EE] border border-line rounded-[6px] p-6 sm:p-10 shadow-none">
          {/* Header */}
          <div className="border-b border-line pb-6 mb-8 text-left">
            <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft block mb-1">
              Step 2 of 2: Profile & Role Verification
            </span>
            <h1 className="font-display text-3xl font-normal text-ink">
              Configure Your Organization Ledger
            </h1>
            <p className="text-sm text-ink-soft mt-2">
              Logged in as <strong className="text-ink">{session?.user?.email || "User"}</strong>.
              Please select and complete your official role profile. ZeroPlate requires verified institutional details before enabling surplus operations.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-[6px] bg-[#8A4331]/10 border border-[#8A4331]/30 text-[#8A4331] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 text-left">
            {/* Role Selection Cards */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-3">
                1. Select Your Platform Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "institution_admin",
                    title: "Institution Admin",
                    desc: "Colleges, hospitals, hotels, corporate cafeterias, and food processing plants.",
                  },
                  {
                    id: "ngo",
                    title: "NGO / Recipient",
                    desc: "Verified NGOs, shelters, community kitchens claiming surplus food.",
                  },
                  {
                    id: "delivery_partner",
                    title: "Delivery Partner",
                    desc: "Volunteer or logistics driver coordinating surplus pickup and drop-off.",
                  },
                  {
                    id: "platform_admin",
                    title: "Platform Admin",
                    desc: "Food safety oversight, KYC approvals, and system-wide audit administration.",
                  },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-4 rounded-[6px] border text-left transition-all cursor-pointer ${
                      selectedRole === r.id
                        ? "border-basil bg-ledger-paper ring-2 ring-basil/40"
                        : "border-line bg-[#FAF6EE] hover:bg-ledger-paper"
                    }`}
                  >
                    <div className="font-semibold text-sm text-ink mb-1">
                      {r.title}
                    </div>
                    <div className="text-xs text-ink-soft leading-relaxed">
                      {r.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Role Specific Forms */}
            {selectedRole === "institution_admin" && (
              <div className="space-y-4 pt-4 border-t border-line">
                <h3 className="font-display text-xl font-normal text-ink">
                  Institution Details
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Institution / Kitchen Name
                  </label>
                  <input
                    type="text"
                    required
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    placeholder="e.g. IIT Delhi Central Kitchen"
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink focus:outline-none focus:ring-2 focus:ring-basil"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Institution Vertical
                    </label>
                    <select
                      value={instType}
                      onChange={(e) => setInstType(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink focus:outline-none focus:ring-2 focus:ring-basil cursor-pointer"
                    >
                      <option value="college">College / University Hostel</option>
                      <option value="hospital">Hospital / Healthcare Food Service</option>
                      <option value="hotel">Hotel / Banquet Kitchen</option>
                      <option value="corporate_cafeteria">Corporate Cafeteria</option>
                      <option value="processing_unit">Food Processing & Packaging Unit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Plan Tier
                    </label>
                    <select
                      value={instPlan}
                      onChange={(e) => setInstPlan(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink focus:outline-none focus:ring-2 focus:ring-basil cursor-pointer"
                    >
                      <option value="free">Standard (Free) — Core redistribution & forecasting</option>
                      <option value="premium">Premium — ESG Exports & Priority matching</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Kitchen Address & Dispatch Point
                  </label>
                  <input
                    type="text"
                    required
                    value={instAddress}
                    onChange={(e) => setInstAddress(e.target.value)}
                    placeholder="e.g. Gate 4, Main Mess Complex, IIT Campus, Hauz Khas, New Delhi"
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink focus:outline-none focus:ring-2 focus:ring-basil"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Dispatch Latitude
                    </label>
                    <input
                      type="text"
                      value={instLat}
                      onChange={(e) => setInstLat(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink font-ledger-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Dispatch Longitude
                    </label>
                    <input
                      type="text"
                      value={instLng}
                      onChange={(e) => setInstLng(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink font-ledger-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedRole === "ngo" && (
              <div className="space-y-4 pt-4 border-t border-line">
                <h3 className="font-display text-xl font-normal text-ink">
                  NGO KYC & Recipient Verification Details
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Organization Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    placeholder="e.g. Robin Hood Army Delhi South"
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink focus:outline-none focus:ring-2 focus:ring-basil"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      NGO Registration Number
                    </label>
                    <input
                      type="text"
                      required
                      value={ngoRegNumber}
                      onChange={(e) => setNgoRegNumber(e.target.value)}
                      placeholder="e.g. DL/2021/008472"
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink font-ledger-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={ngoPhone}
                      onChange={(e) => setNgoPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink font-ledger-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Designated Service Area
                    </label>
                    <input
                      type="text"
                      required
                      value={ngoServiceArea}
                      onChange={(e) => setNgoServiceArea(e.target.value)}
                      placeholder="e.g. South Delhi, Okhla, Ashram"
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Weekly Capacity (kg/week)
                    </label>
                    <input
                      type="number"
                      required
                      value={ngoCapacity}
                      onChange={(e) => setNgoCapacity(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink font-ledger-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-saffron/10 border border-saffron/30 rounded-[6px] text-xs text-[#7E570A]">
                  Note: Under Section 12.8 of the Food Safety Policy, all NGO accounts initialize in <strong>KYC Pending</strong> status. A Platform Admin will review your registration before listings can be claimed.
                </div>
              </div>
            )}

            {selectedRole === "delivery_partner" && (
              <div className="space-y-4 pt-4 border-t border-line">
                <h3 className="font-display text-xl font-normal text-ink">
                  Delivery Partner Logistics Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      placeholder="+91 98111 22334"
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink font-ledger-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Vehicle Mode
                    </label>
                    <select
                      value={deliveryVehicle}
                      onChange={(e) => setDeliveryVehicle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink focus:outline-none focus:ring-2 focus:ring-basil cursor-pointer"
                    >
                      <option value="two_wheeler">Two-Wheeler (Motorcycle / Scooter)</option>
                      <option value="three_wheeler">Three-Wheeler / Auto Cargo</option>
                      <option value="van_small_truck">Light Cargo Van / Small Truck</option>
                      <option value="on_foot_volunteer">Volunteer On-Foot / Bicycle</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Vehicle Number Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryVehicleNumber}
                    onChange={(e) => setDeliveryVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. DL 01 AB 1234"
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Displayed alongside your name and contact during active order pickups &amp; deliveries.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Operating Service Area
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryArea}
                    onChange={(e) => setDeliveryArea(e.target.value)}
                    placeholder="e.g. South Delhi & Noida Sector 62"
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink"
                  />
                </div>
              </div>
            )}

            {selectedRole === "platform_admin" && (
              <div className="space-y-4 pt-4 border-t border-line">
                <h3 className="font-display text-xl font-normal text-ink">
                  Platform Operations Credentials
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Administrative Department
                  </label>
                  <input
                    type="text"
                    required
                    value={adminDepartment}
                    onChange={(e) => setAdminDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Platform Security Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter security key if provisioned"
                    className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink font-ledger-mono"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !selectedRole}
              variant="default"
              size="lg"
              className="w-full"
            >
              {loading ? "Saving Profile & Accessing Ledger..." : "Save Profile & Enter Dashboard"}
            </Button>
          </form>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
