"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, AlertTriangle, ShieldCheck, Truck, RefreshCw, MailOpen, ArrowRight } from "lucide-react";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  readStatus: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readStatus: true }))
        );
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleMarkItemRead = async (id: string) => {
    try {
      await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readStatus: true } : n))
      );
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const filtered = notifications.filter((n) =>
    filter === "unread" ? !n.readStatus : true
  );

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "kyc":
      case "ngo_verification":
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case "delivery":
      case "dispatch":
        return <Truck className="w-4 h-4 text-sky-600" />;
      case "safety":
      case "gating":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            Communications &amp; Real-Time Alerts
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            System dispatches, regulatory KYC decisions, food safety gating notices, and operational audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-slate-200/90 p-1 bg-slate-100 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all font-medium ${
                filter === "all"
                  ? "bg-white text-zinc-900 font-semibold shadow-xs border border-slate-200/60"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all font-medium ${
                filter === "unread"
                  ? "bg-white text-zinc-900 font-semibold shadow-xs border border-slate-200/60"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-emerald-700 font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <MailOpen className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-zinc-600 hover:text-zinc-900 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
            title="Refresh Notifications"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications Table */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <div className="text-xs text-zinc-500">
            Loading notifications ledger...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-slate-200/90 bg-white p-12 rounded-2xl text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-zinc-600">
            <CheckCircle2 size={24} className="text-emerald-600" />
          </div>
          <h2 className="font-display text-lg font-bold text-zinc-900">
            {filter === "unread" ? "You're all caught up!" : "No notifications logged yet"}
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {filter === "unread"
              ? "All pending alerts and dispatches have been reviewed."
              : "System updates, compliance alerts, and surplus dispatches will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200/90 bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 w-12 text-center">Status</th>
                  <th className="px-4 py-3.5">Notification Event</th>
                  <th className="px-4 py-3.5 w-44 text-right">Timestamp</th>
                  <th className="px-5 py-3.5 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-zinc-700">
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    className={`transition-colors ${
                      !item.readStatus
                        ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <td className="px-5 py-4 text-center">
                      {!item.readStatus ? (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100"
                          title="Unread notification"
                        />
                      ) : (
                        <span
                          className="inline-block w-2 h-2 rounded-full bg-slate-300"
                          title="Read notification"
                        />
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                            <span>{item.title}</span>
                            {!item.readStatus && (
                              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-600 leading-relaxed max-w-2xl">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right text-zinc-500 font-mono text-xs whitespace-nowrap">
                      <div>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5">
                        {item.link && (
                          <Link
                            href={item.link}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        {!item.readStatus && (
                          <button
                            onClick={() => handleMarkItemRead(item._id)}
                            className="text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer font-medium hover:underline"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
