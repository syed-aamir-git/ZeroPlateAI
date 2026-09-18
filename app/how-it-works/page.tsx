import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import {
  ForecastIcon,
  CrateIcon,
  TicketIcon,
  ShieldCheckIcon,
  RouteIcon,
  StampIcon,
  LedgerTabIcon,
} from "@/components/icons/ledger-icons";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      title: "Planning & Production Forecasting",
      actor: "Institution Kitchen",
      desc: "Kitchen supervisors log anticipated meal counts, menus, or processing batch plans. The Python forecasting microservice evaluates historical demand patterns, academic or operational calendars, and day-of-week seasonality to predict exact demand, highlighting overproduction risks before cooking begins.",
      icon: ForecastIcon,
      detail: "Cold-start fallback uses moving-average estimates until thirty days of institutional data accumulate.",
    },
    {
      num: "02",
      title: "Preparation & Inventory Logging",
      actor: "Kitchen & Storage Units",
      desc: "Raw materials and prepared food items are logged into the ledger with preparation timestamp, category, storage location, and shelf-life estimate. This creates a clean operational trail across college messes, hospitals, and packaged food units.",
      icon: CrateIcon,
      detail: "Dense table views with IBM Plex Mono numerals support quick kitchen pass inputs on tablet or desktop.",
    },
    {
      num: "03",
      title: "Surplus & Expiry Detection",
      actor: "Automated Rules Engine",
      desc: "As meal service concludes, supervisors flag excess batches manually, or the system auto-flags items nearing category-specific expiry thresholds (such as 4 hours for cooked items, or 48 hours for dairy products).",
      icon: TicketIcon,
      detail: "Auto-flagging thresholds are configurable per food category by platform safety administrators.",
    },
    {
      num: "04",
      title: "Server-Side Safety Gating (Fail-Closed)",
      actor: "ZeroPlate Safety Core",
      desc: "Before any surplus listing can be published, automated safety rules validate elapsed time since preparation, category shelf-life limits, and mandatory dispatch window details. Items that breach safety windows are automatically blocked from listing.",
      icon: ShieldCheckIcon,
      detail: "Every gating decision is logged to an immutable audit collection for complete regulatory and liability traceability.",
    },
    {
      num: "05",
      title: "Redistribution Matching Engine",
      actor: "Matching Algorithm",
      desc: "When a verified safe listing goes live, the matching engine scores KYC-approved recipient NGOs using a multi-factor weighting function: geospatial proximity (2dsphere queries), weekly receiving capacity fit, and historical pickup reliability score.",
      icon: TicketIcon,
      detail: "Atomic MongoDB findOneAndUpdate locks prevent race conditions and duplicate claims across recipient organizations.",
    },
    {
      num: "06",
      title: "Lightweight Dedicated Logistics",
      actor: "Delivery Partner Network",
      desc: "The nearest available volunteer or dedicated logistics partner is assigned the dispatch. Using a mobile-first dark interface, the partner advances the assignment step-by-step: Assigned → Accepted → Picked Up → Delivered.",
      icon: RouteIcon,
      detail: "Status transitions animate as physical stamp marks without the operational overhead of third-party gig marketplaces.",
    },
    {
      num: "07",
      title: "Recipient Confirmation & Impact Credit",
      actor: "Verified NGO",
      desc: "Upon delivery drop-off, the recipient organization inspects the food containers and explicitly confirms receipt in their portal. This closes the verification loop and triggers the immediate computation of impact credits.",
      icon: StampIcon,
      detail: "Deliveries must be confirmed by the recipient before kilograms and carbon metrics are credited to the institution.",
    },
    {
      num: "08",
      title: "ESG Accounting & Compliance Reports",
      actor: "Sustainability Officer",
      desc: "All confirmed redistributions feed into institutional dashboards. Kilograms diverted are converted into meals served, landfill cost savings, and Scope 3 CO2e avoided using FAO conversion benchmarks, ready for one-click CSV and PDF export.",
      icon: LedgerTabIcon,
      detail: "Certified sustainability reports assist institutional leadership with mandatory environmental disclosures and CSR reviews.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav />

      {/* Header */}
      <section className="border-b border-line pt-14 pb-12 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-left">
          <span className="font-mono-numeral text-xs uppercase tracking-widest text-ink-soft block mb-2">
            The Circular Pipeline
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-normal text-ink leading-tight">
            How ZeroPlate Works
          </h1>
          <p className="mt-4 text-base text-ink-soft leading-relaxed max-w-2xl font-sans">
            A step-by-step walk through the eight stages of institutional food waste management — from 
            predictive kitchen prep to verified delivery confirmation and ESG reporting.
          </p>
        </div>
      </section>

      {/* Sequence Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8 text-left">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="border border-line bg-[#FAF6EE] rounded-[6px] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 relative"
              >
                {/* Numbered Ledger-Tab Marker */}
                <div className="shrink-0 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 sm:w-24">
                  <span className="font-mono-numeral text-sm font-semibold px-2.5 py-1 rounded-full bg-basil/10 text-basil border border-basil/20">
                    STAGE {s.num}
                  </span>
                  <div className="w-10 h-10 rounded-[6px] border border-line bg-ledger-paper flex items-center justify-center text-ink">
                    <Icon size={20} />
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-line pb-2">
                    <h2 className="font-display text-xl sm:text-2xl font-medium text-ink">
                      {s.title}
                    </h2>
                    <span className="font-mono-numeral text-xs text-ink-soft">
                      {s.actor}
                    </span>
                  </div>

                  <p className="text-sm text-ink-soft leading-relaxed">
                    {s.desc}
                  </p>

                  <div className="p-3 bg-ledger-paper border border-line rounded-[6px] text-xs text-ink">
                    <strong className="text-ink font-semibold">Technical Architecture: </strong>
                    <span className="text-ink-soft">{s.detail}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bottom Call to Action */}
          <div className="border border-line bg-[#FAF6EE] p-8 rounded-[6px] text-center space-y-4 mt-12">
            <h3 className="font-display text-2xl font-normal text-ink">
              Ready to implement this pipeline in your kitchen?
            </h3>
            <p className="text-sm text-ink-soft max-w-xl mx-auto">
              Set up your institution or NGO in minutes. No credit card or long deployment cycle required.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Button asChild variant="default">
                <Link href="/register?role=institution_admin">
                  Register institution
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/register?role=ngo">
                  Register as recipient NGO
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
