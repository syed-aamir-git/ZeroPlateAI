import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";

export const metadata = {
  title: "Privacy Policy | ZeroPlate.ai",
  description:
    "Institutional privacy policy and data governance practices at ZeroPlate.ai.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3EEE2] text-[#24211C]">
      <PublicNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        <div className="border-b border-[#DCD3BE] pb-6 space-y-2">
          <span className="font-mono text-xs text-[#5A5548] uppercase tracking-wider">
            Data Governance & Privacy · Version 1.2
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#24211C]">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#5A5548]">
            Last updated: January 2026. How ZeroPlate.ai safeguards institutional inventory, location telemetry, and partner KYC information.
          </p>
        </div>

        <section className="space-y-4 text-sm text-[#3E3A32] leading-relaxed">
          <h2 className="font-display text-xl font-semibold text-[#24211C]">
            1. Information We Collect
          </h2>
          <p>
            We process institutional entity profiles, commercial kitchen inventory logs, dispatch coordinates, NGO government registration documents (12A/80G, DARPAN), and delivery telematics necessary to execute safe logistics routing and Scope 3 greenhouse gas calculations.
          </p>

          <h2 className="font-display text-xl font-semibold text-[#24211C] pt-4">
            2. Confidentiality of Commercial Demand Data
          </h2>
          <p>
            Institution inventory histories, preparation volumes, and AI demand predictions are strictly private to each institution. We never sell, pool, or expose an enterprise kitchen&apos;s commercial yield or proprietary vendor cost structures to competitors or third parties.
          </p>

          <h2 className="font-display text-xl font-semibold text-[#24211C] pt-4">
            3. Public Impact Accounting
          </h2>
          <p>
            Public ledger metrics (e.g. cumulative kilograms of waste diverted, meals redistributed, and CO2e avoided) represent aggregate totals or verified anonymized credits unless explicit public ESG publication consent is granted by the participating enterprise.
          </p>

          <h2 className="font-display text-xl font-semibold text-[#24211C] pt-4">
            4. Data Retention & FSSAI Audit Trail
          </h2>
          <p>
            All safety gating verdicts, sensor readings, and chain-of-custody transfer receipts are retained in tamper-evident audit collections for a minimum of 36 months to satisfy municipal food safety inspection mandates.
          </p>
        </section>

        <div className="pt-6 border-t border-[#DCD3BE] flex items-center justify-between text-xs text-[#5A5548]">
          <span>Data Protection Officer: privacy@zeroplate.ai</span>
          <Link href="/terms" className="text-[#2F4B3A] font-semibold hover:underline">
            Terms of Service →
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
