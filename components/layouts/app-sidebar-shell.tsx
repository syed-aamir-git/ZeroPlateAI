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
  );

  return (
    <div className="min-h-screen flex bg-ledger-paper text-ink">
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
                ? "bg-[#3D2538] text-[#F3EEE2]"
                : "bg-ledger-paper text-ink"
            )}
          >
            {/* Mobile Header */}
            <div
              className={cn(
                "h-16 px-5 flex items-center justify-between border-b",
                isAdmin ? "border-[#5A3653]" : "border-line"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-display text-xl font-bold tracking-tight">
                  ZeroPlate<span className="text-saffron">.ai</span>
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono-numeral font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border shrink-0 whitespace-nowrap",
                    isAdmin
                      ? "bg-[#4A2E44] text-[#E0D0DC] border-[#663E5D]"
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
                isAdmin ? "border-[#5A3653]" : "border-line"
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
          "hidden md:flex flex-col w-64 shrink-0 border-r transition-colors",
          isAdmin
            ? "bg-[#3D2538] text-[#F3EEE2] border-[#5A3653]"
            : "bg-ledger-paper text-ink border-line"
        )}
      >
        {/* Sidebar Brand Header - Clean, Structured & Uncrowded */}
        <div
          className={cn(
            "h-16 px-5 flex items-center justify-between border-b transition-colors",
            isAdmin ? "border-[#5A3653] bg-[#352031]/40" : "border-line bg-ledger-paper"
          )}
        >
          <Link href={`/dashboard/${role}`} className="flex items-center gap-2 group">
            <span
              className={cn(
                "font-display text-xl font-bold tracking-tight transition-colors",
                isAdmin ? "text-[#F3EEE2] group-hover:text-saffron" : "text-basil group-hover:text-basil-dark"
              )}
            >
              ZeroPlate<span className="text-saffron">.ai</span>
            </span>
          </Link>
          <span
            className={cn(
              "text-[10px] font-mono-numeral font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border shrink-0 whitespace-nowrap",
              isAdmin
                ? "bg-[#4A2E44] text-[#E0D0DC] border-[#663E5D]"
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
            isAdmin ? "border-[#5A3653] text-[#C9B9C7]" : "border-line text-ink-soft"
          )}
        >
          {/* Floating Popover Menu */}
          {isProfileMenuOpen && (
            <div
              className={cn(
                "absolute bottom-[calc(100%+8px)] left-3 right-3 rounded-[8px] border shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150",
                isAdmin
                  ? "bg-[#352031] border-[#5A3653] text-[#F3EEE2]"
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
                      "inline-flex items-center text-[10px] font-mono-numeral uppercase tracking-wider px-1.5 py-0.5 rounded border",
                      isAdmin
                        ? "bg-[#4A2E44] text-[#E0D0DC] border-[#663E5D]"
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
                  "w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer text-left",
                  isAdmin
                    ? "text-rose-300 hover:text-rose-100 hover:bg-rose-500/20"
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
              "w-full flex items-center gap-3 p-2 rounded-[6px] transition-all text-left cursor-pointer border border-transparent",
              isAdmin
                ? "hover:bg-[#4A2E44]/50 hover:border-[#663E5D] focus:ring-2 focus:ring-[#D9A441]/50"
                : "hover:bg-[#EAE3D4]/60 hover:border-line focus:ring-2 focus:ring-basil/30",
              isProfileMenuOpen && (isAdmin ? "bg-[#4A2E44]/60 border-[#663E5D]" : "bg-[#EAE3D4]/80 border-line")
            )}
          >
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
                  "font-medium truncate text-xs",
                  isAdmin ? "text-[#F3EEE2]" : "text-ink"
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
              className="p-1.5 rounded-[6px] border border-line text-ink cursor-pointer"
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

          <div className="hidden md:block text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            {role === "ngo"
              ? "Community Redistribution Ledger"
              : role === "admin"
              ? "Platform Compliance & Safety Ledger"
              : "Institutional Abundance Ledger"}
          </div>

          {/* Top-Right: Notifications Bell + Role Badge */}
          <div className="flex items-center gap-3">
            <NotificationBell isAdmin={isAdmin} />

            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-[6px] border text-xs font-medium shrink-0",
                isAdmin
                  ? "border-[#5A3653] bg-[#4A2E44] text-[#F3EEE2]"
                  : "border-line bg-ledger-paper text-ink"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-basil shrink-0" />
              <span className="whitespace-nowrap">{roleLabel}</span>
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
