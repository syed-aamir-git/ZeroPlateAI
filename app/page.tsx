import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import { TicketStrip } from "@/components/public/ticket-strip";
import { ImpactCounter } from "@/components/public/impact-counter";
import { PublicNetworkMap } from "@/components/public/public-network-map";
import { PublicImpactCharts } from "@/components/public/public-impact-charts";
import { HowItWorksSection } from "@/components/public/how-it-works-section";
import {
  getPlatformStats,
  getLiveRedistributionTickets,
  getPublicNetworkData,
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
  ChevronRight,
  HeartHandshake,
  Truck,
  TrendingDown,
  FileCheck2,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, tickets, networkData] = await Promise.all([
    getPlatformStats(),
    getLiveRedistributionTickets(),
    getPublicNetworkData(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-100/50 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-24 right-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-36 left-0 w-80 h-80 bg-sky-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Regional Food Rescue Network</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              Rescue fresh food.
              <br />
              Feed people in need.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 bg-clip-text text-transparent">
                End kitchen waste.
              </span>
            </h1>

            {/* Clear Layman Subtitle */}
            <p className="mt-6 text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl">
              ZeroPlate connects college dining halls, hospital cafeterias, and food businesses directly with local charities and food banks. 
              We use smart forecasting to avoid over-prepping and instantly redirect delicious surplus meals to hungry families.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-7 py-6 text-base rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <Link href="/register" className="flex items-center gap-2">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-800 font-semibold px-6 py-6 text-base rounded-xl shadow-xs transition-all"
              >
                <Link href="#network-map" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Explore Live Map</span>
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Free for Charities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Automated Food Safety Checks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Verified Tax & ESG Reports</span>
              </div>
            </div>
          </div>

          {/* Live Redistribution Ticket Strip */}
          <div className="mt-14 sm:mt-18 pt-6 border-t border-slate-200/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 px-1 gap-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Live Food Redistribution Stream
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Real batches matched & dispatched across member kitchens
              </span>
            </div>
            <TicketStrip tickets={tickets} />
          </div>
        </div>
      </section>

      {/* Colorful, High-Impact 4-Metric Grid */}
      <section className="bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Verified Community Impact
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                Real-Time Platform Numbers
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Live updates directly from kitchen logs & NGO deliveries
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Metric 1: Meals */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-white p-6 border border-emerald-100 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                <Utensils className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Meals Served
              </span>
              <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
                <ImpactCounter value={stats.mealsRedistributed} />
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Nutritious warm meals delivered straight to verified local shelters.
              </p>
            </div>

            {/* Metric 2: Food Rescued */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-white p-6 border border-amber-100 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                <Scale className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Food Saved From Waste
              </span>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <ImpactCounter value={stats.wastePreventedByUnit?.kg ?? stats.wastePreventedKg} />
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
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Wholesome food rescued from disposal and delivered fresh.
              </p>
            </div>

            {/* Metric 3: Carbon Avoided */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50/70 via-white to-white p-6 border border-sky-100 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                CO₂e Emissions Prevented
              </span>
              <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-sky-600 tracking-tight">
                <ImpactCounter value={stats.co2eAvoidedKg} suffix=" kg" decimals={1} />
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Greenhouse gas emissions prevented using certified FAO standards.
              </p>
            </div>

            {/* Metric 4: Active Partners */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50/70 via-white to-white p-6 border border-violet-100 shadow-xs hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Facilities
              </span>
              <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-violet-600 tracking-tight">
                <ImpactCounter value={stats.institutionCount + stats.ngoCount} />
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                {stats.institutionCount} partner kitchens and {stats.ngoCount} verified charities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive How It Works Section */}
      <HowItWorksSection />

      {/* Live Regional Food Rescue Network Map */}
      <section id="network-map" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Live Regional Corridor
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
                Real-Time Food Rescue Map
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                Explore real-time redistribution corridors connecting onboarded college messes, corporate dining, and local verified charities across the city.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Interactive Live Map
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 shadow-md overflow-hidden bg-slate-50">
            <PublicNetworkMap nodes={networkData.nodes} routes={networkData.routes} />
          </div>
        </div>
      </section>

      {/* Interactive Visual Analytics Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-[#F9FBFA]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md">
              Complete Transparency
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              Redistribution Analytics & Breakdown
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Real data logged from partner facilities, showing food categories, carbon savings, and verified redistribution streams.
            </p>
          </div>

          <PublicImpactCharts stats={stats} />
        </div>
      </section>

      {/* Why Institutions & Kitchens Choose ZeroPlate */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              Built for Large Facilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Purpose-built for institutional kitchens, not small leftovers.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Consumer food apps trade single sandwiches and leftover pastries. 
              ZeroPlate is built for the operational scale of university dining halls, hospital cafeterias, corporate mess halls, and food processing centers.
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              We handle high-volume bulk batches (10 kg to 500+ kg), guarantee food safety before anything is dispatched, and issue certified carbon-reduction and tax documents.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm">
                <Link href="/institutions">Learn more for Kitchens</Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold">
                <Link href="/ngos">Learn more for NGOs</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50/40 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Automated Food Safety Gate
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Pre-configured temperature and time limits ensure food safety compliance, protecting kitchen partners from legal liability.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50/40 p-6 rounded-2xl border border-amber-100 flex items-start gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Dedicated Local Logistics
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Turn-by-turn mobile dispatch connects kitchen dispatch staff with verified drivers and volunteer couriers for fast pickups.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-sky-50 to-blue-50/40 p-6 rounded-2xl border border-sky-100 flex items-start gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Verified ESG & Tax Certificates
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Instant certified reports converting saved food into Scope 3 carbon reduction metrics and social impact documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Gateways (Choose Your Role) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Get Started Today
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Choose your role in the food rescue network
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Join hundreds of kitchen staff, charity leaders, and drivers making an immediate difference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kitchen Card */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Kitchens & Dining
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                  I run a Cafeteria, Mess, or Kitchen
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Log inventory, forecast prep counts with AI, redirect extra meals, and download certified ESG impact reports.
                </p>
              </div>
              <Button
                asChild
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold py-5.5 justify-between shadow-sm group-hover:shadow-md transition-all"
              >
                <Link href="/register?role=institution_admin">
                  <span>Register Kitchen</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* NGO Card */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                  Charities & Shelters
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                  I run an NGO or Food Bank
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Complete free KYC verification, discover fresh surplus food nearby, claim listings, and feed hungry families.
                </p>
              </div>
              <Button
                asChild
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold py-5.5 justify-between shadow-sm group-hover:shadow-md transition-all"
              >
                <Link href="/register?role=ngo">
                  <span>Register Charity</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Delivery Partner Card */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                  Transport & Volunteers
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                  I want to Deliver or Volunteer
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Accept nearby delivery assignments on your phone, track pickup routes, and help transport fresh food to shelters.
                </p>
              </div>
              <Button
                asChild
                className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold py-5.5 justify-between shadow-sm group-hover:shadow-md transition-all"
              >
                <Link href="/register?role=delivery_partner">
                  <span>Join as Driver</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Vibrant High-End Final CTA Banner */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Start Saving Food Today
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Turn kitchen waste into hunger relief.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Join college messes, hospital kitchens, and food banks actively stopping waste and feeding communities. Zero cost for charities.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/register" className="flex items-center gap-2">
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 hover:bg-white/10 text-white font-semibold px-6 py-6 rounded-xl transition-all"
              >
                <Link href="/how-it-works">Learn How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
