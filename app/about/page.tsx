import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import {
  ShieldCheckIcon,
  StampIcon,
  CrateIcon,
  LedgerTabIcon,
} from "@/components/icons/ledger-icons";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav />

      {/* Hero */}
      <section className="border-b border-line pt-14 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-left">
          <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-2">
            Mission & Architecture
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal text-ink leading-tight tracking-tight">
            Building the operating system
            <br />
            for institutional surplus.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl font-sans">
            Nearly one-third of all food produced globally is wasted, yet institutional kitchens continue to manage 
            inventory, production, and surplus reactively. ZeroPlate bridges predictive AI with safe community redistribution.
          </p>
        </div>
      </section>

      {/* The Core Narrative */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-line">
        <div className="max-w-4xl mx-auto space-y-12 text-left">
          <div>
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
              The Problem We Solve
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink mb-4">
              Reactive Waste Disposal vs. Proactive Food Management
            </h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              Institutional kitchens (colleges, hospitals, hotels, corporate cafeterias) and food processing units 
              face massive operational swings. A sudden rainstorm, exam week, or shift alteration produces unexpected 
              overages. Without predictive intelligence, food is discarded because kitchens lack the channels and liability safeguards 
              to transfer bulk cooked meals safely.
            </p>
          </div>

          <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-[6px] space-y-6">
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
              Our Safety Philosophy
            </span>
            <h3 className="font-display text-2xl font-normal text-ink">
              The Dual-Layer Food Safety Approach
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              Food safety cannot be an afterthought in redistribution. ZeroPlate protects both the donor institution 
              and the vulnerable recipient through a rigorous two-tier gating architecture:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="border border-line bg-ledger-paper p-5 rounded-[6px] space-y-2">
                <div className="w-8 h-8 rounded-[4px] bg-basil/15 text-basil flex items-center justify-center">
                  <ShieldCheckIcon size={18} />
                </div>
                <h4 className="font-display text-base font-semibold text-ink">
                  1. Server-Side Automated Gating
                </h4>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Strict category rules enforce maximum hours since preparation (e.g. 4 hours for cooked items), safe storage condition tags, 
                  and dispatch windows. Unsafe items fail closed and cannot be published.
                </p>
              </div>

              <div className="border border-line bg-ledger-paper p-5 rounded-[6px] space-y-2">
                <div className="w-8 h-8 rounded-[4px] bg-saffron/15 text-[#7E570A] flex items-center justify-center">
                  <StampIcon size={18} />
                </div>
                <h4 className="font-display text-base font-semibold text-ink">
                  2. Verified-Recipient-Only Network
                </h4>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Surplus food is never made public to individuals. Only non-profits and food banks that pass rigorous administrative KYC reviews 
                  are authorized to claim and distribute bulk meals.
                </p>
              </div>
            </div>
          </div>

          <div>
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
              Regulatory Framework
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink mb-4">
              India-First, FSSAI-Aligned Architecture
            </h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              ZeroPlate is architected from day one around the Food Safety and Standards Authority of India (FSSAI) norms 
              for food donation and redistribution. Every stage maintains immutable audit logs in MongoDB, establishing 
              complete traceability while clearly positioning the platform as an intelligent facilitator of safe transfers.
            </p>
          </div>
        </div>
      </section>

      {/* Values & Principles */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE] border-b border-line">
        <div className="max-w-4xl mx-auto text-left">
          <div className="mb-10">
            <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-1">
              Operating Principles
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink">
              The Abundance Ledger Mindset
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border border-line bg-ledger-paper p-5 rounded-[6px] space-y-2">
              <span className="font-mono-numeral text-xs text-basil font-semibold uppercase tracking-wider block">
                01. No Mock Data
              </span>
              <h3 className="font-display text-lg font-medium text-ink">Truth in Ledger</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                We believe in genuine operational transparency. Numbers in ZeroPlate represent real meals, real audits, and real kilograms.
              </p>
            </div>

            <div className="border border-line bg-ledger-paper p-5 rounded-[6px] space-y-2">
              <span className="font-mono-numeral text-xs text-saffron font-semibold uppercase tracking-wider block">
                02. Fail-Closed
              </span>
              <h3 className="font-display text-lg font-medium text-ink">Safety Above Volume</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                If a safety rule fails to evaluate or an expiry window is breached, we block the listing immediately. No compromises on food safety.
              </p>
            </div>

            <div className="border border-line bg-ledger-paper p-5 rounded-[6px] space-y-2">
              <span className="font-mono-numeral text-xs text-plum font-semibold uppercase tracking-wider block">
                03. Measurable ESG
              </span>
              <h3 className="font-display text-lg font-medium text-ink">Value in Circularity</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                Circularity must be economically viable. We turn waste reduction into measurable cost savings and verified ESG credits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="font-display text-3xl font-normal text-ink">
            Join the circular food network.
          </h2>
          <p className="text-sm text-ink-soft">
            Whether you manage an institutional mess, a food plant, or a community food bank, ZeroPlate is ready.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Button asChild variant="default" size="lg">
              <Link href="/register">Get started today</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/help">Read safety policies</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
