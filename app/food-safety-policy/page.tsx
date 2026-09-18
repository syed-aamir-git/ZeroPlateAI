import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";

export const metadata = {
  title: "Food Safety Policy | ZeroPlate.ai",
  description:
    "FSSAI-aligned food safety protocols, temperature windows, and fail-closed gating rules at ZeroPlate.ai.",
};

export default function FoodSafetyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3EEE2] text-[#24211C]">
      <PublicNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        <div className="border-b border-[#DCD3BE] pb-6 space-y-2">
          <span className="font-mono text-xs text-[#5A5548] uppercase tracking-wider">
            FSSAI Standards · Schedule 4 & Section 20 Compliance
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#24211C]">
            Food Safety & Quality Policy
          </h1>
          <p className="text-sm text-[#5A5548]">
            ZeroPlate.ai enforces automated server-side safety gating. Food safety is never treated as a soft suggestion — unsafe food is blocked before listing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-[6px] bg-white border border-[#DCD3BE] space-y-2">
            <div className="font-mono text-xs font-bold text-[#2F4B3A] uppercase">
              Rule 01: Cooked Food
            </div>
            <div className="text-lg font-bold font-display text-[#24211C]">
              4-Hour Hard Cap
            </div>
            <p className="text-xs text-[#5A5548] leading-relaxed">
              Cooked food must be distributed within 4 hours of preparation. Any listing exceeding 4 hours is permanently blocked from dispatch.
            </p>
          </div>

          <div className="p-4 rounded-[6px] bg-white border border-[#DCD3BE] space-y-2">
            <div className="font-mono text-xs font-bold text-[#2F4B3A] uppercase">
              Rule 02: Dairy Buffer
            </div>
            <div className="text-lg font-bold font-display text-[#24211C]">
              2-Hour Expiry Margin
            </div>
            <p className="text-xs text-[#5A5548] leading-relaxed">
              Perishable dairy and cold items require a minimum 2-hour buffer remaining before expiration at dispatch close.
            </p>
          </div>

          <div className="p-4 rounded-[6px] bg-white border border-[#DCD3BE] space-y-2">
            <div className="font-mono text-xs font-bold text-[#2F4B3A] uppercase">
              Rule 03: Fail-Closed
            </div>
            <div className="text-lg font-bold font-display text-[#24211C]">
              Zero-Tolerance Guard
            </div>
            <p className="text-xs text-[#5A5548] leading-relaxed">
              Any network glitch, calculation exception, or missing parameter immediately rejects the listing — safety gating fails closed by default.
            </p>
          </div>
        </div>

        <section className="space-y-4 text-sm text-[#3E3A32] leading-relaxed">
          <h2 className="font-display text-xl font-semibold text-[#24211C]">
            Chain of Custody Verification
          </h2>
          <p>
            From the moment a commercial kitchen creates a surplus ticket to the final recipient confirmation, every step is logged:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#5A5548]">
            <li><strong>Preparation Timestamp:</strong> Verified against kitchen production batch records.</li>
            <li><strong>Dispatch Window Check:</strong> Logistics algorithms only match delivery partners within the safe temperature preservation window.</li>
            <li><strong>Digital Stamp Confirmation:</strong> Recipient NGOs inspect sealed containers upon arrival and confirm hygiene before meals are distributed.</li>
          </ul>
        </section>

        <div className="pt-6 border-t border-[#DCD3BE] flex items-center justify-between text-xs text-[#5A5548]">
          <span>ZeroPlate.ai Food Safety Board</span>
          <Link href="/help" className="text-[#2F4B3A] font-semibold hover:underline">
            Visit Help Center →
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
