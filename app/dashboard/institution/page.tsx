import { requireRole } from "@/lib/auth-helpers";
import { AppSidebarShell } from "@/components/layouts/app-sidebar-shell";
import SignOutButton from "@/components/auth/sign-out-button";

export default async function InstitutionDashboardPage() {
  const session = await requireRole(["institution_admin"]);
  const user = session.user;

  const navItems = [
    { href: "/dashboard/institution", label: "Overview", icon: "overview" },
    { href: "/inventory", label: "Inventory", icon: "inventory" },
    { href: "/dashboard/institution/forecast", label: "Forecast", icon: "forecast" },
    { href: "/surplus-listings", label: "Surplus Listings", icon: "ticket" },
    { href: "/dashboard/institution/deliveries", label: "Deliveries", icon: "deliveries" },
    { href: "/dashboard/institution/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <AppSidebarShell
      role="institution"
      roleLabel="Institution Admin"
      navItems={navItems}
      currentPath="/dashboard/institution"
      userEmail={user.email}
      userName={user.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border border-line bg-[#FAF6EE] p-6 rounded-[6px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft block mb-1">
                Auth Flow Verification — Role: institution_admin
              </span>
              <h1 className="font-display text-2xl sm:text-3xl text-ink">
                Institution Admin Session Confirmed
              </h1>
            </div>
            <SignOutButton />
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-line pt-4 text-xs">
            <div>
              <span className="text-ink-soft block">Authenticated User</span>
              <span className="font-semibold text-ink text-sm">{user.name}</span>
            </div>
            <div>
              <span className="text-ink-soft block">Email Address</span>
              <span className="font-semibold text-ink text-sm font-ledger-mono">{user.email}</span>
            </div>
            <div>
              <span className="text-ink-soft block">Profile Status</span>
              <span className="inline-block px-2 py-0.5 rounded-full bg-basil/15 text-basil font-semibold mt-0.5">
                Completed
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppSidebarShell>
  );
}
