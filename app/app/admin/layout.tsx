import { requireRole } from "@/lib/auth-helpers";
import { AppSidebarShell } from "@/components/layouts/app-sidebar-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["platform_admin"]);
  const user = session.user;

  const navItems = [
    { href: "/app/admin/overview", label: "Platform Overview", icon: "overview" },
    { href: "/app/admin/ngo-verification", label: "NGO Verification", icon: "verification" },
    { href: "/app/admin/institutions", label: "Institutions", icon: "institutions" },
    { href: "/app/admin/safety-rules", label: "Safety Rules Config", icon: "safety_rules" },
    { href: "/app/admin/audit-log", label: "Audit Trail", icon: "audit" },
    { href: "/app/admin/users", label: "User Accounts", icon: "users" },
    { href: "/app/admin/notifications", label: "Notification Center", icon: "notifications" },
  ];

  return (
    <AppSidebarShell
      role="admin"
      roleLabel="Platform Administrator"
      navItems={navItems}
      userEmail={user.email}
      userName={user.name}
    >
      <div className="text-zinc-900 min-h-full">
        {children}
      </div>
    </AppSidebarShell>
  );
}
