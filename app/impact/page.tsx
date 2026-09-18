import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import { ImpactCounter } from "@/components/public/impact-counter";
import { getPlatformStats } from "@/lib/platform-stats";

export const dynamic = "force-dynamic";

export default async function PublicImpactPage() {
  const stats = await getPlatformStats();

  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav />

      {/* Header */}
      <section className="border-b border-line pt-14 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-left">
          <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-2">
            Public Transparency Ledger
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal text-ink leading-tight tracking-tight">
            The Public Impact Ledger
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl font-sans">
            Every kilogram accounted for. Every meal documented. This ledger presents the cumulative, live-computed 
            impact of participating institutions and verified NGOs across the ZeroPlate network.
          </p>
        </div>
      </section>

      {/* Primary KPI Strip */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-line">
        <div className="max-w-5xl mx-auto">
          <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-hidden">
            <div className="p-4 sm:p-6 bg-[#EAE3D4] border-b border-line flex flex-col sm:flex-row sm:items-center justify-between text-left gap-2">
              <span className="font-display text-lg font-medium text-ink">
                Cumulative Ecological & Community Totals
              </span>
              <span className="font-mono-numeral text-xs text-ink-soft">
                Live MongoDB aggregation • Audited standard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line text-left">
              <div className="p-6">
                <span className="text-xs text-ink-soft block uppercase tracking-wider font-mono-numeral">
                  Meals Served
                </span>
                <div className="mt-2 text-4xl sm:text-5xl font-semibold text-basil">
                  <ImpactCounter value={stats.mealsRedistributed} />
                </div>
                <p className="text-xs text-ink-soft mt-2 leading-relaxed">
                  Calculated from confirmed recipient non-profit receipts (standard 2.5 meals per kg).
                </p>
              </div>

              <div className="p-6">
                <span className="text-xs text-ink-soft block uppercase tracking-wider font-mono-numeral">
                  Food Waste Prevented
                </span>
                <div className="mt-2 text-4xl sm:text-5xl font-semibold text-ink">
                  <ImpactCounter value={stats.wastePreventedKg} suffix=" kg" />
                </div>
                <p className="text-xs text-ink-soft mt-2 leading-relaxed">
                  Bulk institutional inventory safely redistributed instead of diverted to municipal landfills.
                </p>
              </div>

              <div className="p-6">
                <span className="text-xs text-ink-soft block uppercase tracking-wider font-mono-numeral">
                  CO2e Avoided
                </span>
                <div className="mt-2 text-4xl sm:text-5xl font-semibold text-ink">
                  <ImpactCounter value={stats.co2eAvoidedKg} suffix=" kg" decimals={1} />
                </div>
                <p className="text-xs text-ink-soft mt-2 leading-relaxed">
                  Methane decomposition avoided via circular redirection (FAO benchmark factor 1.8 kg CO2e / kg food).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Network Scale & Empty / Live State */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-line bg-[#FAF6EE]">
        <div className="max-w-5xl mx-auto text-left">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink mb-6">
            Participating Network Scale
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="border border-line bg-ledger-paper p-5 rounded-[6px]">
              <span className="text-xs text-ink-soft uppercase tracking-wider font-mono-numeral block">
                Institutions
              </span>
              <span className="font-ledger-mono text-3xl font-semibold text-ink block mt-1">
                {stats.institutionCount}
              </span>
              <span className="text-[11px] text-ink-soft block mt-1">
                Kitchens & processing plants
              </span>
            </div>

            <div className="border border-line bg-ledger-paper p-5 rounded-[6px]">
              <span className="text-xs text-ink-soft uppercase tracking-wider font-mono-numeral block">
                NGO Partners
              </span>
              <span className="font-ledger-mono text-3xl font-semibold text-ink block mt-1">
                {stats.ngoCount}
              </span>
              <span className="text-[11px] text-ink-soft block mt-1">
                Registered non-profits
              </span>
            </div>

            <div className="border border-line bg-ledger-paper p-5 rounded-[6px]">
              <span className="text-xs text-ink-soft uppercase tracking-wider font-mono-numeral block">
                Logistics Partners
              </span>
              <span className="font-ledger-mono text-3xl font-semibold text-ink block mt-1">
                {stats.deliveryPartnerCount}
              </span>
              <span className="text-[11px] text-ink-soft block mt-1">
                Drivers & volunteers
              </span>
            </div>

            <div className="border border-line bg-ledger-paper p-5 rounded-[6px]">
              <span className="text-xs text-ink-soft uppercase tracking-wider font-mono-numeral block">
                Dispatches
              </span>
              <span className="font-ledger-mono text-3xl font-semibold text-ink block mt-1">
                {stats.deliveredListingsCount}
              </span>
              <span className="text-[11px] text-ink-soft block mt-1">
                Completed transfers
              </span>
            </div>
          </div>

          {/* Honest Zero State per User Requirement & Design PRD */}
          {!stats.hasActivity ? (
            <div className="mt-8 border border-line bg-ledger-paper p-6 rounded-[6px] space-y-2">
              <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft block">
                Zero-Placeholder Integrity Policy
              </span>
              <h3 className="font-display text-lg font-medium text-ink">
                Honest Ledger Status: Accumulating Initial Redistribution Data
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                ZeroPlate refuses to display fabricated sample statistics. The current ledger reflects exact registered facilities. 
                As newly onboarded kitchens mark surplus and recipient NGOs confirm deliveries through the portal, 
                every verified kilogram will appear here automatically in real time.
              </p>
            </div>
          ) : (
            <div className="mt-8 border border-line bg-ledger-paper p-6 rounded-[6px]">
              <span className="text-xs font-mono-numeral text-basil font-semibold block mb-1">
                ● Live Ledger Active
              </span>
              <p className="text-xs text-ink-soft">
                All impact metrics above are generated directly from completed delivery records and recipient digital sign-offs.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="font-display text-3xl font-normal text-ink">
            Add your facility to this ledger.
          </h2>
          <p className="text-sm text-ink-soft">
            Begin tracking waste prevention and generating certified sustainability credits.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Button asChild variant="default" size="lg">
              <Link href="/register">Join the network</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
