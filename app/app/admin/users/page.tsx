"use client";

import * as React from "react";
import { UserIcon } from "@/components/icons/ledger-icons";

interface UserItem {
  _id: string;
  email: string;
  name: string;
  role: string;
  profileCompleted: boolean;
  createdAt: string;
  profileDetails?: any;
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [roleFilter, setRoleFilter] = React.useState("all");

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/users");
      const json = await res.json();
      if (res.ok) {
        setUsers(json.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    if (roleFilter === "all") return true;
    return u.role === roleFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#5A3653] pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-[#D9A441]">
            Identity & Role Governance
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-0.5">
            Registered System Users ({users.length})
          </h1>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border border-[#5A3653] bg-[#3D2538] p-2.5 rounded-[6px]">
        {[
          { id: "all", label: `All Users (${users.length})` },
          { id: "institution_admin", label: "Institution Admins" },
          { id: "ngo", label: "NGOs / Recipients" },
          { id: "delivery_partner", label: "Delivery Partners" },
          { id: "platform_admin", label: "Platform Admins" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRoleFilter(tab.id)}
            className={`px-3 py-1 text-xs rounded-[4px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              roleFilter === tab.id
                ? "bg-[#D9A441] text-[#24211C] font-bold"
                : "bg-[#4A2E44] text-[#C9B9C7] hover:text-[#F3EEE2] border border-[#5A3653]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono-numeral text-[#C9B9C7]">
          Loading registered accounts...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="border border-[#5A3653] bg-[#3D2538] p-12 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-[#5A3653] bg-[#4A2E44] mx-auto flex items-center justify-center text-[#D9A441]">
            <UserIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-medium text-[#F3EEE2]">
            No user accounts found
          </h2>
          <p className="text-xs text-[#C9B9C7]">No accounts match the selected role filter.</p>
        </div>
      ) : (
        <div className="border border-[#5A3653] bg-[#3D2538] rounded-[6px] overflow-x-auto shadow-none">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#4A2E44] border-b border-[#5A3653] text-[#F3EEE2] uppercase font-mono-numeral text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">User & Email</th>
                <th className="px-4 py-3 font-semibold">Assigned Role</th>
                <th className="px-4 py-3 font-semibold">Organization / Entity Profile</th>
                <th className="px-4 py-3 font-semibold">Profile Status</th>
                <th className="px-4 py-3 font-semibold text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5A3653] text-[#D4CBBF]">
              {filteredUsers.map((u) => {
                const details = u.profileDetails;

                return (
                  <tr key={u._id} className="hover:bg-[#4A2E44]/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#F3EEE2] text-sm">{u.name}</div>
                      <div className="text-[11px] text-[#C9B9C7] font-mono-numeral">{u.email}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-numeral uppercase font-semibold ${
                          u.role === "platform_admin"
                            ? "bg-[#663E5D] text-[#F3EEE2] border border-[#85527A]"
                            : u.role === "institution_admin"
                            ? "bg-[#2F4B3A]/30 text-[#86C29B] border border-[#2F4B3A]"
                            : u.role === "ngo"
                            ? "bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40"
                            : "bg-[#24211C] text-[#D4CBBF] border border-[#3B362E]"
                        }`}
                      >
                        {u.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {details ? (
                        <div>
                          <div className="font-semibold text-[#F3EEE2]">
                            {details.name || details.vehicleType || "Linked Profile"}
                          </div>
                          <div className="text-[10px] text-[#9E8A9A]">
                            {details.type || details.registrationNumber || details.serviceArea || "—"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#9E8A9A] italic">No entity record</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono-numeral uppercase ${
                          u.profileCompleted
                            ? "bg-[#2F4B3A]/20 text-[#86C29B]"
                            : "bg-[#D9A441]/10 text-[#D9A441]"
                        }`}
                      >
                        {u.profileCompleted ? "Completed" : "Pending Onboarding"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono-numeral text-[#C9B9C7]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
