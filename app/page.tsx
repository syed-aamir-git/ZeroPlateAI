import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import { TicketStrip } from "@/components/public/ticket-strip";
import { ImpactCounter } from "@/components/public/impact-counter";
import { getPlatformStats } from "@/lib/platform-stats";
import {
  CrateIcon,
  TicketIcon,
  ForecastIcon,
  LedgerTabIcon,
  ShieldCheckIcon,
  RouteIcon,
  ChevronRightIcon,
} from "@/components/icons/ledger-icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getPlatformStats();

  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav />

      {/* Hero Section (Design PRD Section 5.1) */}
      <section className="border-b border-line pt-14 pb-10 sm:pt-20 sm:pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl text-left">
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-3">
              Institutional Food Waste Operating System
            </span>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal text-ink leading-[1.08] tracking-tight">
              Predict what&apos;s needed.
              <br />
              Redistribute what&apos;s left.
              <br />
              <span className="text-basil">Measure what it meant.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl font-sans">
              ZeroPlate connects institutional kitchens and food processing units with verified recipient networks. 
              Forecasting demand, gating food safety by rule, and creating an auditable ledger for every surplus kilogram.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild variant="default" size="lg">
                <Link href="/register">Get started</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          {/* Orchestrated Ticket Strip (Section 5.1 & 7) */}
          <div className="mt-12 sm:mt-16 pt-4 border-t border-line/60">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-mono-numeral uppercase tracking-wider text-ink-soft">
                Live Redistribution Strip
              </span>
              <span className="text-[11px] text-ink-soft">
                Automated safety checks & verified claims
              </span>
            </div>
            <TicketStrip />
          </div>
        </div>
      </section>

      {/* Live Public Impact Counter (Connected to real MongoDB data) */}
      <section className="border-b border-line bg-[#FAF6EE] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 border-b border-line pb-3">
            <div>
              <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft block">
                Public Impact Ledger
              </span>
              <h2 className="font-display text-xl sm:text-2xl text-ink font-normal mt-0.5">
                Real-Time Platform Aggregate
              </h2>
            </div>
            <span className="text-xs font-mono-numeral text-ink-soft mt-1 sm:mt-0">
              Direct database computation • FAO conversion standard
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line text-left">
            <div className="py-3 sm:py-0 sm:px-6 first:pl-0">
              <span className="text-xs text-ink-soft block uppercase tracking-wider font-mono-numeral">
                Meals Given
              </span>
              <div className="mt-1 text-3xl sm:text-4xl text-basil font-semibold">
                <ImpactCounter value={stats.mealsRedistributed} />
              </div>
              <span className="text-[11px] text-ink-soft mt-1 block">
                Delivered to verified NGOs
              </span>
            </div>

            <div className="py-3 sm:py-0 sm:px-6">
              <span className="text-xs text-ink-soft block uppercase tracking-wider font-mono-numeral">
                Waste Prevented
              </span>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-2xl sm:text-3xl font-semibold text-ink whitespace-nowrap font-mono-numeral">
                  <ImpactCounter value={stats.wastePreventedByUnit?.kg ?? stats.wastePreventedKg} />
                  <span className="text-xs font-mono text-ink-soft ml-1">kg</span>
                </span>
                <span className="text-ink-soft/40 text-xs select-none">•</span>
                <span className="text-2xl sm:text-3xl font-semibold text-ink whitespace-nowrap font-mono-numeral">
                  <ImpactCounter value={stats.wastePreventedByUnit?.pieces ?? 0} />
                  <span className="text-xs font-mono text-ink-soft ml-1">pieces</span>
                </span>
                <span className="text-ink-soft/40 text-xs select-none">•</span>
                <span className="text-2xl sm:text-3xl font-semibold text-ink whitespace-nowrap font-mono-numeral">
                  <ImpactCounter value={stats.wastePreventedByUnit?.litres ?? 0} />
                  <span className="text-xs font-mono text-ink-soft ml-1">litres</span>
                </span>
              </div>
              <span className="text-[11px] text-ink-soft mt-1 block">
                Diverted from waste streams
              </span>
            </div>

            <div className="py-3 sm:py-0 sm:px-6">
              <span className="text-xs text-ink-soft block uppercase tracking-wider font-mono-numeral">
                CO2e Avoided
              </span>
              <div className="mt-1 text-3xl sm:text-4xl text-ink font-semibold">
                <ImpactCounter value={stats.co2eAvoidedKg} suffix=" kg" decimals={1} />
              </div>
              <span className="text-[11px] text-ink-soft mt-1 block">
                1.8 kg CO2e / kg factor
              </span>
            </div>

            <div className="py-3 sm:py-0 sm:px-6 last:pr-0">
              <span className="text-xs text-ink-soft block uppercase tracking-wider font-mono-numeral">
                Active Facilities
              </span>
              <div className="mt-1 text-3xl sm:text-4xl text-[#B85C38] font-semibold">
                <ImpactCounter value={stats.institutionCount + stats.ngoCount} />
              </div>
              <span className="text-[11px] text-ink-soft mt-1 block">
                {stats.institutionCount} kitchens • {stats.ngoCount} NGOs
              </span>
            </div>
          </div>

          {!stats.hasActivity && (
            <div className="mt-6 p-4 rounded-[6px] border border-line bg-ledger-paper text-xs text-ink-soft">
              <strong className="text-ink font-semibold">Active Development Ledger:</strong> ZeroPlate operates with zero placeholder data. 
              As institutions add inventory and complete verified deliveries, this aggregate updates live.
            </div>
          )}
        </div>
      </section>

      {/* The Four-Stage Pipeline (Numbered Ledger-Tabs, Section 5.1) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-line">
        <div className="max-w-7xl mx-auto text-left">
          <div className="max-w-2xl mb-12">
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
              Sequential Core Architecture
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink">
              The Four-Stage Circular Pipeline
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Each stage produces a verified ledger entry, closing the loop from bulk inventory to ESG compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                name: "Predict",
                title: "Demand Forecasting",
                desc: "Time-series machine learning models analyze menu history, calendar cycles, and seasonal demand to eliminate kitchen overproduction before prep begins.",
                icon: ForecastIcon,
              },
              {
                step: "02",
                name: "Prevent",
                title: "Smart Shelf-Life Detection",
                desc: "Real-time inventory logging auto-flags batches nearing safety thresholds, surfacing opportunities for planned kitchen usage or early redistribution.",
                icon: CrateIcon,
              },
              {
                step: "03",
                name: "Redistribute",
                title: "Fail-Closed Safety Gating",
                desc: "Automated rules evaluate cooked time and category thresholds. Safe items match by proximity and capacity to KYC-verified recipient NGOs.",
                icon: ShieldCheckIcon,
              },
              {
                step: "04",
                name: "Measure",
                title: "Auditable Impact Ledger",
                desc: "Every completed delivery credits the facility with exact kilograms saved, meals provided, water conserved, and audit-ready ESG reporting data.",
                icon: LedgerTabIcon,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="border border-line bg-[#FAF6EE] p-6 rounded-[6px] relative flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
                      <span className="font-mono-numeral text-xs font-semibold px-2 py-0.5 rounded-full bg-basil/10 text-basil border border-basil/20">
                        STAGE {s.step}
                      </span>
                      <Icon size={20} className="text-ink-soft" />
                    </div>
                    <div className="font-mono-numeral text-xs text-ink-soft uppercase tracking-wider mb-1">
                      {s.name}
                    </div>
                    <h3 className="font-display text-lg font-medium text-ink mb-2">
                      {s.title}
                    </h3>
                    <p className="text-xs text-ink-soft leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Positioning Block (PRD Section 4 & Design PRD Section 12.1) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-line bg-[#FAF6EE]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-left">
          <div className="lg:col-span-6 space-y-4">
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block">
              Strategic Focus & Differentiation
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink leading-tight">
              Purpose-built for institutions, not individual consumers.
            </h2>
            <p className="text-sm text-ink leading-relaxed">
              Consumer food apps coordinate half-sandwiches and grocery bags for individuals. 
              ZeroPlate is designed for the operational scale of institutional cafeterias, hospital dietary units, college messes, and food processing plants.
            </p>
            <p className="text-xs text-ink-soft leading-relaxed">
              We provide the compliance safeguards that institutional legal teams require: server-side safety gating, verified-only NGO KYC, strict dispatch windows, and exportable ESG disclosures.
            </p>
          </div>

          <div className="lg:col-span-6 border border-line bg-ledger-paper p-6 sm:p-8 rounded-[6px]">
            <h3 className="font-display text-xl font-normal text-ink mb-4 pb-2 border-b border-line">
              Institutional Guarantees
            </h3>
            <ul className="space-y-3 text-xs text-ink-soft">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-basil mt-1.5 shrink-0" />
                <div>
                  <strong className="text-ink font-semibold">Dual-Layer Safety:</strong> Automated threshold rules block expired items by default; only KYC-vetted NGOs can claim listings.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-basil mt-1.5 shrink-0" />
                <div>
                  <strong className="text-ink font-semibold">Lightweight Dedicated Logistics:</strong> Swiggy-style assignment without gig overhead — coordinate volunteer and driver pickups through step-tracked dispatch.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-basil mt-1.5 shrink-0" />
                <div>
                  <strong className="text-ink font-semibold">Automated ESG Disclosures:</strong> Direct translation from kilograms diverted to Scope 3 carbon reduction metrics formatted for sustainability audits.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Role-Based Entry Points (Routing to /register with prefilled role) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-left">
          <div className="mb-10">
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
              Participate in the Circular Network
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink">
              Choose your role in the ecosystem.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-line bg-[#FAF6EE] p-6 rounded-[6px] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[6px] bg-basil/10 text-basil flex items-center justify-center mb-4">
                  <CrateIcon size={20} />
                </div>
                <h3 className="font-display text-xl font-medium text-ink mb-2">
                  I run a kitchen or processing unit
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed mb-6">
                  Log inventory, forecast meal counts with AI, list unavoidable surplus, and generate certified ESG reports.
                </p>
              </div>
              <Button asChild variant="default" className="w-full justify-between">
                <Link href="/register?role=institution_admin">
                  <span>Register institution</span>
                  <ChevronRightIcon size={16} />
                </Link>
              </Button>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-6 rounded-[6px] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[6px] bg-saffron/15 text-[#7E570A] flex items-center justify-center mb-4">
                  <TicketIcon size={20} />
                </div>
                <h3 className="font-display text-xl font-medium text-ink mb-2">
                  I operate an NGO or food bank
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed mb-6">
                  Complete one-time KYC verification, discover safe bulk surplus nearby, claim listings, and feed communities.
                </p>
              </div>
              <Button asChild variant="default" className="w-full justify-between">
                <Link href="/register?role=ngo">
                  <span>Register as recipient</span>
                  <ChevronRightIcon size={16} />
                </Link>
              </Button>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-6 rounded-[6px] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[6px] bg-clay-rust/15 text-clay-rust flex items-center justify-center mb-4">
                  <RouteIcon size={20} />
                </div>
                <h3 className="font-display text-xl font-medium text-ink mb-2">
                  I provide delivery or transport
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed mb-6">
                  Accept nearby pickup assignments, update progress on mobile, and facilitate safe food transfer.
                </p>
              </div>
              <Button asChild variant="default" className="w-full justify-between">
                <Link href="/register?role=delivery_partner">
                  <span>Join as partner</span>
                  <ChevronRightIcon size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
