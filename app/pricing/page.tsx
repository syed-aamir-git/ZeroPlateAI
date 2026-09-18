import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const comparisonItems = [
    {
      feature: "Daily Kitchen Inventory Logging",
      free: "Included (Unlimited items)",
      premium: "Included (Unlimited items)",
      note: "Batch timestamps, category tracking, and shelf-life estimates.",
    },
    {
      feature: "Automated Food Safety Gating",
      free: "Included (Fail-closed engine)",
      premium: "Included (Fail-closed engine)",
      note: "Blocks listings past safe temperature and preparation hours.",
    },
    {
      feature: "Redistribution Matching to Verified NGOs",
      free: "Standard Proximity Matching",
      premium: "Priority Routing & Multi-Facility Allocation",
      note: "Matches bulk surplus to verified recipients in your city.",
    },
    {
      feature: "Logistics Coordination",
      free: "Step-Tracker Dispatch",
      premium: "Priority Dispatch Coordination",
      note: "Coordinate volunteer drivers and recipient pickup windows.",
    },
    {
      feature: "Demand Forecasting Model",
      free: "Basic Moving-Average Forecast",
      premium: "Advanced AI Time-Series (FastAPI Microservice)",
      note: "Seasonality, academic calendar, and weather-driven prep predictions.",
    },
    {
      feature: "Sustainability & Impact Dashboard",
      free: "Basic Operational Overview",
      premium: "Full Real-Time Sustainability Suite",
      note: "Track kg diverted, meals provided, and cost savings.",
    },
    {
      feature: "Certified ESG Report Export (PDF & CSV)",
      free: "Preview Only (Upsell Gated)",
      premium: "Unlimited One-Click Certified Exports",
      note: "Scope 3 emissions accounting formatted for corporate and CSR audits.",
    },
    {
      feature: "Multi-Facility Enterprise Administration",
      free: "Single Kitchen / Unit",
      premium: "Consolidated Multi-Campus & Plant View",
      note: "Aggregate reporting across university branches or plant locations.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav />

      {/* Hero */}
      <section className="border-b border-line pt-14 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-left">
          <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-2">
            Ledger-Style Plan Comparison
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal text-ink leading-tight tracking-tight">
            Transparent plans,
            <br />
            balanced for institutional scale.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl font-sans">
            Every institutional kitchen starts on our free Standard tier to establish baseline inventory and safe redistribution. 
            Upgrade to Premium when your sustainability team requires certified ESG audit disclosures and advanced time-series AI forecasting.
          </p>
        </div>
      </section>

      {/* Two-Column Ledger Comparison Table (Design PRD Section 12.1) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-hidden shadow-none">
            {/* Header Strip */}
            <div className="grid grid-cols-12 bg-[#EAE3D4] border-b border-line p-4 sm:p-6 text-left items-end">
              <div className="col-span-12 sm:col-span-6 mb-4 sm:mb-0">
                <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft block">
                  Capability & Specification
                </span>
                <span className="font-display text-xl font-medium text-ink">
                  Platform Ledger Features
                </span>
              </div>
              <div className="col-span-6 sm:col-span-3 pr-2">
                <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft block">
                  Free Tier
                </span>
                <span className="font-display text-2xl font-semibold text-ink block">
                  Standard
                </span>
                <span className="font-mono-numeral text-xs text-ink-soft">
                  ₹0 / month forever
                </span>
              </div>
              <div className="col-span-6 sm:col-span-3 pl-2 border-l border-line/60">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-semibold text-plum">
                    Premium
                  </span>
                  <span className="text-[10px] uppercase font-mono-numeral px-2 py-0.5 rounded-full bg-plum/15 text-plum font-semibold">
                    ESG Suite
                  </span>
                </div>
                <span className="font-mono-numeral text-xs text-ink-soft block mt-0.5">
                  Institutional Licensing
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="divide-y divide-line text-left">
              {comparisonItems.map((item, index) => (
                <div
                  key={item.feature}
                  className={`grid grid-cols-12 p-4 sm:p-5 items-baseline transition-colors ${
                    index % 2 === 0 ? "bg-[#FAF6EE]" : "bg-ledger-paper/60"
                  }`}
                >
                  <div className="col-span-12 sm:col-span-6 mb-2 sm:mb-0 pr-4">
                    <span className="font-medium text-sm text-ink block">
                      {item.feature}
                    </span>
                    <span className="text-xs text-ink-soft block mt-0.5 leading-relaxed">
                      {item.note}
                    </span>
                  </div>
                  <div className="col-span-6 sm:col-span-3 pr-2 font-mono-numeral text-xs text-ink">
                    {item.free}
                  </div>
                  <div className="col-span-6 sm:col-span-3 pl-2 sm:border-l sm:border-line/60 font-mono-numeral text-xs font-semibold text-plum">
                    {item.premium}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Action Bar */}
            <div className="grid grid-cols-12 bg-[#EAE3D4] border-t border-line p-6 items-center text-left">
              <div className="col-span-12 sm:col-span-6 mb-4 sm:mb-0 text-xs text-ink-soft">
                All accounts include zero-cost onboarding, live platform metrics, and full FSSAI compliance verification.
              </div>
              <div className="col-span-6 sm:col-span-3 pr-2">
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/register?role=institution_admin">
                    Start Free Standard
                  </Link>
                </Button>
              </div>
              <div className="col-span-6 sm:col-span-3 pl-2">
                <Button asChild variant="plum" className="w-full">
                  <Link href="/register?role=institution_admin">
                    Get Premium License
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-ink-soft max-w-xl mx-auto">
            NGOs and recipient community organizations participate at zero platform cost. 
            All recipient features including KYC verification and surplus claims remain completely free of charge.
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
