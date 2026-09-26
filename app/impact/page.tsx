import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import { ImpactCounter } from "@/components/public/impact-counter";
import { PublicNetworkMap } from "@/components/public/public-network-map";
import { PublicImpactCharts } from "@/components/public/public-impact-charts";
import { ImpactInteractiveExplorer } from "@/components/impact/impact-interactive-explorer";
import {
  getPlatformStats,
  getPublicNetworkData,
  getLiveRedistributionTickets,
} from "@/lib/platform-stats";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Utensils,
  Scale,
  Leaf,
  Building2,
  CheckCircle2,
  MapPin,
  Clock,
  Award,
  HeartHandshake,
  Truck,
  IndianRupee,
  FileCheck2,
  Users,
  Layers,
  ChevronRight,
  Droplets,
  Zap,
  HelpCircle,
  Car,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Public Impact Ledger | ZeroPlate.ai",
  description:
    "Real-time audited redistribution transparency ledger. Track cumulative meals served, food waste prevented, and carbon reduction certified across verified facilities.",
};

export default async function PublicImpactPage() {
  const [stats, networkData, tickets] = await Promise.all([
    getPlatformStats(),
    getPublicNetworkData(),
    getLiveRedistributionTickets(),
  ]);

  // Derived values for clarity
  const totalMeals = stats.mealsRedistributed;
  const totalKg = stats.wastePreventedByUnit?.kg ?? stats.wastePreventedKg;
  const totalCo2 = stats.co2eAvoidedKg;
  const estimatedSavings = totalMeals * 35; // Standard ₹35 avg meal budget saved for shelters

  const auditGuarantees = [
    {
      icon: ShieldCheck,
      title: "Zero Synthetic or Fabricated Data",
      desc: "Every metric is aggregated in real time from physical kitchen logs and verified NGO digital receipts. We never display fake sample counters.",
      color: "emerald",
      badge: "Audited Database",
    },
    {
      icon: Clock,
      title: "Automated 4-Hour Freshness Gates",
      desc: "Food older than 4 hours is automatically blocked from claim. Only safe, temperature-verified surplus is dispatched and credited.",
      color: "amber",
      badge: "Hygiene Standard",
    },
    {
      icon: FileCheck2,
      title: "UN FAO & Scope 3 Standards",
      desc: "Carbon reduction metrics follow official Food and Agriculture Organization (FAO) environmental models (1.8 kg CO₂e per kg food saved).",
      color: "sky",
      badge: "Certified Math",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <PublicNav />

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-22 border-b border-slate-200/80 bg-gradient-to-b from-emerald-50/50 via-white to-amber-50/20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-32 left-10 w-80 h-80 bg-sky-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Audited Public Transparency Ledger</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              Every meal counted.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 bg-clip-text text-transparent">
                Every kilogram verified.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl">
              ZeroPlate records every single surplus meal redistribution with automated temperature logs, GPS tracking, and recipient digital signatures. 
              Here is the real-time ecological and community impact created by participating kitchens, shelters, and couriers.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-7 py-6 text-base rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Link href="#interactive-explorer" className="flex items-center gap-2">
                  <span>Interactive Impact Explorer</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold px-6 py-6 text-base rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Link href="#network-map" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>View Live Network Map</span>
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Real Database Aggregation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Non-Profit Receipts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>UN FAO Environmental Model</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Primary 4-Metric Luxury KPI Strip */}
      <section className="bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-100 gap-2 text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Cumulative Ecological &amp; Community Totals
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Audited Platform Key Performance Indicators
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Live updates directly from kitchen donations &amp; NGO deliveries
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Metric 1: Meals */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-white p-6 border border-emerald-100 shadow-xs hover:shadow-md transition-all text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                <Utensils className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Wholesome Meals Served
              </span>
              <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
                <ImpactCounter value={totalMeals} />
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                Nutritious hot plates delivered straight to verified local shelters (2.5 meals/kg).
              </p>
            </div>

            {/* Metric 2: Food Rescued */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-white p-6 border border-amber-100 shadow-xs hover:shadow-md transition-all text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                <Scale className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Food Diverted From Waste
              </span>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <ImpactCounter value={totalKg} />
                  <span className="text-xs font-semibold text-slate-500 ml-1">kg</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <ImpactCounter value={stats.wastePreventedByUnit?.pieces ?? 0} />
                  <span className="text-xs font-semibold text-slate-500 ml-1">pcs</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <ImpactCounter value={stats.wastePreventedByUnit?.litres ?? 0} />
                  <span className="text-xs font-semibold text-slate-500 ml-1">L</span>
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                Wholesome food safely rescued from landfill disposal and delivered fresh.
              </p>
            </div>

            {/* Metric 3: Carbon Avoided */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50/70 via-white to-white p-6 border border-sky-100 shadow-xs hover:shadow-md transition-all text-left">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                CO₂e Emissions Avoided
              </span>
              <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-sky-600 tracking-tight">
                <ImpactCounter value={totalCo2} suffix=" kg" decimals={1} />
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                Methane emissions prevented using certified UN FAO factor (1.8 kg CO₂e / kg).
              </p>
            </div>

            {/* Metric 4: Shelter Savings */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50/70 via-white to-white p-6 border border-violet-100 shadow-xs hover:shadow-md transition-all text-left">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center mb-4">
                <IndianRupee className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Shelter Grocery Savings
              </span>
              <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-violet-600 tracking-tight">
                ₹{estimatedSavings.toLocaleString("en-IN")}
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                Estimated food budget redirected by charities to medical care and education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Impact Explorer (Equivalents + Potential Calculator + Live Audit Records) */}
      <section id="interactive-explorer" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/60">
        <div className="max-w-7xl mx-auto">
          <ImpactInteractiveExplorer stats={stats} tickets={tickets} />
        </div>
      </section>

      {/* Visual Analytics & Trajectory Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <PublicImpactCharts stats={stats} />
        </div>
      </section>

      {/* Participating Network Scale (4 Colorful Metric Cards) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/50">
        <div className="max-w-7xl mx-auto text-left">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Network Footprint
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Participating Network Scale
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Commercial facilities and community charities collaborating across the ZeroPlate network.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <div className="rounded-2xl p-6 border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all text-left">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">
                Institutions
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 block mt-2">
                {stats.institutionCount}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                Kitchens &amp; dining facilities
              </span>
            </div>

            <div className="rounded-2xl p-6 border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all text-left">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">
                NGO Partners
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 block mt-2">
                {stats.ngoCount}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                Verified community shelters
              </span>
            </div>

            <div className="rounded-2xl p-6 border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all text-left">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">
                Logistics Couriers
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-sky-600 block mt-2">
                {stats.deliveryPartnerCount}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                Drivers &amp; thermal fleet
              </span>
            </div>

            <div className="rounded-2xl p-6 border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all text-left">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">
                Completed Dispatches
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-violet-600 block mt-2">
                {stats.deliveredListingsCount}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                Verified handoffs documented
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Zero State Integrity Policy */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Anti-Greenwashing Standard
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Why You Can Trust This Ledger
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Unlike traditional corporate sustainability claims, every number in this ledger is cryptographically timestamped and recipient-verified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {auditGuarantees.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl p-6 border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100/80 text-emerald-800 px-2.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 mt-4 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Open Audit Standard</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Geographic Coverage Map */}
      <section id="network-map" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/60">
        <div className="max-w-7xl mx-auto text-left">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md">
                Spatial Redistribution Topology
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
                Live Geographic Coverage &amp; Corridors
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Auditable spatial distribution of verified commercial donor kitchens, recipient non-profits, and active logistics transfers.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Leaflet.js Network
            </span>
          </div>

          <div className="rounded-3xl border border-slate-200/90 shadow-md overflow-hidden bg-slate-50">
            <PublicNetworkMap nodes={networkData.nodes} routes={networkData.routes} />
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-4">
              <Zap className="w-3.5 h-3.5" />
              Transparent Food Redistribution Network
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Add your facility to this verified ledger.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Begin tracking kitchen waste prevention, redirecting surplus meals to hungry families, and generating certified ESG sustainability credits.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <Link href="/register" className="flex items-center gap-2">
                  <span>Join the Network Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 hover:bg-white/10 text-white font-semibold px-6 py-6 rounded-xl transition-all cursor-pointer"
              >
                <Link href="/institutions">Learn More for Kitchens</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
