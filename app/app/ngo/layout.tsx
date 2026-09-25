import { requireRole } from "@/lib/auth-helpers";
import { AppSidebarShell } from "@/components/layouts/app-sidebar-shell";

export default async function NgoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["ngo", "platform_admin"]);
  const user = session.user;

  const navItems = [
    { href: "/app/ngo/browse", label: "Browse Surplus", icon: "ticket" },
    { href: "/app/ngo/my-claims", label: "My Claims", icon: "crate" },
    { href: "/app/ngo/impact", label: "Redistribution Impact", icon: "overview" },
    { href: "/app/ngo/notifications", label: "Notifications", icon: "notifications" },
    { href: "/app/ngo/organization", label: "Organization KYC", icon: "settings" },
  ];

  return (
    <AppSidebarShell
      role="ngo"
      roleLabel="Verified NGO Partner"
      navItems={navItems}
      userEmail={user.email}
      userName={user.name}
    >
      {children}
    </AppSidebarShell>
  );
}
