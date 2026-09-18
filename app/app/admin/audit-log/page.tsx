"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { LedgerTabIcon, ShieldCheckIcon } from "@/components/icons/ledger-icons";

interface AuditRecord {
  _id: string;
  entityType: string;
  entityId?: string;
  action: string;
  ruleApplied?: string;
  status?: string;
  performedBy?: string;
  createdAt: string;
  details?: Record<string, any>;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = React.useState<AuditRecord[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [limit] = React.useState(25);
  const [entityFilter, setEntityFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);

  const fetchAuditLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/v1/admin/audit-log", window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));
      if (entityFilter !== "all") {
        url.searchParams.set("entityType", entityFilter);
      }

      const res = await fetch(url.toString());
      const json = await res.json();
      if (res.ok) {
        setLogs(json.logs || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, entityFilter]);

  React.useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#5A3653] pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-[#D9A441]">
            Statutory Traceability & Compliance
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-0.5">
            Immutable Audit Trail ({total} Events)
          </h1>
        </div>

        <div className="font-mono-numeral text-xs text-[#C9B9C7]">
          MongoDB Collection: <code className="text-[#D9A441]">auditLogs</code>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#5A3653] bg-[#3D2538] p-3 rounded-[6px]">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All Audit Events" },
            { id: "SurplusListing", label: "Surplus Listings" },
            { id: "NGO", label: "NGO KYC" },
            { id: "DeliveryAssignment", label: "Logistics Handoffs" },
            { id: "SafetyRuleConfiguration", label: "Rule Config" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setEntityFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-[4px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                entityFilter === tab.id
                  ? "bg-[#D9A441] text-[#24211C] font-bold"
                  : "bg-[#4A2E44] text-[#C9B9C7] hover:text-[#F3EEE2] border border-[#5A3653]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#C9B9C7] font-mono-numeral">
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono-numeral text-[#C9B9C7]">
          Retrieving paginated audit log entries...
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-[#5A3653] bg-[#3D2538] p-12 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-[#5A3653] bg-[#4A2E44] mx-auto flex items-center justify-center text-[#D9A441]">
            <LedgerTabIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-medium text-[#F3EEE2]">
            No audit log records found
          </h2>
          <p className="text-xs text-[#C9B9C7] max-w-md mx-auto">
            All safety evaluations, listing approvals, claims, and KYC decisions are recorded here in real time.
          </p>
        </div>
      ) : (
        <div className="border border-[#5A3653] bg-[#3D2538] rounded-[6px] overflow-x-auto shadow-none">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#4A2E44] border-b border-[#5A3653] text-[#F3EEE2] uppercase font-mono-numeral text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Action / Event</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Rule Applied</th>
                <th className="px-4 py-3 font-semibold">Status Verdict</th>
                <th className="px-4 py-3 font-semibold">Actor / User</th>
                <th className="px-4 py-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5A3653] text-[#D4CBBF]">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-[#4A2E44]/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono-numeral font-semibold text-[#F3EEE2]">
                      {log.action}
                    </div>
                    {log.details && (
                      <div className="text-[10px] text-[#9E8A9A] font-mono-numeral truncate max-w-[220px]" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-mono-numeral text-[#D9A441]">{log.entityType}</div>
                    <div className="text-[10px] text-[#9E8A9A] font-mono-numeral">
                      {log.entityId ? String(log.entityId).slice(-6) : "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono-numeral text-[#F3EEE2]">
                    {log.ruleApplied || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono-numeral uppercase font-semibold ${
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
                    {log.performedBy ? String(log.performedBy).slice(-8) : "System"}
                  </td>

                  <td className="px-4 py-3 text-right font-mono-numeral text-[#C9B9C7]">
                    <div>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-[#9E8A9A]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#5A3653] pt-4 text-xs font-mono-numeral">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="border-[#5A3653] bg-[#3D2538] text-[#F3EEE2] hover:bg-[#4A2E44]"
          >
            ← Previous Page
          </Button>

          <span className="text-[#C9B9C7]">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="border-[#5A3653] bg-[#3D2538] text-[#F3EEE2] hover:bg-[#4A2E44]"
          >
            Next Page →
          </Button>
        </div>
      )}
    </div>
  );
}
