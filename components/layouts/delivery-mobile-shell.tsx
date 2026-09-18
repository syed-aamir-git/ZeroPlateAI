"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  RouteIcon,
  LedgerTabIcon,
  UserIcon,
  BellIcon,
} from "@/components/icons/ledger-icons";

import { usePathname } from "next/navigation";

interface DeliveryMobileShellProps {
  children: React.ReactNode;
  currentTab?: string;
  activeAssignmentCount?: number;
}

export function DeliveryMobileShell({
  children,
  activeAssignmentCount = 0,
}: DeliveryMobileShellProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: "assignments",
      label: "Assignments",
      href: "/app/delivery/assignments",
      icon: RouteIcon,
      badge: activeAssignmentCount > 0 ? activeAssignmentCount : undefined,
      isActive: pathname.startsWith("/app/delivery/assignments") || pathname === "/app/delivery",
    },
    {
      id: "history",
      label: "History",
      href: "/app/delivery/history",
      icon: LedgerTabIcon,
      isActive: pathname.startsWith("/app/delivery/history"),
    },
    {
      id: "profile",
      label: "Profile",
      href: "/app/delivery/profile",
      icon: UserIcon,
      isActive: pathname.startsWith("/app/delivery/profile"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#24211C] text-[#F3EEE2]">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-30 h-14 px-4 bg-[#24211C]/95 backdrop-blur-xs border-b border-[#3B362E] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold text-[#F3EEE2]">
            ZeroPlate <span className="text-saffron text-xs uppercase tracking-wider font-sans font-medium px-1.5 py-0.5 rounded-full border border-saffron/40 bg-saffron/10">Partner</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/delivery/notifications"
            className="p-2 rounded-[6px] border border-[#3B362E] text-[#D4CBBF] hover:text-[#F3EEE2] focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Partner alerts and notifications"
          >
            <BellIcon size={18} strokeWidth={1.5} />
          </Link>
        </div>
      </header>

      {/* Main Single Column Scrollable Content */}
      <main className="flex-1 p-4 pb-24 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Bottom Tab Bar (min 44px touch targets) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1D1B17] border-t border-[#3B362E] py-1 px-4">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.isActive;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[70px] min-h-[48px] py-1 px-2 rounded-[6px] transition-colors relative text-xs",
                  isActive
                    ? "text-[#D9A441] font-semibold"
                    : "text-[#9E9587] hover:text-[#F3EEE2]"
                )}
              >
                <div className="relative">
                  <Icon
                    size={20}
                    strokeWidth={1.75}
                    className={isActive ? "text-[#D9A441]" : "text-[#9E9587]"}
                  />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 bg-clay-rust text-[#F3EEE2] text-[10px] font-mono-numeral font-bold px-1 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[11px] tracking-tight">{tab.label}</span>
                {isActive && (
                  <span className="w-4 h-0.5 bg-[#D9A441] rounded-full mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
