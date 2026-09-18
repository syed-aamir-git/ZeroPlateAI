"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BellIcon,
  UserIcon,
  CrateIcon,
  TicketIcon,
  ForecastIcon,
  LedgerTabIcon,
  RouteIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@/components/icons/ledger-icons";
import { NotificationBell } from "@/components/ui/notification-bell";

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
  badge?: string | number;
}

interface AppSidebarShellProps {
  role: "institution" | "ngo" | "admin";
  roleLabel: string;
  navItems: NavItem[];
  currentPath?: string;
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
}

function getIconComponent(key?: string) {
  switch (key) {
    case "inventory":
    case "institutions":
      return CrateIcon;
    case "forecast":
      return ForecastIcon;
    case "surplus":
    case "ticket":
    case "browse":
      return TicketIcon;
    case "deliveries":
    case "claims":
      return RouteIcon;
    case "settings":
    case "safety_rules":
      return SettingsIcon;
    case "verification":
      return ShieldCheckIcon;
    case "organization":
    case "users":
      return UserIcon;
    case "overview":
    case "impact":
    case "audit":
    default:
      return LedgerTabIcon;
  }
}

export function AppSidebarShell({
  role,
  roleLabel,
  navItems,
  currentPath = "",
  children,
  userEmail,
  userName,
}: AppSidebarShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen flex bg-ledger-paper text-ink">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col w-64 shrink-0 border-r transition-colors",
          isAdmin
            ? "bg-[#3D2538] text-[#F3EEE2] border-[#5A3653]"
            : "bg-ledger-paper text-ink border-line"
        )}
      >
        {/* Sidebar Brand Header */}
        <div
          className={cn(
            "h-16 px-6 flex items-center justify-between border-b",
            isAdmin ? "border-[#5A3653]" : "border-line"
          )}
        >
          <Link href={`/dashboard/${role}`} className="flex items-center gap-2">
            <span
              className={cn(
                "font-display text-xl font-bold tracking-tight",
                isAdmin ? "text-[#F3EEE2]" : "text-basil"
              )}
            >
              ZeroPlate<span className="text-saffron">.ai</span>
            </span>
          </Link>
          <span
            className={cn(
              "text-[11px] font-mono-numeral uppercase tracking-wider px-2 py-0.5 rounded-full border",
              isAdmin
                ? "bg-[#4A2E44] text-[#E0D0DC] border-[#663E5D]"
                : "bg-[#2F4B3A]/10 text-basil border-basil/20"
            )}
          >
            {roleLabel}
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = getIconComponent(item.icon);
            const isActive =
              currentPath === item.href ||
              (item.href !== `/dashboard/${role}` &&
                currentPath.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors relative",
                  isActive
                    ? isAdmin
                      ? "text-[#F3EEE2] font-semibold border-l-[3px] border-[#D9A441] pl-[9px] bg-[#4A2E44]/40"
                      : "text-basil font-semibold border-l-[3px] border-basil pl-[9px] bg-[#EAE3D4]/50"
                    : isAdmin
                    ? "text-[#C9B9C7] hover:text-[#F3EEE2] hover:bg-[#4A2E44]/30 border-l-[3px] border-transparent pl-[9px]"
                    : "text-ink-soft hover:text-ink hover:bg-[#EAE3D4]/40 border-l-[3px] border-transparent pl-[9px]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    className={cn(
                      isActive
                        ? isAdmin
                          ? "text-[#D9A441]"
                          : "text-basil"
                        : isAdmin
                        ? "text-[#C9B9C7]"
                        : "text-ink-soft"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-mono-numeral",
                      isAdmin
                        ? "bg-[#663E5D] text-[#F3EEE2]"
                        : "bg-basil/10 text-basil"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile / Account Status */}
        <div
          className={cn(
            "p-4 border-t text-xs",
            isAdmin ? "border-[#5A3653] text-[#C9B9C7]" : "border-line text-ink-soft"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border shrink-0",
                isAdmin
                  ? "bg-[#4A2E44] border-[#663E5D] text-[#F3EEE2]"
                  : "bg-ledger-paper border-line text-ink"
              )}
            >
              <UserIcon size={16} strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "font-medium truncate",
                  isAdmin ? "text-[#F3EEE2]" : "text-ink"
                )}
              >
                {userName || "Authenticated User"}
              </div>
              <div className="truncate text-[11px] opacity-75">
                {userEmail || `${role}@zeroplate.ai`}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header
          className={cn(
            "h-16 px-4 sm:px-6 lg:px-8 border-b flex items-center justify-between shrink-0",
            isAdmin
              ? "bg-[#3D2538] text-[#F3EEE2] border-[#5A3653]"
              : "bg-ledger-paper border-line text-ink"
          )}
        >
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-[6px] border border-line text-ink"
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="font-display font-bold text-basil text-lg">
              ZeroPlate
            </span>
          </div>

          <div className="hidden md:block text-xs uppercase tracking-wider text-ink-soft">
            Institutional Abundance Ledger
          </div>

          {/* Top-Right: Notifications Bell + Profile Menu */}
          <div className="flex items-center gap-3">
            <NotificationBell isAdmin={isAdmin} />

            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-[6px] border text-xs font-medium",
                isAdmin
                  ? "border-[#5A3653] bg-[#4A2E44] text-[#F3EEE2]"
                  : "border-line bg-ledger-paper text-ink"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-basil" />
              <span>{roleLabel}</span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
