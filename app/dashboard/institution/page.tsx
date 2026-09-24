import { requireRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function InstitutionDashboardPage() {
  await requireRole(["institution_admin"]);
  redirect("/app/institution/overview");
}
