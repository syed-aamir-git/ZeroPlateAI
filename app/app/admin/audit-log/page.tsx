"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { LedgerTabIcon } from "@/components/icons/ledger-icons";
import { FileText, ShieldCheck, Clock } from "lucide-react";

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
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Compliance &amp; Traceability
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
            Audit Trail ({total} Events)
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time immutable log of safety checks, food pickups, claims, and KYC decisions.
          </p>
        </div>

        <div className="text-xs text-zinc-500 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-xs">
          Log Storage: <code className="text-emerald-700 font-bold">auditLogs</code>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          {[
            { id: "all", label: "All Audit Events" },
            { id: "SurplusListing", label: "Surplus Listings" },
            { id: "NGO", label: "NGO Verification" },
            { id: "DeliveryAssignment", label: "Logistics Deliveries" },
            { id: "SafetyRuleConfiguration", label: "Safety Config" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setEntityFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                entityFilter === tab.id
                  ? "bg-white text-zinc-900 font-semibold shadow-xs border border-slate-200/60"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-zinc-500 font-medium px-2">
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="p-16 text-center space-y-3 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-zinc-500">
            Retrieving audit records...
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-slate-200/90 bg-white p-12 rounded-2xl text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-zinc-600">
            <LedgerTabIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-bold text-zinc-900">
            No audit log records found
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            All safety evaluations, listing approvals, claims, and KYC decisions are recorded here in real time.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200/90 bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Action / Event</th>
                  <th className="px-4 py-3.5">Entity</th>
                  <th className="px-4 py-3.5">Rule Applied</th>
                  <th className="px-4 py-3.5">Status Verdict</th>
                  <th className="px-4 py-3.5">Actor / User</th>
                  <th className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-zinc-700">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-zinc-900 text-xs">
                        {log.action}
                      </div>
                      {log.details && (
                        <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[240px]" title={JSON.stringify(log.details)}>
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-zinc-800">{log.entityType}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {log.entityId ? String(log.entityId).slice(-6) : "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-zinc-600">
                      {log.ruleApplied || "—"}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                          log.status === "verified_safe" || log.status === "approved" || log.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : log.status === "rejected" || log.status === "blocked"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-slate-100 text-zinc-700 border border-slate-200"
                        }`}
                      >
                        {log.status || "logged"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600 font-mono text-xs">
                      {log.performedBy ? String(log.performedBy).slice(-8) : "System"}
                    </td>

                    <td className="px-5 py-3.5 text-right text-zinc-500">
                      <div className="font-medium text-zinc-700">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="border-slate-200 bg-white text-zinc-700 hover:bg-slate-50 cursor-pointer shadow-xs rounded-xl"
          >
            ← Previous Page
          </Button>

          <span className="text-zinc-500 font-medium">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="border-slate-200 bg-white text-zinc-700 hover:bg-slate-50 cursor-pointer shadow-xs rounded-xl"
          >
            Next Page →
          </Button>
        </div>
      )}
    </div>
  );
}
