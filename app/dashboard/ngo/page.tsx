import { requireRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function NgoDashboardPage() {
  await requireRole(["ngo"]);
  redirect("/app/ngo/browse");
}
