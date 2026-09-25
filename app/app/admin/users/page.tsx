"use client";

import * as React from "react";
import { UserIcon } from "@/components/icons/ledger-icons";
import { Users, ShieldCheck, Mail } from "lucide-react";

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
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Identity &amp; Governance
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
            Registered Accounts ({users.length})
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Overview of all authenticated users across dining institutions, shelters, drivers, and administrators.
          </p>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 max-w-fit overflow-x-auto">
        {[
          { id: "all", label: `All Users (${users.length})` },
          { id: "institution_admin", label: "Commercial Kitchens" },
          { id: "ngo", label: "NGOs & Shelters" },
          { id: "delivery_partner", label: "Delivery Drivers" },
          { id: "platform_admin", label: "Admins" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRoleFilter(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              roleFilter === tab.id
                ? "bg-white text-zinc-900 font-semibold shadow-xs border border-slate-200/60"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-16 text-center space-y-3 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-zinc-500">
            Loading user directory...
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="border border-slate-200/90 bg-white p-12 rounded-2xl text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-zinc-600">
            <UserIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-bold text-zinc-900">
            No accounts found
          </h2>
          <p className="text-xs text-zinc-500">No accounts match the selected role filter.</p>
        </div>
      ) : (
        <div className="border border-slate-200/90 bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User &amp; Email</th>
                  <th className="px-4 py-3.5">Assigned Role</th>
                  <th className="px-4 py-3.5">Organization / Entity Profile</th>
                  <th className="px-4 py-3.5">Onboarding Status</th>
                  <th className="px-5 py-3.5 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-zinc-700">
                {filteredUsers.map((u) => {
                  const details = u.profileDetails;

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-900 text-sm">{u.name}</div>
                        <div className="text-xs text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-zinc-300" />
                          {u.email}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                            u.role === "platform_admin"
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : u.role === "institution_admin"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : u.role === "ngo"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {u.role === "platform_admin"
                            ? "Admin"
                            : u.role === "institution_admin"
                            ? "Kitchen Admin"
                            : u.role === "ngo"
                            ? "NGO Partner"
                            : "Delivery Driver"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {details ? (
                          <div>
                            <div className="font-semibold text-zinc-900 text-xs">
                              {details.name || details.vehicleType || "Linked Profile"}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {details.type || details.registrationNumber || details.serviceArea || "—"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-xs">No profile attached</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            u.profileCompleted
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {u.profileCompleted ? "Profile Complete" : "Pending Setup"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right text-zinc-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
