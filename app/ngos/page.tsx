import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import {
  ShieldCheckIcon,
  TicketIcon,
  RouteIcon,
  StampIcon,
} from "@/components/icons/ledger-icons";

export default function ForNgosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav />

      {/* Hero */}
      <section className="border-b border-line pt-14 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-left">
          <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-2">
            For Food Banks & Non-Profits
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal text-ink leading-tight tracking-tight">
            Reliable surplus food,
            <br />
            guaranteed safe before dispatch.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl font-sans">
            Community kitchens and non-profits should not have to gamble on food quality or spend hours calling kitchens. 
            ZeroPlate gives verified NGOs instant access to pre-gated, high-volume institutional surplus with coordinated delivery.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild variant="default" size="lg">
              <Link href="/register?role=ngo">
                Register as recipient organization
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/how-it-works">Understand the safety pipeline</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-line">
        <div className="max-w-6xl mx-auto text-left">
          <div className="max-w-2xl mb-12">
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
              Recipient Network Standards
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink">
              Built on Trust, Food Safety & Dignity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-[6px] space-y-4">
              <div className="w-10 h-10 rounded-[6px] bg-basil/15 text-basil flex items-center justify-center">
                <ShieldCheckIcon size={20} />
              </div>
              <h3 className="font-display text-2xl font-normal text-ink">
                Automated Food Safety Pre-Gating
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Every listing undergoes server-side validation against strict category shelf-life and preparation time windows before appearing in your feed. 
                Cooked batches older than 4 hours are automatically blocked by the system. You only see food verified safe for consumption.
              </p>
              <div className="pt-2 text-xs font-mono-numeral text-ink">
                ✓ FSSAI-aligned norms • Exact time-since-cooked displayed on ticket
              </div>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-[6px] space-y-4">
              <div className="w-10 h-10 rounded-[6px] bg-saffron/15 text-[#7E570A] flex items-center justify-center">
                <TicketIcon size={20} />
              </div>
              <h3 className="font-display text-2xl font-normal text-ink">
                Atomic Claim Locking — Zero Phantom Donations
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Nothing is worse than sending a vehicle to pick up food, only to find another organization already took it. 
                ZeroPlate utilizes atomic database locks: the moment your organization taps &ldquo;Claim listing&rdquo;, the inventory is locked exclusively to you.
              </p>
              <div className="pt-2 text-xs font-mono-numeral text-ink">
                ✓ Race-condition prevention • Guaranteed pickup reservations
              </div>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-[6px] space-y-4">
              <div className="w-10 h-10 rounded-[6px] bg-plum/15 text-plum flex items-center justify-center">
                <StampIcon size={20} />
              </div>
              <h3 className="font-display text-2xl font-normal text-ink">
                Verified Recipient KYC & Reliability Scoring
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                We protect our recipient community by vetting every non-profit. Upon approval, your organization builds a public reliability score based on 
                completed pickups. Reliable organizations receive priority matching for large surplus opportunities in their area.
              </p>
              <div className="pt-2 text-xs font-mono-numeral text-ink">
                ✓ Transparent 100-point score • Priority matching for top performers
              </div>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-[6px] space-y-4">
              <div className="w-10 h-10 rounded-[6px] bg-clay-rust/15 text-clay-rust flex items-center justify-center">
                <RouteIcon size={20} />
              </div>
              <h3 className="font-display text-2xl font-normal text-ink">
                Coordinated Volunteer & Driver Pickup
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Whether you have your own transport van or rely on platform delivery partners, our lightweight dispatch system tracks every leg 
                of the transfer. You receive alerts when the food leaves the institution and inspect the containers before final digital sign-off.
              </p>
              <div className="pt-2 text-xs font-mono-numeral text-ink">
                ✓ Real-time status stepper • Digital confirmation on delivery
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KYC Steps */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-left">
          <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
            Simple Verification Process
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink mb-4">
            How to Join as a Recipient Partner
          </h2>
          <p className="text-sm text-ink-soft mb-10">
            Three simple steps to connect your community kitchen to institutional surplus.
          </p>

          <div className="space-y-4">
            <div className="border border-line bg-ledger-paper p-5 rounded-[6px] flex items-start gap-4">
              <span className="font-mono-numeral text-sm font-semibold px-2 py-0.5 rounded-full bg-basil/10 text-basil border border-basil/20 shrink-0">
                1
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Register Your Organization</h3>
                <p className="text-xs text-ink-soft mt-1">
                  Provide your NGO registration number, contact person, designated service area, and weekly food receiving capacity in kilograms.
                </p>
              </div>
            </div>

            <div className="border border-line bg-ledger-paper p-5 rounded-[6px] flex items-start gap-4">
              <span className="font-mono-numeral text-sm font-semibold px-2 py-0.5 rounded-full bg-saffron/20 text-[#7E570A] border border-saffron/30 shrink-0">
                2
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Administrative Review</h3>
                <p className="text-xs text-ink-soft mt-1">
                  A platform administrator verifies your registration against public non-profit databases to ensure food safety traceability.
                </p>
              </div>
            </div>

            <div className="border border-line bg-ledger-paper p-5 rounded-[6px] flex items-start gap-4">
              <span className="font-mono-numeral text-sm font-semibold px-2 py-0.5 rounded-full bg-basil/10 text-basil border border-basil/20 shrink-0">
                3
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Begin Claiming Nearby Listings</h3>
                <p className="text-xs text-ink-soft mt-1">
                  Once approved, browse ticket cards for verified surplus within your dispatch radius and coordinate immediate pickups.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Button asChild variant="default" size="lg">
              <Link href="/register?role=ngo">
                Start NGO registration
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
