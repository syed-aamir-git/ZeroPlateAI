import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import {
  ForecastIcon,
  LedgerTabIcon,
  ShieldCheckIcon,
  CrateIcon,
} from "@/components/icons/ledger-icons";

export default function ForInstitutionsPage() {
  const verticals = [
    {
      title: "Colleges & Universities",
      desc: "Accommodates exam schedules, holiday breaks, and mess meal drop-offs with academic-calendar-aware AI forecasting.",
      highlight: "Reduces campus plate waste by up to 28% within the first academic term.",
    },
    {
      title: "Hospitals & Healthcare",
      desc: "Strict adherence to dietary constraints, patient census shifts, and FSSAI sanitary requirements.",
      highlight: "Full batch audit trails for patient dietary accountability and safe redistribution.",
    },
    {
      title: "Corporate Cafeterias",
      desc: "Adapts to hybrid work patterns, day-of-week attendance drops, and seasonal catering swings.",
      highlight: "Automates Scope 3 ESG data exports for annual corporate sustainability audits.",
    },
    {
      title: "Hotels & Banquet Centers",
      desc: "Dynamic event-based forecasting and same-evening redistribution coordination for high-volume functions.",
      highlight: "Ensures large event surplus reaches community kitchens within safe temperature windows.",
    },
    {
      title: "Food Processing Units",
      desc: "Tracks batch production runs, packaging line overages, raw material yields, and product best-before dates.",
      highlight: "Diverts near-expiry inventory to verified non-profits before costly disposal fees occur.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav />

      {/* Hero */}
      <section className="border-b border-line pt-14 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-left">
          <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-2">
            For Kitchens & Processing Units
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal text-ink leading-tight tracking-tight">
            Stop guessing kitchen prep.
            <br />
            Start proving impact.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl font-sans">
            Institutional kitchens operate on narrow margins and strict hygiene requirements. ZeroPlate provides the 
            predictive intelligence to avoid cooking excess and the safety safeguards to redistribute unavoidable surplus with zero liability.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild variant="default" size="lg">
              <Link href="/register?role=institution_admin">
                Register your institution
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Primary Value Pillars */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-line">
        <div className="max-w-6xl mx-auto text-left">
          <div className="max-w-2xl mb-12">
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
              Core Capabilities
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink">
              Engineered for Institutional Scale
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-[6px] space-y-4">
              <div className="w-10 h-10 rounded-[6px] bg-saffron/15 text-[#7E570A] flex items-center justify-center">
                <ForecastIcon size={20} />
              </div>
              <h3 className="font-display text-2xl font-normal text-ink">
                AI Demand & Overproduction Forecasting
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Our FastAPI-powered time-series service predicts demand patterns based on historical meal logs, attendance, and day-of-week trends. 
                Before staff starts chopping vegetables, you see a reliable 1-to-7 day forecast with confidence intervals, curbing waste before it occurs.
              </p>
              <div className="pt-2 text-xs font-mono-numeral text-ink">
                ✓ Seasonality & calendar-aware • Cold-start fallback included
              </div>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-[6px] space-y-4">
              <div className="w-10 h-10 rounded-[6px] bg-plum/15 text-plum flex items-center justify-center">
                <LedgerTabIcon size={20} />
              </div>
              <h3 className="font-display text-2xl font-normal text-ink">
                Automated ESG Disclosures & Cost Accounting
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Transform food waste from a line-item loss into an auditable corporate asset. 
                ZeroPlate calculates landfill diversion metrics, avoided landfill tipping fees, and Scope 3 carbon reduction figures for ESG audits.
              </p>
              <div className="pt-2 text-xs font-mono-numeral text-ink">
                ✓ One-click CSV/PDF export • FSSAI & international standard aligned
              </div>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-[6px] space-y-4">
              <div className="w-10 h-10 rounded-[6px] bg-basil/15 text-basil flex items-center justify-center">
                <ShieldCheckIcon size={20} />
              </div>
              <h3 className="font-display text-2xl font-normal text-ink">
                Server-Side Safety Gating & Liability Protection
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Never worry about legal exposure from donating food. Our automated engine enforces category-specific time and temperature rules, 
                failing closed if any condition is unsafe. Listings are only accessible to KYC-verified recipient organizations.
              </p>
              <div className="pt-2 text-xs font-mono-numeral text-ink">
                ✓ Immutable MongoDB audit logs • Clear facilitator liability positioning
              </div>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-[6px] space-y-4">
              <div className="w-10 h-10 rounded-[6px] bg-clay-rust/15 text-clay-rust flex items-center justify-center">
                <CrateIcon size={20} />
              </div>
              <h3 className="font-display text-2xl font-normal text-ink">
                Dense Kitchen Ledger & Rapid Marking
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Designed for tablet passes and kitchen offices. Tabular figures, keyboard-friendly entry, and 1-tap &ldquo;Mark Surplus&rdquo; actions 
                make daily recording simple for staff without lengthy software training.
              </p>
              <div className="pt-2 text-xs font-mono-numeral text-ink">
                ✓ Shadowless flat ledger • IBM Plex Mono tabular numbers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verticals */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE]">
        <div className="max-w-6xl mx-auto text-left">
          <div className="max-w-2xl mb-12">
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
              Sector-Specific Modules
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink">
              Tailored for Every Kitchen Environment
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {verticals.map((v) => (
              <div
                key={v.title}
                className="border border-line bg-ledger-paper p-6 rounded-[6px] flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display text-xl font-medium text-ink mb-2">
                    {v.title}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed mb-4">
                    {v.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-line text-[11px] text-basil font-medium">
                  {v.highlight}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild variant="default" size="lg">
              <Link href="/register?role=institution_admin">
                Set up your facility account
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
