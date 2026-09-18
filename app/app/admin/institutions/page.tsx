"use client";

import * as React from "react";
import { CrateIcon, TicketIcon } from "@/components/icons/ledger-icons";

interface InstitutionItem {
  _id: string;
  name: string;
  type: string;
  address: string;
  location?: { lat: number; lng: number };
  plan: "free" | "premium";
  createdAt: string;
  inventoryCount: number;
  listingsCount: number;
  totalSurplusKg: number;
}

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = React.useState<InstitutionItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchInstitutions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/institutions");
      const json = await res.json();
      if (res.ok) {
        setInstitutions(json.institutions || []);
      }
    } catch (err) {
      console.error("Failed to load institutions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const totalSurplusListedKg = institutions.reduce((acc, curr) => acc + (curr.totalSurplusKg || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#5A3653] pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-[#D9A441]">
            Commercial Kitchens Directory
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-0.5">
            Onboarded Institutions ({institutions.length})
          </h1>
        </div>

        <div className="font-mono-numeral text-xs text-[#C9B9C7]">
          Aggregate surplus: <span className="text-[#86C29B] font-bold">{totalSurplusListedKg} kg</span>
        </div>
      </div>

      {/* Institutions Ledger Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono-numeral text-[#C9B9C7]">
          Loading registered institutions ledger...
        </div>
      ) : institutions.length === 0 ? (
        <div className="border border-[#5A3653] bg-[#3D2538] p-12 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-[#5A3653] bg-[#4A2E44] mx-auto flex items-center justify-center text-[#D9A441]">
            <CrateIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-medium text-[#F3EEE2]">
            No institutions onboarded yet
          </h2>
          <p className="text-xs text-[#C9B9C7] max-w-md mx-auto">
            New commercial dining facilities, campus kitchens, and hospitals will appear here once they complete onboarding.
          </p>
        </div>
      ) : (
        <div className="border border-[#5A3653] bg-[#3D2538] rounded-[6px] overflow-x-auto shadow-none">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#4A2E44] border-b border-[#5A3653] text-[#F3EEE2] uppercase font-mono-numeral text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Facility Name</th>
                <th className="px-4 py-3 font-semibold">Vertical Type</th>
                <th className="px-4 py-3 font-semibold">Dispatch Address</th>
                <th className="px-4 py-3 font-semibold">Subscription Plan</th>
                <th className="px-4 py-3 font-semibold">Inventory Logged</th>
                <th className="px-4 py-3 font-semibold">Total Surplus Listed</th>
                <th className="px-4 py-3 font-semibold text-right">Onboarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5A3653] text-[#D4CBBF]">
              {institutions.map((inst) => (
                <tr key={inst._id} className="hover:bg-[#4A2E44]/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#F3EEE2]">
                    <div className="text-sm font-semibold">{inst.name}</div>
                    <div className="text-[10px] text-[#C9B9C7] font-mono-numeral">
                      ID: {inst._id}
                    </div>
                  </td>

                  <td className="px-4 py-3 capitalize text-[#D9A441]">
                    {inst.type.replace("_", " ")}
                  </td>

                  <td className="px-4 py-3 max-w-[200px] truncate text-[#C9B9C7]" title={inst.address}>
                    {inst.address}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-numeral uppercase font-semibold ${
                        inst.plan === "premium"
                          ? "bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40"
                          : "bg-[#2F4B3A]/20 text-[#86C29B] border border-[#2F4B3A]/40"
                      }`}
                    >
                      {inst.plan === "premium" ? "Enterprise Premium" : "Community Free"}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono-numeral text-[#F3EEE2]">
                    {inst.inventoryCount} items
                  </td>

                  <td className="px-4 py-3 font-mono-numeral text-[#86C29B] font-medium">
                    {inst.totalSurplusKg} kg ({inst.listingsCount} batches)
                  </td>

                  <td className="px-4 py-3 text-right font-mono-numeral text-[#C9B9C7]">
                    {new Date(inst.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
