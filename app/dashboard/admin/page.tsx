import { requireRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  await requireRole(["platform_admin"]);
  redirect("/app/admin/overview");
}
