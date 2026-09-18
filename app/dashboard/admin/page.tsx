import { requireRole } from "@/lib/auth-helpers";
import { AppSidebarShell } from "@/components/layouts/app-sidebar-shell";
import SignOutButton from "@/components/auth/sign-out-button";

export default async function AdminDashboardPage() {
  const session = await requireRole(["platform_admin"]);
  const user = session.user;

  const navItems = [
    { href: "/dashboard/admin", label: "Overview", icon: "overview" },
    { href: "/dashboard/admin/ngo-verification", label: "NGO Verification", icon: "verification" },
    { href: "/dashboard/admin/institutions", label: "Institutions", icon: "institutions" },
    { href: "/dashboard/admin/safety-rules", label: "Safety Rules", icon: "safety_rules" },
    { href: "/dashboard/admin/audit-log", label: "Audit Trail", icon: "audit" },
    { href: "/dashboard/admin/users", label: "Users", icon: "users" },
  ];

  return (
    <AppSidebarShell
      role="admin"
      roleLabel="Platform Admin"
      navItems={navItems}
      currentPath="/dashboard/admin"
      userEmail={user.email}
      userName={user.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border border-[#5A3653] bg-[#FAF6EE] p-6 rounded-[6px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono-numeral text-xs uppercase tracking-wider text-plum block mb-1 font-semibold">
                Restricted Surface — Role: platform_admin
              </span>
              <h1 className="font-display text-2xl sm:text-3xl text-ink">
                Platform Super-Admin Session Confirmed
              </h1>
            </div>
            <SignOutButton />
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-line pt-4 text-xs">
            <div>
              <span className="text-ink-soft block">Super Admin Name</span>
              <span className="font-semibold text-ink text-sm">{user.name}</span>
            </div>
            <div>
              <span className="text-ink-soft block">Admin Email Address</span>
              <span className="font-semibold text-ink text-sm font-ledger-mono">{user.email}</span>
            </div>
            <div>
              <span className="text-ink-soft block">Clearance Level</span>
              <span className="inline-block px-2 py-0.5 rounded-full bg-plum/20 text-plum font-semibold mt-0.5">
                Full System Administration
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppSidebarShell>
  );
}
