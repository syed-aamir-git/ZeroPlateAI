"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppSidebarShell, NavItem } from "@/components/layouts/app-sidebar-shell";
import { DeliveryMobileShell } from "@/components/layouts/delivery-mobile-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { BellIcon, CheckIcon } from "@/components/icons/ledger-icons";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  readStatus: boolean;
  createdAt: string;
}

export default function NotificationsCenterPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [role, setRole] = useState<string>("institution");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch("/api/auth/get-session");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData?.user?.role) {
            setRole(authData.user.role);
          }
        }

        const notifRes = await fetch("/api/v1/notifications");
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

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

  const content = (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-ink font-bold">
            Notifications Center
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Official system dispatches, surplus matches, and lifecycle audit alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-line p-0.5 bg-ledger-paper text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                filter === "all" ? "bg-ledger-surface font-semibold text-ink" : "text-ink-soft"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                filter === "unread"
                  ? "bg-ledger-surface font-semibold text-ink"
                  : "text-ink-soft"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs px-3 py-1.5 rounded border border-line bg-ledger-surface hover:bg-ledger-paper text-basil font-medium cursor-pointer transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications Ledger Table */}
      <div className="border border-line bg-ledger-surface overflow-hidden rounded-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line bg-ledger-paper text-[11px] uppercase tracking-wider text-ink-soft">
              <th className="py-3 px-4 w-12 text-center">Status</th>
              <th className="py-3 px-4">Event Details</th>
              <th className="py-3 px-4 w-36 font-mono text-right">Timestamp</th>
              <th className="py-3 px-4 w-28 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-ink-soft">
                  Loading ledger records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-ink-soft">
                  No {filter === "unread" ? "unread " : ""}notifications logged in your account.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item._id}
                  className={`transition-colors ${
                    !item.readStatus ? "bg-saffron/10 font-medium" : "hover:bg-black/5"
                  }`}
                >
                  <td className="py-4 px-4 text-center">
                    {!item.readStatus ? (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full bg-clay-rust"
                        title="Unread notification"
                      />
                    ) : (
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-ink-soft/40"
                        title="Read"
                      />
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-ink font-semibold">{item.title}</div>
                    <div className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                      {item.message}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-xs text-ink-soft whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString()}{" "}
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {item.link && (
                        <Link
                          href={item.link}
                          className="text-xs text-basil hover:underline font-medium"
                        >
                          View
                        </Link>
                      )}
                      {!item.readStatus && (
                        <button
                          onClick={() => handleMarkItemRead(item._id)}
                          className="text-xs text-ink-soft hover:text-ink cursor-pointer underline"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  if (role === "delivery_partner") {
    return <DeliveryMobileShell currentTab="profile">{content}</DeliveryMobileShell>;
  }

  const roleNavItems: Record<string, { role: "institution" | "ngo" | "admin"; roleLabel: string; navItems: NavItem[] }> = {
    institution_admin: {
      role: "institution",
      roleLabel: "Institution Admin",
      navItems: [
        { href: "/app/institution/overview", label: "Overview", icon: "ledger-tab" },
        { href: "/app/institution/inventory", label: "Inventory", icon: "crate" },
        { href: "/app/institution/forecast", label: "Forecast", icon: "forecast" },
        { href: "/app/institution/surplus-listings", label: "Surplus Listings", icon: "ticket" },
        { href: "/app/institution/settings", label: "Settings", icon: "settings" },
      ],
    },
    ngo: {
      role: "ngo",
      roleLabel: "Verified NGO",
      navItems: [
        { href: "/app/ngo/browse", label: "Browse Listings", icon: "ticket" },
        { href: "/app/ngo/my-claims", label: "My Claims", icon: "ledger-tab" },
        { href: "/app/ngo/impact", label: "Impact Ledger", icon: "forecast" },
        { href: "/app/ngo/organization", label: "Organization", icon: "shield-check" },
      ],
    },
    platform_admin: {
      role: "admin",
      roleLabel: "Platform Admin",
      navItems: [
        { href: "/app/admin/overview", label: "Platform Overview", icon: "ledger-tab" },
        { href: "/app/admin/ngo-verification", label: "NGO Verification", icon: "shield-check" },
        { href: "/app/admin/institutions", label: "Institutions", icon: "crate" },
        { href: "/app/admin/safety-rules", label: "Safety Rules", icon: "settings" },
        { href: "/app/admin/audit-log", label: "Audit Log", icon: "ticket" },
        { href: "/app/admin/users", label: "User Directory", icon: "route" },
      ],
    },
  };

  const currentRoleConfig =
    roleNavItems[role] || roleNavItems["institution_admin"];

  return (
    <AppSidebarShell
      role={currentRoleConfig.role}
      roleLabel={currentRoleConfig.roleLabel}
      navItems={currentRoleConfig.navItems}
      currentPath="/app/notifications"
    >
      {content}
    </AppSidebarShell>
  );
}
