"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { Sparkles, Menu, X, ArrowRight, ShieldCheck } from "lucide-react";

interface PublicNavProps {
  hideAuthButtons?: boolean;
}

function getDashboardUrl(user?: Record<string, unknown> | null) {
  if (!user) return "/login";
  if (!user.profileCompleted) return "/onboarding";
  switch (user.role) {
    case "institution_admin":
      return "/app/institution/overview";
    case "ngo":
      return "/app/ngo/browse";
    case "delivery_partner":
      return "/app/delivery/assignments";
    case "platform_admin":
      return "/app/admin/overview";
    default:
      return "/app/institution/overview";
  }
}

export function PublicNav({ hideAuthButtons = false }: PublicNavProps) {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const navLinks = [
    { label: "How It Works", href: "/how-it-works" },
    { label: "For Kitchens", href: "/institutions" },
    { label: "For NGOs", href: "/ngos" },
    { label: "Impact Ledger", href: "/impact" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
                ZeroPlate
                <span className="ml-0.5 text-amber-500 font-extrabold">.ai</span>
              </span>
              <span className="text-[10px] font-medium text-emerald-700 tracking-wide uppercase -mt-1 hidden sm:block">
                AI Food Rescue Network
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-lg px-3.5 py-2 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section: Desktop Auth Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {hideAuthButtons ? (
            session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500 truncate max-w-[200px] bg-slate-100 px-2 py-1 rounded-md">
                  {session.user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg"
                >
                  Sign out
                </Button>
              </div>
            ) : null
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-sm hover:shadow-md transition-all rounded-lg"
              >
                <Link href={getDashboardUrl(session.user)}>Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-xs border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 hover:text-emerald-700 px-3.5 py-2 rounded-lg hover:bg-slate-100/80 transition-colors"
              >
                Log in
              </Link>
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-sm hover:shadow-md transition-all rounded-lg px-4 py-2"
              >
                <Link href="/register" className="flex items-center gap-1.5">
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          {!hideAuthButtons && !session?.user && (
            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg"
            >
              <Link href="/register">Sign up</Link>
            </Button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-lg px-4 py-4 space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {session?.user ? (
              <>
                <Link
                  href={getDashboardUrl(session.user)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white"
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-center py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

