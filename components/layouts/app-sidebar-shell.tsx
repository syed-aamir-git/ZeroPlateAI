"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
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
  LogOutIcon,
  AnalyticsIcon,
  ResourceIcon,
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
    case "analytics":
      return AnalyticsIcon;
    case "forecast":
      return ForecastIcon;
    case "utilization":
    case "resource":
      return ResourceIcon;
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
    case "notifications":
    case "bell":
      return BellIcon;
    case "overview":
    case "impact":
    case "audit":
    default:
      return LedgerTabIcon;
  }
}

function getRolePill(role: string) {
  switch (role) {
    case "ngo":
      return "NGO";
    case "admin":
      return "Admin";
    case "institution":
    default:
      return "Kitchen";
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const isAdmin = role === "admin";

  // Handle clicking outside or pressing Escape to close the profile menu
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isProfileMenuOpen]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      window.location.href = "/";
    }
  };

  const renderNavLinks = (onItemClick?: () => void) => (
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
            onClick={onItemClick}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all relative rounded-xl",
              isActive
                ? isAdmin
                  ? "text-emerald-950 font-bold border-l-[3.5px] border-emerald-600 pl-3 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent shadow-2xs"
                  : "text-basil font-semibold border-l-[3px] border-basil pl-[9px] bg-[#EAE3D4]/50"
                : isAdmin
                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-l-[3.5px] border-transparent pl-3"
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
                      ? "text-emerald-700"
                      : "text-basil"
                    : isAdmin
                    ? "text-slate-400 group-hover:text-slate-700"
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
                    ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs"
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
  );

  return (
    <div className={cn("h-screen flex overflow-hidden", isAdmin ? "bg-[#F8F9FA] text-zinc-900" : "bg-ledger-paper text-ink")}>
      {/* Mobile Menu Backdrop & Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside
            className={cn(
              "relative w-72 max-w-[85vw] flex flex-col h-full shadow-2xl z-10 transition-colors",
              isAdmin
                ? "bg-white text-slate-900 border-r border-slate-200"
                : "bg-ledger-paper text-ink"
            )}
          >
            {/* Mobile Header */}
            <div
              className={cn(
                "h-16 px-5 flex items-center justify-between border-b",
                isAdmin ? "border-slate-200 bg-slate-50/80" : "border-line"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-display text-xl font-bold tracking-tight">
                  ZeroPlate<span className="text-saffron">.ai</span>
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono-numeral font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap shadow-2xs",
                    isAdmin
                      ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-0 font-bold"
                      : "bg-basil/10 text-basil border-basil/20"
                  )}
                >
                  {getRolePill(role)}
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-[6px] text-ink-soft hover:text-ink cursor-pointer"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Mobile Nav Links */}
            {renderNavLinks(() => setIsMobileMenuOpen(false))}

            {/* Mobile Sign Out Bar */}
            <div
              className={cn(
                "p-4 border-t text-xs",
                isAdmin ? "border-slate-200 bg-slate-50/80" : "border-line"
              )}
            >
              <div className="mb-3">
                <div className="font-semibold text-xs truncate">
                  {userName || "Authenticated User"}
                </div>
                <div className="text-[11px] opacity-75 truncate">
                  {userEmail || `${role}@zeroplate.ai`}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-[6px] bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                <LogOutIcon size={16} />
                <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col w-64 h-full shrink-0 border-r transition-colors select-none",
          isAdmin
            ? "bg-gradient-to-b from-slate-50/95 via-white to-slate-50/80 text-slate-900 border-slate-200/90 shadow-xs"
            : "bg-ledger-paper text-ink border-line"
        )}
      >
        {/* Sidebar Brand Header */}
        <div
          className={cn(
            "h-16 px-5 flex items-center justify-between border-b transition-colors",
            isAdmin
              ? "border-slate-200/80 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/10"
              : "border-line bg-ledger-paper"
          )}
        >
          <Link href={`/dashboard/${role}`} className="flex items-center gap-2 group">
            <span
              className={cn(
                "font-display text-xl font-bold tracking-tight transition-colors",
                isAdmin
                  ? "text-emerald-800 group-hover:text-emerald-950"
                  : "text-basil group-hover:text-basil-dark"
              )}
            >
              ZeroPlate<span className="text-saffron">.ai</span>
            </span>
          </Link>
          <span
            className={cn(
              "text-[10px] font-mono-numeral font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap shadow-2xs",
              isAdmin
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-0 font-bold"
                : "bg-basil/10 text-basil border-basil/20"
            )}
          >
            {getRolePill(role)}
          </span>
        </div>

        {/* Sidebar Navigation */}
        {renderNavLinks()}

        {/* Bottom Left Profile / Sign Out Trigger */}
        <div
          ref={profileRef}
          className={cn(
            "p-3 border-t text-xs relative",
            isAdmin
              ? "border-slate-200/80 text-slate-600 bg-slate-50/50"
              : "border-line text-ink-soft"
          )}
        >
          {/* Floating Popover Menu */}
          {isProfileMenuOpen && (
            <div
              className={cn(
                "absolute bottom-[calc(100%+8px)] left-3 right-3 rounded-2xl border shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150",
                isAdmin
                  ? "bg-white border-slate-200 text-slate-900 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.15)]"
                  : "bg-ledger-paper border-line text-ink shadow-[0_10px_25px_-5px_rgba(47,75,58,0.15)]"
              )}
            >
              {/* User Details Header */}
              <div className="px-2.5 py-2 border-b border-line/50 mb-1">
                <div className="font-semibold text-xs truncate">
                  {userName || "Authenticated User"}
                </div>
                <div className="text-[11px] opacity-75 truncate">
                  {userEmail || `${role}@zeroplate.ai`}
                </div>
                <div className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center text-[10px] font-mono-numeral uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold",
                      isAdmin
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-basil/10 text-basil border-basil/20"
                    )}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Sign Out Action Button */}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left",
                  isAdmin
                    ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    : "text-rose-700 hover:text-rose-800 hover:bg-rose-50"
                )}
              >
                <LogOutIcon size={16} className="shrink-0 text-rose-600" />
                <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          )}

          {/* Clickable Profile Card */}
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
            title="Click to view profile & sign out"
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left cursor-pointer border border-transparent",
              isAdmin
                ? "hover:bg-slate-100 hover:border-slate-200/90 focus:ring-2 focus:ring-emerald-500/30"
                : "hover:bg-[#EAE3D4]/60 hover:border-line focus:ring-2 focus:ring-basil/30",
              isProfileMenuOpen &&
                (isAdmin
                  ? "bg-slate-100 border-slate-200/90 shadow-2xs"
                  : "bg-[#EAE3D4]/80 border-line")
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border shrink-0 font-bold",
                isAdmin
                  ? "bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500/30 text-white shadow-2xs"
                  : "bg-ledger-paper border-line text-ink"
              )}
            >
              <UserIcon size={16} strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "font-semibold truncate text-xs",
                  isAdmin ? "text-slate-900" : "text-ink"
                )}
              >
                {userName || "Authenticated User"}
              </div>
              <div className="truncate text-[11px] opacity-75">
                {userEmail || `${role}@zeroplate.ai`}
              </div>
            </div>
            {/* Subtle expand chevron icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={cn(
                "shrink-0 opacity-50 transition-transform duration-200",
                isProfileMenuOpen ? "rotate-180" : ""
              )}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top App Bar (Navbar) */}
        <header
          className={cn(
            "relative z-40 h-16 px-4 sm:px-6 lg:px-8 border-b flex items-center justify-between shrink-0",
            isAdmin
              ? "bg-white/95 backdrop-blur-md text-slate-900 border-slate-200/90 shadow-2xs"
              : "bg-ledger-paper border-line text-ink"
          )}
        >
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="font-display font-bold text-emerald-800 text-lg">
              ZeroPlate
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            {role === "ngo" ? (
              "Community Redistribution Ledger"
            ) : role === "admin" ? (
              <span className="flex items-center gap-2.5">
                <span className="text-slate-800 font-semibold normal-case font-sans text-sm">
                  Platform Operations &amp; Safety Hub
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 normal-case font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Command
                </span>
              </span>
            ) : (
              "Institutional Abundance Ledger"
            )}
          </div>

          {/* Top-Right: Notifications Bell + Role Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell
              isAdmin={isAdmin}
              notificationsHref={
                isAdmin
                  ? "/app/admin/notifications"
                  : role === "ngo"
                  ? "/app/ngo/notifications"
                  : "/app/institution/notifications"
              }
            />

            <div
              className={cn(
                "flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0",
                isAdmin
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-950 font-semibold shadow-2xs"
                  : "border-line bg-ledger-paper text-ink"
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  isAdmin ? "bg-emerald-600 animate-pulse" : "bg-basil"
                )}
              />
              <span className="whitespace-nowrap hidden sm:inline">{roleLabel}</span>
              <span className="whitespace-nowrap sm:hidden">{getRolePill(role)}</span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className={cn("flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto", isAdmin ? "bg-[#F8F9FA]" : "")}>
          {children}
        </main>
      </div>
    </div>
  );
}
