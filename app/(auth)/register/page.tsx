"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState(
    roleParam && ["institution_admin", "ngo", "delivery_partner", "platform_admin"].includes(roleParam)
      ? roleParam
      : "institution_admin"
  );
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (roleParam && ["institution_admin", "ngo", "delivery_partner", "platform_admin"].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [roleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signUp.email({
        email,
        password,
        name,
        role,
        profileCompleted: false,
      } as Parameters<typeof signUp.email>[0]);

      if (res.error) {
        const errorMsg = res.error.message || "";
        const isExistingUser =
          errorMsg.toLowerCase().includes("already exists") ||
          (res.error as { code?: string }).code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
          (res.error as { status?: number }).status === 422;

        if (isExistingUser) {
          setError(
            `An account with email "${email}" already exists. Please log in with your password, or use a different email address.`
          );
        } else {
          setError(errorMsg || "Failed to create account. Please verify your details.");
        }
        setLoading(false);
        return;
      }

      router.push("/onboarding");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during registration.";
      setError(message);
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const res = await signIn.social({
        provider: "google",
        callbackURL: "/onboarding",
      });
      if (res && "data" in res && res.data && (res.data as { url?: string }).url) {
        window.location.href = (res.data as { url: string }).url;
      }
    } catch (err: unknown) {
      console.error("Google sign-up error:", err);
      setError("Google OAuth initialization failed. Please try email/password registration.");
    }
  };

  return (
    <div className="w-full max-w-md bg-[#FAF6EE] border border-line rounded-[6px] p-6 sm:p-8 shadow-none">
      {/* Header */}
      <div className="mb-6 text-center">
        <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft block mb-1">
          Account Registration
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink">
          Join the Abundance Ledger
        </h1>
        <p className="text-xs text-ink-soft mt-1">
          Connect institutional surplus with verified redistribution.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-[6px] bg-[#8A4331]/10 border border-[#8A4331]/30 text-[#8A4331] text-xs space-y-2">
          <div className="font-medium leading-relaxed">{error}</div>
          {error.includes("already exists") && (
            <div className="pt-1">
              <Link
                href={`/login?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#8A4331] text-white hover:bg-[#6D3426] transition-colors font-semibold text-xs"
              >
                Sign in with this email &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1"
          >
            Full Name / Contact Person
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-basil"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1"
          >
            Work Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="priya@institution.edu"
            className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-basil"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-basil"
          />
        </div>

        {/* Role Selector */}
        <div>
          <label
            htmlFor="role"
            className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1"
          >
            Account Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-ledger-paper border border-line rounded-[6px] text-ink focus:outline-none focus:ring-2 focus:ring-basil cursor-pointer"
          >
            <option value="institution_admin">
              Institution Admin (Kitchen / Processing Unit)
            </option>
            <option value="ngo">
              NGO / Recipient Organization
            </option>
            <option value="delivery_partner">
              Delivery Partner (Volunteer / Driver)
            </option>
            <option value="platform_admin">
              Platform Admin (System Operations)
            </option>
          </select>
          <span className="text-[11px] text-ink-soft mt-1 block">
            Next step will verify organization and profile details for this role.
          </span>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="default"
          className="w-full mt-2"
        >
          {loading ? "Creating account..." : "Complete Registration"}
        </Button>
      </form>

      {/* Social Auth Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#FAF6EE] px-2 text-ink-soft font-mono-numeral uppercase tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Google Workspace
      </Button>

      {/* Footer Link */}
      <div className="mt-6 text-center text-xs text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="text-basil font-semibold hover:underline">
          Log in to your ledger
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <React.Suspense
          fallback={
            <div className="w-full max-w-md bg-[#FAF6EE] border border-line rounded-[6px] p-8 text-center text-xs font-mono-numeral text-ink-soft">
              Loading registration form...
            </div>
          }
        >
          <RegisterForm />
        </React.Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
