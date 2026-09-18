import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";

export const metadata = {
  title: "Terms of Service | ZeroPlate.ai",
  description:
    "Institutional terms of service, Good Samaritan liability protections, and B2B food redistribution guidelines.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3EEE2] text-[#24211C]">
      <PublicNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        <div className="border-b border-[#DCD3BE] pb-6 space-y-2">
          <span className="font-mono text-xs text-[#5A5548] uppercase tracking-wider">
            Institutional Agreement · Version 1.2
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#24211C]">
            Terms of Service
          </h1>
          <p className="text-sm text-[#5A5548]">
            Last updated: January 2026. Applicable to all institutional kitchens, verified NGOs, and delivery partners.
          </p>
        </div>

        <section className="space-y-4 text-sm text-[#3E3A32] leading-relaxed">
          <h2 className="font-display text-xl font-semibold text-[#24211C]">
            1. Platform Operation & Scope
          </h2>
          <p>
            ZeroPlate.ai operates a B2B surplus redistribution infrastructure connecting institutional commercial kitchens, processing units, cafeterias, and certified non-governmental organizations (NGOs). ZeroPlate.ai facilitates demand prediction, automated food safety verification, route matching, and ESG ledger accounting.
          </p>

          <h2 className="font-display text-xl font-semibold text-[#24211C] pt-4">
            2. Good Samaritan Protection & Legal Immunity
          </h2>
          <p>
            Redistribution facilitated through ZeroPlate.ai adheres to national Good Samaritan statutory protections for bona fide food donation. Donors listing unadulterated food in good faith that satisfies ZeroPlate.ai server-side safety gating are shielded from civil liability for subsequent third-party consumption, subject to applicable municipal laws.
          </p>

          <h2 className="font-display text-xl font-semibold text-[#24211C] pt-4">
            3. Safety Compliance & Fail-Closed Gating
          </h2>
          <p>
            All listed surplus must comply strictly with FSSAI regulations and ZeroPlate.ai temperature, shelf-life, and dispatch window thresholds. Any surplus failing the automated 4-hour cooked food window or dairy safety buffer is automatically rejected server-side without exception.
          </p>

          <h2 className="font-display text-xl font-semibold text-[#24211C] pt-4">
            4. Partner KYC & Verification
          </h2>
          <p>
            NGO and delivery partner accounts must maintain verified status. Platform Administrators reserve the right to audit compliance, inspect transit logs, and revoke dispatch access upon any breach of food hygiene standards.
          </p>
        </section>

        <div className="pt-6 border-t border-[#DCD3BE] flex items-center justify-between text-xs text-[#5A5548]">
          <span>ZeroPlate.ai Legal Compliance Operations</span>
          <Link href="/food-safety-policy" className="text-[#2F4B3A] font-semibold hover:underline">
            Read Food Safety Policy →
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
