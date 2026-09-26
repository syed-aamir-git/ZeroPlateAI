import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import {
  Utensils,
  TrendingDown,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  FileCheck2,
  Zap,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Hotel,
  Factory,
  ChevronRight,
  ShieldAlert,
  ThumbsUp,
  XCircle,
  BarChart3,
} from "lucide-react";

export const metadata = {
  title: "For Kitchens & Dining Facilities | ZeroPlate.ai",
  description:
    "Predict daily meal prep with AI, eliminate kitchen overproduction, and safely redistribute unavoidable surplus to verified local charities with zero legal liability.",
};

export default function ForInstitutionsPage() {
  const pillars = [
    {
      icon: TrendingDown,
      title: "AI Demand Forecasting",
      subtitle: "Stop Over-Cooking Before the Stove Turns On",
      desc: "Our smart algorithms analyze past student & employee meal counts, calendar holidays, exams, and weather. Kitchens know exactly how much to prepare each morning.",
      benefit: "Cuts cooking overages by up to 35%",
      color: "emerald",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      gradient: "from-emerald-500 to-teal-600",
      points: [
        "Daily headcount & kilogram forecast",
        "Learns weekly dining attendance cycles",
        "Reduces raw ingredient procurement expenses",
      ],
    },
    {
      icon: Zap,
      title: "30-Second Surplus Donation",
      subtitle: "No Complex Paperwork for Kitchen Staff",
      desc: "When meal service closes, kitchen staff weigh extra trays and log portions in 30 seconds on a phone or tablet. Automated timers start immediately.",
      benefit: "Takes under 30 seconds to list",
      color: "amber",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      gradient: "from-amber-500 to-orange-600",
      points: [
        "Supports bulk trays, kilograms & litres",
        "Automated portion calculation",
        "Drivers arrive with thermal insulated crates",
      ],
    },
    {
      icon: ShieldCheck,
      title: "100% Legal & Food Safety Shield",
      subtitle: "Zero Liability for Donating Kitchens",
      desc: "Strict automated 4-hour freshness gates ensure only safe, temperature-verified food leaves the kitchen. Donors are shielded under bona fide Good Samaritan laws.",
      benefit: "Full legal donor protection",
      color: "sky",
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      gradient: "from-sky-500 to-blue-600",
      points: [
        "Fail-closed 4-hour freshness rules",
        "Only KYC-vetted charities can claim food",
        "Digital timestamped audit trail for food safety",
      ],
    },
    {
      icon: Award,
      title: "Automated ESG & Tax Proof",
      subtitle: "Turn Unavoidable Waste into Official Credits",
      desc: "Every meal rescued generates an official Scope 3 carbon reduction certificate and corporate CSR donation document, ready for university board and corporate audits.",
      benefit: "Audit-ready PDF reports",
      color: "violet",
      badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
      gradient: "from-violet-500 to-purple-600",
      points: [
        "Automated FAO carbon offset calculations",
        "One-click audit export for management",
        "Public sustainability recognition & badges",
      ],
    },
  ];

  const sectors = [
    {
      icon: GraduationCap,
      title: "Colleges & Hostels",
      desc: "Dining mess halls with fluctuating student turnouts during exams, festivals, and weekend leaves.",
      highlight: "Reduces campus plate waste by up to 28% within the first academic semester.",
      color: "emerald",
    },
    {
      icon: HeartPulse,
      title: "Hospitals & Healthcare",
      desc: "Dietary facilities managing strict hygiene standards and rapid patient census variations.",
      highlight: "Full batch audit trails guarantee 100% FSSAI compliance and zero contamination risk.",
      color: "sky",
    },
    {
      icon: Briefcase,
      title: "Corporate Campuses",
      desc: "Tech parks and corporate cafeterias adapting to hybrid work schedules and Tuesday–Thursday spikes.",
      highlight: "Automates Scope 3 ESG carbon reduction reports for corporate sustainability goals.",
      color: "amber",
    },
    {
      icon: Hotel,
      title: "Hotels & Banquets",
      desc: "High-volume buffets, weddings, and convention centers with substantial sudden evening surplus.",
      highlight: "Enables safe, same-evening pickup by verified food banks within 45 minutes.",
      color: "violet",
    },
    {
      icon: Factory,
      title: "Food Processing & Bakeries",
      desc: "Production facilities managing packaging batch overages, short-dated products, and test runs.",
      highlight: "Diverts near-expiry inventory to community shelters before costly waste disposal fees.",
      color: "teal",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-22 border-b border-slate-200/80 bg-gradient-to-b from-emerald-50/50 via-white to-amber-50/20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Smart Commercial Kitchen Operating System</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              Stop guessing prep.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 bg-clip-text text-transparent">
                Turn extra food into impact.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl">
              ZeroPlate gives university dining halls, hospital cafeterias, and food businesses the smart AI to cook the right amount every day. 
              When extra food remains, we connect you with verified local charities in minutes with 100% legal safety protection.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-7 py-6 text-base rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <Link href="/register?role=institution_admin" className="flex items-center gap-2">
                  <span>Register Kitchen Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold px-6 py-6 text-base rounded-xl shadow-xs transition-all"
              >
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Protected from Legal Liability</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Takes &lt; 30 Seconds to Log</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-amber-500" />
                <span>Certified Scope 3 Tax & ESG Reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars of Value for Kitchens */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Why Kitchens Love ZeroPlate
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Built for the Reality of Busy Kitchens
            </h2>
            <p className="mt-3 text-base text-slate-600">
              No complex training, no added stress for chefs. Instant simplicity from morning prep to evening close.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl p-8 border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.gradient} text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${pillar.badgeBg}`}
                      >
                        {pillar.benefit}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
                      {pillar.title}
                    </h3>
                    <div className="text-xs font-semibold text-slate-500 mb-3">
                      {pillar.subtitle}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="pt-5 border-t border-slate-200/70 space-y-2">
                    {pillar.points.map((pt, i) => (
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison: Without vs With ZeroPlate */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Side-By-Side Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              The Kitchen Transformation
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              See the immediate operational difference ZeroPlate makes in your daily dining operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Without ZeroPlate */}
            <div className="rounded-3xl p-8 bg-white border border-rose-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-4">
                  <XCircle className="w-4 h-4" />
                  <span>Without ZeroPlate</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Traditional Kitchen Guesswork
                </h3>

                <ul className="space-y-4 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>Manual meal guesswork:</strong> Chefs cook extra out of fear of running out, leading to 40–80 kg of wasted food daily.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>Complicated donation headaches:</strong> Staff spend hours calling local charities, who often arrive late or fail to show up.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>Legal & liability fear:</strong> Worry about contaminated leftovers exposing the institution to health and legal risks.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>Zero audit or tax credit:</strong> Wasted money is written off as an unavoidable kitchen loss with no ESG reporting value.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-rose-100 text-xs text-rose-700 font-semibold">
                Result: High procurement costs, wasted labor, and food ending in landfills.
              </div>
            </div>

            {/* With ZeroPlate */}
            <div className="rounded-3xl p-8 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 border border-emerald-300 shadow-md flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold mb-4">
                  <ThumbsUp className="w-4 h-4" />
                  <span>With ZeroPlate</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Smart AI Kitchen Operating System
                </h3>

                <ul className="space-y-4 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>AI headcount prediction:</strong> Machine learning forecasts attendance, cutting overcooking by up to 35% before prep starts.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>30-second 1-tap logging:</strong> Extra trays are logged instantly. Nearby verified charities claim meals within 4 minutes.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>100% Legal Good Samaritan shield:</strong> Automated temperature gates guarantee safety compliance with zero donor liability.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>Certified ESG & tax documents:</strong> Every rescued batch generates verified carbon avoidance metrics for university or corporate audits.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-200 text-xs text-emerald-700 font-semibold">
                Result: Lower food costs, happy staff, verified community hunger relief.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sector-Specific Tailored Environments */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Sectors We Serve
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Tailored for Every Kitchen Environment
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Whether you serve 300 hospital patients or 5,000 university students daily, ZeroPlate scales to your volume.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors.map((sec, i) => {
              const Icon = sec.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6.5 border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal mb-5">
                      {sec.desc}
                    </p>
                  </div>
                  <div className="pt-3.5 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{sec.highlight}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simulated Live Kitchen Dashboard View */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-5xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl shadow-slate-100 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                Live Kitchen Pass Interface
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                What Your Dining Staff Sees Every Day
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Optimized for touchscreens, iPads, and commercial kitchen wall mounts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Nobel Stays Mess • Lunch Pass
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1. AI Headcount Target
              </span>
              <div className="text-2xl font-extrabold text-slate-900">
                420 Meals Prepped
              </div>
              <p className="text-xs text-slate-500">
                Predicted accuracy 96.4% based on weekday attendance patterns.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                2. Unserved Surplus Logged
              </span>
              <div className="text-2xl font-extrabold text-slate-900">
                28 kg (~70 plates)
              </div>
              <p className="text-xs text-slate-600">
                Logged in 24 seconds. Temperature verified at 68°C.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                3. Courier & Shelter Match
              </span>
              <div className="text-2xl font-extrabold text-emerald-700">
                Hope Shelter
              </div>
              <p className="text-xs text-emerald-800">
                Claimed in 3 mins. Courier picked up in insulated crates.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>
                <strong>Instant ESG Record:</strong> Generated +50.4 kg CO₂e verified carbon offset certificate.
              </span>
            </div>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 py-2.5 shadow-sm"
            >
              <Link href="/register?role=institution_admin">
                <span>Start Free Onboarding</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-4">
              <Zap className="w-3.5 h-3.5" />
              Start Saving in 48 Hours
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to modernize your dining hall?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Join leading colleges, hospital kitchens, and corporate dining facilities cutting waste and feeding local communities.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/register?role=institution_admin" className="flex items-center gap-2">
                  <span>Register Your Kitchen</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 hover:bg-white/10 text-white font-semibold px-6 py-6 rounded-xl transition-all"
              >
                <Link href="/contact">Talk to Kitchen Solutions Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
