import { requireRole } from "@/lib/auth-helpers";
import { AppSidebarShell } from "@/components/layouts/app-sidebar-shell";
import SignOutButton from "@/components/auth/sign-out-button";

export default async function NgoDashboardPage() {
  const session = await requireRole(["ngo"]);
  const user = session.user;

  const navItems = [
    { href: "/dashboard/ngo", label: "Browse Listings", icon: "browse" },
    { href: "/dashboard/ngo/claims", label: "My Claims", icon: "claims" },
    { href: "/dashboard/ngo/impact", label: "Impact", icon: "impact" },
    { href: "/dashboard/ngo/organization", label: "Organization", icon: "organization" },
  ];

  return (
    <AppSidebarShell
      role="ngo"
      roleLabel="NGO / Recipient"
      navItems={navItems}
      currentPath="/dashboard/ngo"
      userEmail={user.email}
      userName={user.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border border-line bg-[#FAF6EE] p-6 rounded-[6px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft block mb-1">
                Auth Flow Verification — Role: ngo
              </span>
              <h1 className="font-display text-2xl sm:text-3xl text-ink">
                NGO Recipient Session Confirmed
              </h1>
            </div>
            <SignOutButton />
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-line pt-4 text-xs">
            <div>
              <span className="text-ink-soft block">Authenticated Contact</span>
              <span className="font-semibold text-ink text-sm">{user.name}</span>
            </div>
            <div>
              <span className="text-ink-soft block">Email Address</span>
              <span className="font-semibold text-ink text-sm font-ledger-mono">{user.email}</span>
            </div>
            <div>
              <span className="text-ink-soft block">Profile & KYC Status</span>
              <span className="inline-block px-2 py-0.5 rounded-full bg-saffron/20 text-[#7E570A] font-semibold mt-0.5">
                Profile Completed (KYC Pending)
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppSidebarShell>
  );
}
