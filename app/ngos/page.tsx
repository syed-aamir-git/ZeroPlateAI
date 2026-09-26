import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { NgoInteractiveShowcase } from "@/components/ngos/ngo-interactive-showcase";
import { Button } from "@/components/ui/button";
import {
  HeartHandshake,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  FileCheck2,
  Zap,
  HelpCircle,
  ThumbsUp,
  XCircle,
  MapPin,
  BellRing,
  Award,
  Users,
  Utensils,
  ChevronRight,
  Lock,
  Home,
  Baby,
  HeartPulse,
  Soup,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";

export const metadata = {
  title: "For Charities & Food Banks | ZeroPlate.ai",
  description:
    "Receive reliable, 100% free, fresh surplus meals from college dining halls and commercial kitchens with automated food safety and coordinated delivery.",
};

export default function ForNgosPage() {
  const pillars = [
    {
      icon: HeartHandshake,
      title: "100% Free Food — Zero Platform Fees",
      subtitle: "High-Quality Meals for the People You Serve",
      desc: "Commercial kitchens donate their fresh surplus food for free. Your non-profit, shelter, or community kitchen never pays a single rupee for food, registration, or platform access.",
      benefit: "100% Free Forever",
      color: "amber",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      gradient: "from-amber-500 to-orange-600",
      points: [
        "Zero subscription, listing, or delivery fees",
        "Direct hunger relief for children, seniors, & families",
        "Save substantial budget on monthly grocery costs",
      ],
    },
    {
      icon: ShieldCheck,
      title: "Automated Food Safety Verification",
      subtitle: "Never Gamble on Food Quality or Freshness",
      desc: "Every batch is verified against strict temperature and preparation time rules before you see it. Hot food older than 4 hours is automatically blocked from listing.",
      benefit: "Hygienic & Safe to Eat",
      color: "emerald",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      gradient: "from-emerald-500 to-teal-600",
      points: [
        "Strict 4-hour fresh cooked window",
        "Exact cooking time & temperature displayed",
        "Full ingredient transparency on every listing",
      ],
    },
    {
      icon: Lock,
      title: "1-Tap Reservation — Zero Phantom Food",
      subtitle: "The Moment You Tap Claim, It's Yours",
      desc: "No more sending drivers to a kitchen only to find someone else took the food. When you claim a batch, it is immediately locked exclusively to your organization.",
      benefit: "Guaranteed Reservation",
      color: "sky",
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      gradient: "from-sky-500 to-blue-600",
      points: [
        "Instant lock prevents duplicate claims",
        "Automatic courier dispatch upon claim",
        "Claimed in seconds from your mobile phone",
      ],
    },
    {
      icon: Truck,
      title: "Fast Delivery Straight to Your Door",
      subtitle: "Warm Food Transport in Insulated Crates",
      desc: "Whether you have your own volunteer van or rely on platform couriers, our network transports warm food containers directly to your shelter's entrance in under 45 minutes.",
      benefit: "Delivered Warm & Fresh",
      color: "violet",
      badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
      gradient: "from-violet-500 to-purple-600",
      points: [
        "Live GPS tracking of your delivery courier",
        "Transported in hygienic insulated thermal crates",
        "Simple 1-tap digital receipt confirmation",
      ],
    },
  ];

  const eligibleGroups = [
    {
      icon: Home,
      title: "Homeless & Night Shelters",
      desc: "Providing warm, dignified evening dinners and morning breakfasts to unhoused individuals and families.",
      tag: "Dinner & Breakfast",
      color: "amber",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: Baby,
      title: "Orphanages & Child Care",
      desc: "Providing protein-rich, nourishing daily meals to orphaned children and youth development shelters.",
      tag: "Wholesome Nutrition",
      color: "emerald",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: HeartPulse,
      title: "Senior Citizen Care Homes",
      desc: "Delivering soft, mild, and nutritious freshly prepared meals suitable for elderly residents.",
      tag: "Mild & Hygienic",
      color: "sky",
      gradient: "from-sky-500 to-blue-600",
    },
    {
      icon: Soup,
      title: "Community Kitchens & Langars",
      desc: "Augmenting community feeding lines and emergency soup kitchens with bulk prepared cafeteria pans.",
      tag: "Bulk Pans Available",
      color: "violet",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: AlertTriangle,
      title: "Emergency & Disaster Relief",
      desc: "Mobilizing rapid emergency food assistance to flooded communities, temporary camps, and crisis zones.",
      tag: "Rapid Mobilization",
      color: "rose",
      gradient: "from-rose-500 to-pink-600",
    },
    {
      icon: GraduationCap,
      title: "Slum Community Learning Centers",
      desc: "Supplying wholesome midday lunches to keep children energized and attending educational programs.",
      tag: "Midday Meal Support",
      color: "teal",
      gradient: "from-teal-500 to-emerald-600",
    },
  ];

  const onboardingSteps = [
    {
      num: "01",
      title: "Register Your Organization in 2 Minutes",
      desc: "Fill out a quick form with your NGO registration number, contact person, location, and your shelter's daily meal capacity.",
      color: "from-emerald-500 to-teal-600",
    },
    {
      num: "02",
      title: "Quick 24-Hour Safety Verification",
      desc: "Our verification team quickly confirms your non-profit credentials against official databases to maintain high network trust.",
      color: "from-amber-500 to-orange-600",
    },
    {
      num: "03",
      title: "Start Claiming Free Hot Meals",
      desc: "Receive instant phone notifications when fresh food is logged within 10 km. Tap to claim and receive hot deliveries.",
      color: "from-sky-500 to-blue-600",
    },
  ];

  const faqs = [
    {
      q: "Do we have to pay anything for the food or deliveries?",
      a: "No! Absolutely not. Food and platform access are 100% free for verified non-profits, orphanages, shelters, and community kitchens.",
    },
    {
      q: "Do we need our own transport vehicle or driver?",
      a: "Not necessarily. While you can send your own volunteer vehicle if you prefer, ZeroPlate coordinates dedicated delivery couriers who pick up food and drop it right at your door.",
    },
    {
      q: "What kinds of food can we expect?",
      a: "Freshly cooked hot meals (rice, curries, chapati, dal), bulk cafeteria pans, bakery items, and packaged dairy from colleges, hospitals, and hotels.",
    },
    {
      q: "How do we know the food is safe and hygienic?",
      a: "All food donors must comply with automated 4-hour freshness gates and thermal packaging checks. Any food that breaches safety thresholds is blocked automatically.",
    },
    {
      q: "How fast does delivery happen after we claim food?",
      a: "Most local deliveries arrive at your shelter's door within 25 to 45 minutes, transported in thermal insulated hot crates.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-22 border-b border-slate-200/80 bg-gradient-to-b from-amber-50/50 via-white to-emerald-50/20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-amber-100/40 via-orange-50/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shadow-2xs mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>100% Free Surplus Meals for Verified Non-Profits</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              Fresh, delicious food.
              <br />
              <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-emerald-600 bg-clip-text text-transparent">
                Delivered free to your shelter.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl">
              ZeroPlate connects community kitchens, homeless shelters, and food banks directly with college dining halls, hospital cafeterias, and hotels. 
              Get notified instantly when warm meals are ready, claim them in one tap, and feed families without paying a single rupee.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-7 py-6 text-base rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Link href="/register?role=ngo" className="flex items-center gap-2">
                  <span>Register Charity for Free Food</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold px-6 py-6 text-base rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Link href="#interactive-demo">Try Live App Simulator</Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Free Food — Zero Platform Fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Guaranteed Fresh &amp; Hygiene Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Hot Delivery to Your Doorstep</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Showcase Section (App Simulator + Savings Calculator) */}
      <section id="interactive-demo" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full">
              Interactive NGO Experience
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Test the Non-Profit Platform Live
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Try claiming a fresh batch in real time, or calculate how much your shelter can save on food costs each month.
            </p>
          </div>

          <NgoInteractiveShowcase />
        </div>
      </section>

      {/* 4 Core Pillars for Charities */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full">
              Why Charities Trust ZeroPlate
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Dignified, Reliable Community Food Supply
            </h2>
            <p className="mt-3 text-base text-slate-600">
              No awkward phone calls, no spoiled donations. Hot, nutritious meals ready to serve.
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
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.gradient} text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${pillar.badgeBg}`}
                      >
                        {pillar.benefit}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-amber-700 transition-colors">
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

      {/* Side-by-Side Comparison: Traditional Recovery vs ZeroPlate */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full">
              The Clear Difference
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Traditional Food Recovery vs. ZeroPlate
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Why shelters and non-profits are upgrading from frantic phone calls to reliable digital redistribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traditional Food Recovery */}
            <div className="rounded-3xl p-8 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-4">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Traditional Food Recovery</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Frantic, Uncertain &amp; Stressful
                </h3>

                <ul className="space-y-4 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>
                      <strong>Endless awkward phone calls:</strong> Shelter staff spend hours calling banquet halls and hotels hoping someone has leftover meals.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>
                      <strong>Phantom food disappointment:</strong> Driving 15 km across the city only to find another charity already picked up the trays or the food was thrown out.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>
                      <strong>Zero temperature safety checks:</strong> Taking unsafe risks with cold food that sat at room temperature for hours, risking illness.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>
                      <strong>Heavy volunteer vehicle burden:</strong> Forcing non-profit staff to drive personal cars late at night to pick up heavy food pans.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-rose-600 font-semibold">
                Result: High volunteer burnout, wasted fuel, and unpredictable meals.
              </div>
            </div>

            {/* With ZeroPlate */}
            <div className="rounded-3xl p-8 bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/30 border border-amber-300 shadow-md flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold mb-4">
                  <ThumbsUp className="w-4 h-4 text-amber-600" />
                  <span>With ZeroPlate Network</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Dignified, Verified &amp; 100% Free
                </h3>

                <ul className="space-y-4 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>Automated instant alerts:</strong> Get pinged the second a dining hall or hotel cafeteria logs surplus food within 10 km.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>1-Tap lock guarantee:</strong> When you claim a batch, it is permanently locked to your shelter. Zero chance of phantom food.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>Guaranteed safe &amp; hot:</strong> Automated 4-hour freshness rules and temperature audits ensure food is safe and hygienic.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>Free doorstep delivery:</strong> Dedicated delivery couriers transport food directly to your shelter in insulated hot crates.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-amber-200 text-xs text-amber-700 font-semibold">
                Result: Reliable warm food supply, massive grocery budget savings, 100% free.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eligible Non-Profit Organizations Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Who We Serve
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Built for Community Relievers of All Sizes
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Any registered charitable organization, trust, or community kitchen dedicated to feeding vulnerable individuals is welcome.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eligibleGroups.map((group, i) => {
              const Icon = group.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6.5 border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${group.gradient} text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
                        {group.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-700 transition-colors">
                      {group.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal mb-5">
                      {group.desc}
                    </p>
                  </div>
                  <div className="pt-3.5 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Eligible for 100% Free Food Deliveries</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Join Section */}
      <section id="how-to-join" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-slate-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full">
              Simple Verification
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              How to Join as a Recipient Partner
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Three simple steps to connect your community kitchen to institutional surplus.
            </p>
          </div>

          <div className="space-y-4">
            {onboardingSteps.map((step, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-6 border border-slate-200/90 bg-white hover:shadow-md transition-all flex items-start gap-5 text-left group"
              >
                <span
                  className={`w-11 h-11 rounded-xl font-extrabold flex items-center justify-center text-sm shadow-md text-white bg-gradient-to-br ${step.color} shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {step.num}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Link href="/register?role=ngo" className="flex items-center gap-2">
                <span>Start Free NGO Registration</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Common NGO Questions (FAQs) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full">
              Non-Profit Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Clear answers for shelter directors, food bank volunteers, and non-profit leaders.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">
                      {faq.q}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/60">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-amber-900 via-slate-900 to-emerald-950 p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-4">
              <Zap className="w-3.5 h-3.5" />
              100% Free Food Relief Network
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Feed more families in your community.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Register your shelter or charitable foundation today to start receiving daily notifications of safe, free hot meals nearby.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <Link href="/register?role=ngo" className="flex items-center gap-2">
                  <span>Register Your Charity Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 hover:bg-white/10 text-white font-semibold px-6 py-6 rounded-xl transition-all cursor-pointer"
              >
                <Link href="/how-it-works">Learn How Safety Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
