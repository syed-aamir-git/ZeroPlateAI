import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const isAuthenticated = Boolean(sessionCookie);

  // 1. Protected application routes
  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/app") ||
    pathname === "/inventory" ||
    pathname === "/surplus-listings";

  if (isProtectedAppRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-specific app route redirects for convenience & spec compliance
    if (pathname === "/dashboard/institution" || pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/app/institution/overview", request.url));
    }
    if (pathname === "/dashboard/ngo") {
      return NextResponse.redirect(new URL("/app/ngo/browse", request.url));
    }
    if (pathname === "/dashboard/delivery" || pathname === "/app/delivery") {
      return NextResponse.redirect(new URL("/app/delivery/assignments", request.url));
    }
    if (pathname === "/dashboard/delivery/history") {
      return NextResponse.redirect(new URL("/app/delivery/history", request.url));
    }
    if (pathname === "/dashboard/delivery/profile") {
      return NextResponse.redirect(new URL("/app/delivery/profile", request.url));
    }
    if (pathname === "/dashboard/admin" || pathname === "/app/admin") {
      return NextResponse.redirect(new URL("/app/admin/overview", request.url));
    }
    if (pathname === "/inventory") {
      return NextResponse.redirect(new URL("/app/institution/inventory", request.url));
    }
    if (pathname === "/surplus-listings") {
      return NextResponse.redirect(new URL("/app/institution/surplus-listings", request.url));
    }
  }

  // 2. Onboarding route: require active session
  if (pathname === "/onboarding") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 3. Auth pages: if already authenticated, keep user in app flows
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup";

  if (isAuthPage && isAuthenticated) {
    // Session is present, redirect to role check / onboarding
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/app/:path*",
    "/inventory/:path*",
    "/surplus-listings/:path*",
    "/onboarding",
    "/login",
    "/register",
    "/signup",
  ],
};
