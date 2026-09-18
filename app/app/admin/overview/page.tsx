"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShieldCheckIcon,
  TicketIcon,
  CrateIcon,
  RouteIcon,
  LedgerTabIcon,
} from "@/components/icons/ledger-icons";

interface AdminMetrics {
  institutionCount: number;
  ngoCount: number;
  pendingKycCount: number;
  deliveryPartnerCount: number;
  totalUsersCount: number;
  totalListedKg: number;
  totalRedistributedKg: number;
  mealsGiven: number;
  co2eAvoidedKg: number;
  auditLogCount: number;
}

interface AuditEvent {
  _id: string;
  entityType: string;
  action: string;
  ruleApplied?: string;
  status?: string;
  createdAt: string;
  details?: Record<string, any>;
}

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = React.useState<AdminMetrics | null>(null);
  const [recentLogs, setRecentLogs] = React.useState<AuditEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchOverview = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/overview");
      const json = await res.json();
      if (res.ok) {
        setMetrics(json.metrics);
        setRecentLogs(json.recentLogs || []);
      }
    } catch (err) {
      console.error("Failed to load admin overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono-numeral text-[#C9B9C7]">
        Aggregating live platform metrics across MongoDB collections...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#5A3653] pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-[#D9A441]">
            Restricted Platform Administration
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-0.5">
            Network Operations & Regulatory Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="default" size="sm" className="bg-[#4A2E44] border border-[#663E5D] hover:bg-[#5A3653] text-[#F3EEE2]">
            <Link href="/app/admin/ngo-verification">
              <ShieldCheckIcon size={14} />
              <span>Review KYC Queue ({metrics?.pendingKycCount || 0})</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Network Participant Strip (Plum-Dominant Chrome) */}
      <div className="border border-[#5A3653] bg-[#3D2538] rounded-[6px] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#5A3653] text-[#F3EEE2]">
        <div className="p-4 sm:p-5">
          <div className="text-xs uppercase tracking-wider text-[#C9B9C7] font-mono-numeral">
            Onboarded Kitchens
          </div>
          <div className="font-mono-numeral text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-1">
            {metrics?.institutionCount || 0}
          </div>
          <div className="text-[11px] text-[#C9B9C7] mt-0.5">colleges, hospitals, hotels</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs uppercase tracking-wider text-[#C9B9C7] font-mono-numeral">
            NGO Partners
          </div>
          <div className="font-mono-numeral text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-1">
            {metrics?.ngoCount || 0}
          </div>
          <div className="text-[11px] text-[#D9A441] mt-0.5 font-mono-numeral">
            {metrics?.pendingKycCount || 0} pending KYC review
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs uppercase tracking-wider text-[#C9B9C7] font-mono-numeral">
            Delivery Partners
          </div>
          <div className="font-mono-numeral text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-1">
            {metrics?.deliveryPartnerCount || 0}
          </div>
          <div className="text-[11px] text-[#C9B9C7] mt-0.5">registered logistics drivers</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs uppercase tracking-wider text-[#C9B9C7] font-mono-numeral">
            Total User Accounts
          </div>
          <div className="font-mono-numeral text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-1">
            {metrics?.totalUsersCount || 0}
          </div>
          <div className="text-[11px] text-[#C9B9C7] mt-0.5">across 4 system roles</div>
        </div>
      </div>

      {/* Sustainability Impact Metrics (Audited standard) */}
      <div className="space-y-3">
        <div className="border-b border-[#5A3653] pb-2">
          <h2 className="font-display text-xl font-bold text-[#F3EEE2]">
            Platform Redistribution & Sustainability Impact
          </h2>
          <p className="text-xs text-[#C9B9C7]">
            Real-time aggregation from verified handoffs across all active commercial participants.
          </p>
        </div>

        <div className="border border-[#5A3653] bg-[#3D2538] rounded-[6px] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#5A3653] text-[#F3EEE2]">
          <div className="p-4 sm:p-5">
            <div className="text-xs uppercase tracking-wider text-[#C9B9C7] font-mono-numeral">
              Total Listed Surplus
            </div>
            <div className="font-mono-numeral text-2xl font-bold text-[#F3EEE2] mt-1">
              {metrics?.totalListedKg || 0} <span className="text-xs font-normal text-[#C9B9C7]">kg</span>
            </div>
            <div className="text-[11px] text-[#C9B9C7] mt-0.5">passed safety gating</div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="text-xs uppercase tracking-wider text-[#C9B9C7] font-mono-numeral">
              Food Redistributed
            </div>
            <div className="font-mono-numeral text-2xl font-bold text-[#86C29B] mt-1">
              {metrics?.totalRedistributedKg || 0} <span className="text-xs font-normal text-[#C9B9C7]">kg</span>
            </div>
            <div className="text-[11px] text-[#C9B9C7] mt-0.5">delivered to recipients</div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="text-xs uppercase tracking-wider text-[#C9B9C7] font-mono-numeral">
              Nutritious Meals
            </div>
            <div className="font-mono-numeral text-2xl font-bold text-[#D9A441] mt-1">
              {metrics?.mealsGiven || 0}
            </div>
            <div className="text-[11px] text-[#C9B9C7] mt-0.5">2.5 portions per kg</div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="text-xs uppercase tracking-wider text-[#C9B9C7] font-mono-numeral">
              CO2e Diverted
            </div>
            <div className="font-mono-numeral text-2xl font-bold text-[#F3EEE2] mt-1">
              {metrics?.co2eAvoidedKg || 0} <span className="text-xs font-normal text-[#C9B9C7]">kg</span>
            </div>
            <div className="text-[11px] text-[#C9B9C7] mt-0.5">landfill gas avoided</div>
          </div>
        </div>
      </div>

      {/* Recent Audit Trail Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#5A3653] pb-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[#F3EEE2]">
              Regulatory Audit Trail Feed
            </h2>
            <p className="text-xs text-[#C9B9C7]">
              Immutable record of all food safety evaluations, claims, and KYC decisions ({metrics?.auditLogCount || 0} total events).
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="text-xs text-[#D9A441] hover:text-[#F3EEE2] hover:bg-[#4A2E44]">
            <Link href="/app/admin/audit-log">View full audit trail →</Link>
          </Button>
        </div>

        <div className="border border-[#5A3653] bg-[#3D2538] rounded-[6px] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#4A2E44] border-b border-[#5A3653] text-[#F3EEE2] uppercase font-mono-numeral text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Event Action</th>
                <th className="px-4 py-3 font-semibold">Entity Type</th>
                <th className="px-4 py-3 font-semibold">Rule Applied</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5A3653] text-[#D4CBBF]">
              {recentLogs.map((log) => (
                <tr key={log._id} className="hover:bg-[#4A2E44]/50 transition-colors">
                  <td className="px-4 py-3 font-mono-numeral font-medium text-[#F3EEE2]">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 font-mono-numeral text-[#C9B9C7]">
                    {log.entityType}
                  </td>
                  <td className="px-4 py-3 font-mono-numeral text-[#D9A441]">
                    {log.ruleApplied || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono-numeral uppercase ${
                        log.status === "verified_safe" || log.status === "approved" || log.status === "confirmed"
                          ? "bg-[#2F4B3A] text-[#86C29B] border border-[#2F4B3A]"
                          : log.status === "rejected" || log.status === "blocked"
                          ? "bg-clay-rust/20 text-[#F4A88E] border border-clay-rust"
                          : "bg-[#4A2E44] text-[#D9A441] border border-[#5A3653]"
                      }`}
                    >
                      {log.status || "logged"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono-numeral text-[#C9B9C7]">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
