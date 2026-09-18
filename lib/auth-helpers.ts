import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type UserRole =
  | "institution_admin"
  | "ngo"
  | "delivery_partner"
  | "platform_admin";

export async function getServerSession() {
  const reqHeaders = await headers();
  try {
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });
    return session;
  } catch (error) {
    console.error("Error retrieving server session:", error);
    return null;
  }
}

export async function requireAuth(redirectTo = "/login") {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect(redirectTo);
  }
  return session;
}

export async function requireCompletedProfile(sessionUser: {
  role?: string | null;
  profileCompleted?: boolean | null;
}) {
  if (!sessionUser.profileCompleted) {
    redirect("/onboarding");
  }
}

export function getRoleDashboardPath(role?: string | null): string {
  switch (role) {
    case "institution_admin":
      return "/app/institution/overview";
    case "ngo":
      return "/app/ngo/browse";
    case "delivery_partner":
      return "/app/delivery/assignments";
    case "platform_admin":
      return "/app/admin/overview";
    default:
      return "/onboarding";
  }
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const role = (session.user as { role?: UserRole }).role;

  if (!role || !allowedRoles.includes(role)) {
    // Redirect to their own dashboard or onboarding
    redirect(getRoleDashboardPath(role));
  }

  // Also verify profile completion
  const profileCompleted = (session.user as { profileCompleted?: boolean })
    .profileCompleted;
  if (!profileCompleted) {
    redirect("/onboarding");
  }

  return session;
}
