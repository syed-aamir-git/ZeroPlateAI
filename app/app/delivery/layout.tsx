import { requireRole } from "@/lib/auth-helpers";
import { DeliveryMobileShell } from "@/components/layouts/delivery-mobile-shell";

export default async function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["delivery_partner", "platform_admin"]);

  return (
    <DeliveryMobileShell>
      {children}
    </DeliveryMobileShell>
  );
}
