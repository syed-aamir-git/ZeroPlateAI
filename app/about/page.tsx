import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { AboutInteractiveJourney } from "@/components/about/about-interactive-journey";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Utensils,
  Leaf,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Truck,
  Building2,
  Award,
  Users,
  AlertTriangle,
  Zap,
  Globe2,
  Scale,
  ChevronRight,
  HelpCircle,
  IndianRupee,
} from "lucide-react";

export const metadata = {
  title: "About Our Mission & Philosophy | ZeroPlate.ai",
  description:
    "Learn how ZeroPlate bridges AI predictive kitchen forecasting with safe, dignified, 100% free food redistribution to community shelters.",
};

export default function AboutPage() {
  const principles = [
    {
      num: "01",
      title: "Truth in the Ledger",
      subtitle: "Zero Fake Numbers or Greenwashing",
      desc: "Every metric displayed on ZeroPlate represents real meals and confirmed deliveries. We refuse to display fabricated sample counters. If a delivery isn't physically confirmed by an NGO, it is never added to the ledger.",
      color: "emerald",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      gradient: "from-emerald-500 to-teal-600",
      points: [
        "Cryptographic digital receipts on every handoff",
        "Direct non-profit confirmation required",
        "Open auditable public transparency",
      ],
    },
    {
      num: "02",
      title: "Safety Above Volume",
      subtitle: "Strict 4-Hour Fail-Closed Rules",
      desc: "We prioritize recipient health over redistribution statistics. If cooked food exceeds the strict 4-hour freshness window or breaches temperature thresholds, the listing is automatically blocked. No exceptions, no shortcuts.",
      color: "amber",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      gradient: "from-amber-500 to-orange-600",
      points: [
        "Strict 4-hour cooked food threshold",
        "Thermal packaging & temperature check",
        "Full ingredient transparency on listings",
      ],
    },
    {
      num: "03",
      title: "Dignified Community Relief",
      subtitle: "100% Free Food — Zero Platform Fees",
      desc: "Food rescue should never be a luxury or an administrative burden for non-profits. Verified charities, orphanages, and homeless shelters receive fresh hot meals delivered right to their doors without paying a single rupee.",
      color: "sky",
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      gradient: "from-sky-500 to-blue-600",
      points: [
        "Zero subscription or delivery fees for charities",
        "High-protein, wholesome nutritious meals",
        "Warm insulated transport directly to shelters",
      ],
    },
  ];

  const sdgs = [
    {
      num: "SDG 2",
      title: "Zero Hunger",
      desc: "Connecting bulk dining surplus directly to underfunded local shelters, food banks, and orphanages.",
      icon: Utensils,
      color: "from-amber-500 to-orange-600",
    },
    {
      num: "SDG 12",
      title: "Responsible Consumption",
      desc: "Using predictive AI forecasting to eliminate kitchen overproduction before cooking even starts.",
      icon: Scale,
      color: "from-emerald-500 to-teal-600",
    },
    {
      num: "SDG 13",
      title: "Climate Action",
      desc: "Preventing methane emissions generated when organic waste decomposes in open city landfills.",
      icon: Leaf,
      color: "from-sky-500 to-blue-600",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-22 border-b border-slate-200/80 bg-gradient-to-b from-emerald-50/50 via-white to-amber-50/20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-28 left-10 w-80 h-80 bg-sky-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Our Origin, Mission &amp; Guiding Philosophy</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              Ending kitchen waste.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 bg-clip-text text-transparent">
                Feeding hungry communities.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl">
              Every day, thousands of kilograms of freshly cooked food from dining halls, hospital cafeterias, and hotel banquets are thrown away — 
              while local shelters struggle to afford nutritious meals. ZeroPlate was founded to eliminate this paradox through predictive AI and dignified, 100% free community redistribution.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-7 py-6 text-base rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Link href="#interactive-tour" className="flex items-center gap-2">
                  <span>Explore Interactive Tour</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold px-6 py-6 text-base rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Link href="#principles">Our 3 Core Principles</Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Free Food for Verified Shelters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Automated 4-Hour Food Safety Lock</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Good Samaritan Legal Shield</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Journey Tour Section */}
      <section id="interactive-tour" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Interactive Platform Tour
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              How ZeroPlate Transforms Food Recovery
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Explore the difference between traditional waste cycles and our verified operating system.
            </p>
          </div>

          <AboutInteractiveJourney />
        </div>
      </section>

      {/* 3 Core Operating Principles */}
      <section id="principles" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full">
              Our Uncompromising Standards
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              The 3 Principles That Guide Everything We Build
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Engineering with strict integrity, fail-closed safety, and community dignity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {principles.map((p, idx) => (
              <div
                key={idx}
                className="rounded-3xl p-8 border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${p.gradient} text-white font-extrabold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform`}
                    >
                      {p.num}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${p.badgeBg}`}>
                      {p.subtitle}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-200/70 space-y-2">
                  {p.points.map((pt, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-xs font-medium text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* India-First FSSAI & Good Samaritan Legal Shield */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/50">
        <div className="max-w-5xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl shadow-slate-100 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Regulatory &amp; Legal Framework
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                India-First, FSSAI-Compliant Architecture
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ZeroPlate protects commercial donors and non-profits under official Food Safety norms.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Good Samaritan Protected
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-slate-900">
                Why Commercial Donors Are 100% Protected
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Many kitchens used to discard food out of fear that someone might fall ill and hold them liable. 
                Under Indian food donation guidelines, bona fide donors who donate wholesome food in good faith are protected from civil and criminal liability.
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 space-y-1">
                <strong>Digital Audit Trail:</strong>
                <p className="text-slate-600 mt-0.5">
                  Every batch logs the kitchen cooking time, temperature at handoff, courier thermal bag ID, and recipient signature in an immutable MongoDB database record.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-slate-900">
                Verified Recipient Safeguard
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Surplus food is never made public to unverified individuals. Only registered non-profits, shelters, and orphanages that pass official KYC credential checks can claim food batches.
              </p>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900 space-y-1">
                <strong>Zero Phantom Claims:</strong>
                <p className="text-slate-600 mt-0.5">
                  When a verified charity claims a batch, it is permanently locked to that organization. Drivers never arrive at a kitchen to find the food was given to someone else.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alignment with UN Sustainable Development Goals */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Global Climate &amp; Social Impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Alignd with UN Sustainable Development Goals
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Measuring the tangible social, economic, and environmental contributions of every meal rescued.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sdgs.map((sdg, i) => {
              const Icon = sdg.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6.5 border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${sdg.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold font-mono text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                        {sdg.num}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                      {sdg.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal mb-5">
                      {sdg.desc}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Audited Global Contribution</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/60">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950 p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-4">
              <Zap className="w-3.5 h-3.5" />
              Join the Zero Waste Movement
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Be part of the circular food revolution.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Whether you run a college dining hall, hospital cafeteria, food company, or local charity, ZeroPlate is free and ready to support you.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <Link href="/register" className="flex items-center gap-2">
                  <span>Register Facility or NGO Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 hover:bg-white/10 text-white font-semibold px-6 py-6 rounded-xl transition-all cursor-pointer"
              >
                <Link href="/impact">View Public Impact Ledger</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
