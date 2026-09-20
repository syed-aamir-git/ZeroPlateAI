"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";

interface PublicNavProps {
  hideAuthButtons?: boolean;
}

function getDashboardUrl(user?: Record<string, unknown> | null) {
  if (!user) return "/dashboard/institution";
  if (!user.profileCompleted) return "/onboarding";
  switch (user.role) {
    case "institution_admin":
      return "/dashboard/institution";
    case "ngo":
      return "/dashboard/ngo";
    case "delivery_partner":
      return "/dashboard/delivery";
    case "platform_admin":
      return "/dashboard/admin";
    default:
      return "/dashboard/institution";
  }
}

export function PublicNav({ hideAuthButtons = false }: PublicNavProps) {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-ledger-paper/95 backdrop-blur-xs border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Basil Wordmark */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display text-2xl font-bold text-basil tracking-tight">
              ZeroPlate<span className="text-saffron">.ai</span>
            </span>
          </Link>

          {/* Center/Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-soft">
            <Link
              href="/how-it-works"
              className="hover:text-basil transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/institutions"
              className="hover:text-basil transition-colors"
            >
              For Institutions
            </Link>
            <Link href="/ngos" className="hover:text-basil transition-colors">
              For NGOs
            </Link>
            <Link href="/impact" className="hover:text-basil transition-colors">
              Impact
            </Link>
            <Link href="/about" className="hover:text-basil transition-colors">
              About
            </Link>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          {hideAuthButtons ? (
            session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-ink-soft hidden sm:inline-block truncate max-w-[200px]">
                  {session.user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs border-line bg-transparent hover:bg-[#FAF6EE] text-ink"
                >
                  Sign out
                </Button>
              </div>
            ) : null
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <Button asChild variant="default" size="sm">
                <Link href={getDashboardUrl(session.user)}>Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-xs border-line bg-transparent hover:bg-[#FAF6EE] text-ink"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-ink hover:text-basil transition-colors px-2 py-1"
              >
                Log in
              </Link>
              <Button asChild variant="default" size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
