import { requireRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function DeliveryDashboardPage() {
  await requireRole(["delivery_partner"]);
  redirect("/app/delivery/assignments");
}
