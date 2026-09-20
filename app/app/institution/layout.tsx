import { requireRole } from "@/lib/auth-helpers";
import { AppSidebarShell } from "@/components/layouts/app-sidebar-shell";

export default async function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["institution_admin"]);
  const user = session.user;

  const navItems = [
    { href: "/app/institution/overview", label: "Overview", icon: "overview" },
    { href: "/app/institution/analytics", label: "Analytics", icon: "analytics" },
    { href: "/app/institution/forecast", label: "Forecast", icon: "forecast" },
    { href: "/app/institution/inventory", label: "Inventory", icon: "inventory" },
    { href: "/app/institution/surplus-listings", label: "Surplus Listings", icon: "ticket" },
    { href: "/app/institution/deliveries", label: "Deliveries", icon: "deliveries" },
    { href: "/app/institution/network", label: "NGO Network", icon: "verification" },
    { href: "/app/institution/reports", label: "ESG Reports", icon: "impact" },
    { href: "/app/institution/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <AppSidebarShell
      role="institution"
      roleLabel="Institution Admin"
      navItems={navItems}
      userEmail={user.email}
      userName={user.name}
    >
      {children}
    </AppSidebarShell>
  );
}
