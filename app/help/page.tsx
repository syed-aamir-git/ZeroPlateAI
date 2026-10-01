"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import {
  Search,
  ShieldCheck,
  HeartHandshake,
  Truck,
  Leaf,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Mail,
  Zap,
  Building2,
  ThumbsUp,
  BookOpen,
  Layers,
  HelpCircle,
  Share2,
  Check,
  Lightbulb,
  Utensils,
  Users,
} from "lucide-react";

interface FAQItem {
  id: string;
  category: "safety" | "kyc" | "claiming" | "logistics" | "sustainability";
  categoryLabel: string;
  audience: "Kitchens & Donors" | "NGOs & Shelters" | "Delivery & Drivers" | "Everyone";
  question: string;
  summary: string;
  takeaway: string;
  keyPoints: { title: string; detail: string }[];
  laymanTip: string;
  tags: string[];
  badgeColor: string;
}

const FAQS: FAQItem[] = [
  // 1. Food Safety & Freshness
  {
    id: "safety-4-hour",
    category: "safety",
    categoryLabel: "Food Safety",
    audience: "Kitchens & Donors",
    question: "What is the 4-Hour Rule for cooked food?",
    summary: "All cooked meals must be picked up within 4 hours of cooking to stay 100% fresh and safe.",
    takeaway: "Cooked meals are automatically locked out if 4 hours pass from cooking time, ensuring community safety.",
    keyPoints: [
      {
        title: "Automated Timer",
        detail: "When a kitchen logs surplus rice, lentils, or curries, our system records the exact preparation time and starts a live 4-hour countdown.",
      },
      {
        title: "Auto-Lock Protection",
        detail: "If the 4-hour safety window expires before collection, the batch is automatically locked and cannot be claimed.",
      },
      {
        title: "FSSAI Aligned",
        detail: "Strictly adheres to national food safety guidelines so meals reach people at peak hygiene.",
      },
    ],
    laymanTip: "Example: Food finished cooking at 12:00 PM must be picked up and dispatched before 4:00 PM.",
    tags: ["4-hour", "freshness", "cooked food", "fssai", "safety", "timer"],
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "safety-fail-closed",
    category: "safety",
    categoryLabel: "Food Safety",
    audience: "Kitchens & Donors",
    question: "What happens if a safety check is missing information?",
    summary: "ZeroPlate operates on a zero-tolerance policy — unverified food is never listed or distributed.",
    takeaway: "If any detail is incomplete or unverified, the listing is automatically rejected immediately.",
    keyPoints: [
      {
        title: "Zero Guesswork",
        detail: "Missing preparation time, incomplete food name, or unverified temperature logs prevent the food from going live.",
      },
      {
        title: "Strict Screening",
        detail: "Food must pass 100% of our automated verification criteria before any charity can see or claim it.",
      },
      {
        title: "Total Protection",
        detail: "Shelters and hungry families receive only certified, freshly checked meals with full transparency.",
      },
    ],
    laymanTip: "We never take chances with food hygiene. If there is any doubt, the food is not shared.",
    tags: ["safety check", "zero tolerance", "quality", "rejection", "hygiene"],
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "safety-legal-protection",
    category: "safety",
    categoryLabel: "Food Safety",
    audience: "Kitchens & Donors",
    question: "Are restaurants and kitchens legally protected when donating?",
    summary: "Yes. Food donors who donate wholesome surplus in good faith are fully protected by law.",
    takeaway: "Good Samaritan norms protect commercial kitchens from liability when donating safe surplus food.",
    keyPoints: [
      {
        title: "Good Samaritan Shield",
        detail: "Statutory Good Samaritan guidelines protect dining halls, hotels, and caterers who donate edible food in good faith.",
      },
      {
        title: "Digital Proof of Hygiene",
        detail: "Every donation creates an immutable digital record with cooking time, temperature, and donor ID as verification.",
      },
      {
        title: "Donate With Confidence",
        detail: "Kitchen managers can prevent food waste without worrying about unnecessary legal exposure.",
      },
    ],
    laymanTip: "When you follow standard kitchen hygiene rules, you can donate with complete peace of mind.",
    tags: ["legal", "good samaritan", "liability", "donor protection", "law"],
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },

  // 2. NGO Access & Verification
  {
    id: "kyc-free-meals",
    category: "kyc",
    categoryLabel: "NGO Access",
    audience: "NGOs & Shelters",
    question: "Do charities, orphanages, or shelters have to pay anything?",
    summary: "100% Free forever. Charities and non-profits never pay for food or delivery.",
    takeaway: "Zero food cost, zero delivery fees, zero platform charges for all verified non-profits.",
    keyPoints: [
      {
        title: "Zero Food Cost",
        detail: "All meals are donated free by partner university dining halls, hospital cafeterias, and caterers.",
      },
      {
        title: "Free Delivery Support",
        detail: "Deliveries are handled by partner couriers or self-pickup, with zero delivery fees charged to the shelter.",
      },
      {
        title: "No Hidden Fees",
        detail: "No sign-up fee, no monthly subscription, and no hidden commission ever.",
      },
    ],
    laymanTip: "Every rupee your NGO saves on grocery costs can be redirected towards education and healthcare.",
    tags: ["free", "cost", "charity", "shelters", "zero fee", "non-profit"],
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "kyc-approval-process",
    category: "kyc",
    categoryLabel: "NGO Access",
    audience: "NGOs & Shelters",
    question: "How does a non-profit or shelter get approved to receive food?",
    summary: "A quick 1-time verification validates your non-profit registration within 24 hours.",
    takeaway: "Submit your basic NGO registration and daily capacity once for permanent instant access.",
    keyPoints: [
      {
        title: "Simple Documents",
        detail: "Upload your NGO registration certificate (such as 12A/80G, DARPAN ID, or Trust Deed) and contact info.",
      },
      {
        title: "Set Capacity",
        detail: "Indicate how many people you can serve daily (e.g. 50, 200, 500 plates) so you only get matched with the right quantities.",
      },
      {
        title: "24-Hour Approval",
        detail: "Our team reviews your submission within 24 hours. Once verified, you can claim meals with a single tap.",
      },
    ],
    laymanTip: "Verification takes only 5 minutes to submit online and gives your organization lifetime access.",
    tags: ["kyc", "approval", "verification", "registration", "12a", "80g"],
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "kyc-unapproved-claim",
    category: "kyc",
    categoryLabel: "NGO Access",
    audience: "Everyone",
    question: "Can private individuals or commercial businesses claim food?",
    summary: "No. Surplus food is reserved exclusively for officially verified non-profit shelters.",
    takeaway: "Food is strictly protected for verified charities to prevent commercial resale and misuse.",
    keyPoints: [
      {
        title: "No Resale or Abuse",
        detail: "Surplus meals are never made accessible to commercial buyers or unverified private individuals.",
      },
      {
        title: "Direct Beneficiaries",
        detail: "Only verified orphanages, homeless shelters, old-age homes, and community kitchens can view and claim food.",
      },
      {
        title: "Community First",
        detail: "If you are an individual in need, you can visit any of our registered partner community kitchens for hot meals.",
      },
    ],
    laymanTip: "This rule guarantees that wholesome meals go directly to hungry families, not for commercial profit.",
    tags: ["unverified", "security", "exclusive", "shelter", "eligibility"],
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },

  // 3. Instant Claiming & Reservations
  {
    id: "claims-race-condition",
    category: "claiming",
    categoryLabel: "Instant Claims",
    audience: "NGOs & Shelters",
    question: "How does ZeroPlate prevent two charities from claiming the same food?",
    summary: "Instant 1-tap exclusive locking reserves the food immediately so no two charities get the same batch.",
    takeaway: "The millisecond you click 'Claim', the batch is digitally locked exclusively to your shelter.",
    keyPoints: [
      {
        title: "Instant Digital Lock",
        detail: "Our database places a millisecond-level lock on the surplus batch the moment you click Claim.",
      },
      {
        title: "No Double Booking",
        detail: "Other organizations instantly see the batch as reserved. Shelters never travel across town to an empty kitchen.",
      },
      {
        title: "Smart Alternatives",
        detail: "If someone claimed a batch a split-second before you, the system instantly suggests the nearest available match.",
      },
    ],
    laymanTip: "When you tap Claim, the batch is 100% yours. You never arrive to find another charity took the food.",
    tags: ["exclusive lock", "duplicate claims", "atomic lock", "instant reservation"],
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "claims-smart-matching",
    category: "claiming",
    categoryLabel: "Instant Claims",
    audience: "Kitchens & Donors",
    question: "How does the system match food donations with the right shelter?",
    summary: "Our smart proximity engine pairs donations based on travel distance and shelter plate capacity.",
    takeaway: "We match the closest verified shelter that can handle the exact meal count within minutes.",
    keyPoints: [
      {
        title: "Shortest Travel Time",
        detail: "Pairs the closest verified shelter to ensure food travels quickly and stays piping hot.",
      },
      {
        title: "Capacity Fit",
        detail: "A 200-meal donation goes to a shelter equipped for 200 meals, preventing over-delivery or waste.",
      },
      {
        title: "Dietary Preferences",
        detail: "Accounts for vegetarian, Jain, or specific dietary requirements requested by each shelter.",
      },
    ],
    laymanTip: "Food reaches people while it is fresh, hot, and delicious — usually within 30 to 45 minutes.",
    tags: ["smart match", "algorithm", "proximity", "distance", "capacity"],
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
  },

  // 4. Delivery & Logistics
  {
    id: "logistics-courier-pickup",
    category: "logistics",
    categoryLabel: "Delivery Fleet",
    audience: "Delivery & Drivers",
    question: "Who delivers the food from the kitchen to the shelter?",
    summary: "Deliveries are handled by the shelter's own vehicles or ZeroPlate's verified courier partners.",
    takeaway: "Flexible transport using insulated thermal carriers keeps food fresh and hot during transit.",
    keyPoints: [
      {
        title: "Insulated Carriers",
        detail: "Couriers use food-grade insulated bags that maintain proper temperatures throughout the journey.",
      },
      {
        title: "Live Milestone Tracking",
        detail: "Track the journey from Assigned → Picked Up → On The Way → Delivered in real time on your screen.",
      },
      {
        title: "Flexible Options",
        detail: "NGOs can choose to pick up with their own van or request an automated courier pickup.",
      },
    ],
    laymanTip: "You can watch the driver's progress on your phone just like tracking a standard food delivery order.",
    tags: ["delivery", "driver", "transport", "courier", "logistics", "thermal bag"],
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
  },
  {
    id: "logistics-recipient-confirm",
    category: "logistics",
    categoryLabel: "Delivery Fleet",
    audience: "NGOs & Shelters",
    question: "Why must the shelter confirm receipt on their phone upon delivery?",
    summary: "A 1-tap digital receipt verifies safe handover and closes the chain of custody.",
    takeaway: "Tapping 'Confirm' provides instant proof of safe delivery and unlocks sustainability credits for the donor.",
    keyPoints: [
      {
        title: "Visual Seal Check",
        detail: "The shelter coordinator inspects the tamper-evident packaging and confirms condition with one tap.",
      },
      {
        title: "Digital Receipt",
        detail: "Generates an automatic digital receipt so both the donor kitchen and the shelter have an audit trail.",
      },
      {
        title: "Unlocks Carbon Savings",
        detail: "Officially logs the rescued kilograms into the donor kitchen's environmental dashboard.",
      },
    ],
    laymanTip: "One quick tap on your phone confirms the food arrived safely and thanks the kitchen team.",
    tags: ["confirmation", "receipt", "audit", "delivery closure", "handover"],
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
  },

  // 5. Environmental & Carbon Reports
  {
    id: "reports-co2-formula",
    category: "sustainability",
    categoryLabel: "ESG & Carbon",
    audience: "Everyone",
    question: "How are meal counts and carbon (CO2) reduction numbers calculated?",
    summary: "Using official United Nations & FAO environmental standards: 2.5 meals/kg and 1.8 kg CO2 saved/kg.",
    takeaway: "Every kilogram of food saved equals 2.5 nutritious meals and avoids 1.8 kg of greenhouse emissions.",
    keyPoints: [
      {
        title: "Meal Formula",
        detail: "Calculated at 2.5 meals per kilogram based on standard 400g nutritious portions defined by the FAO.",
      },
      {
        title: "Landfill Methane Avoided",
        detail: "Avoids 1.8 kg CO2-equivalent emissions for every 1 kg of organic food diverted from municipal landfills.",
      },
      {
        title: "Water Conservation",
        detail: "Conserves approximately 850 liters of agricultural fresh water for every kilogram of food rescued.",
      },
    ],
    laymanTip: "Donating 40 kg of surplus food feeds 100 people and keeps 72 kg of harmful greenhouse gas out of the atmosphere.",
    tags: ["co2", "carbon", "metrics", "formula", "meals rescued", "fao", "unep"],
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    id: "reports-free-export",
    category: "sustainability",
    categoryLabel: "ESG & Carbon",
    audience: "Kitchens & Donors",
    question: "Can commercial kitchens download certified ESG and tax reports for free?",
    summary: "Yes. All kitchens receive free downloadable audit reports, CSV logs, and CSR certificates.",
    takeaway: "Download professional ESG and CSR compliance reports with 1 click from your Kitchen Dashboard.",
    keyPoints: [
      {
        title: "1-Click Download",
        detail: "Export monthly PDF audit summaries and Excel data logs ready for corporate filings.",
      },
      {
        title: "CSR & ESG Ready",
        detail: "Pre-formatted for corporate sustainability reporting, Scope 3 emission accounting, and board presentations.",
      },
      {
        title: "100% Free",
        detail: "No hidden charges or upgrade fees to access, generate, or export your facility's verified impact data.",
      },
    ],
    laymanTip: "You can directly attach our downloadable PDF reports to your company's annual CSR and tax filings.",
    tags: ["esg report", "csv export", "tax deduction", "csr", "scope-3"],
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
  },
];

const CATEGORY_CARDS = [
  {
    id: "all",
    label: "All Topics",
    icon: Layers,
    color: "slate",
    accentBg: "bg-slate-900 text-white",
    desc: "Complete operational guide & FAQ database",
  },
  {
    id: "safety",
    label: "Food Safety",
    icon: ShieldCheck,
    color: "emerald",
    accentBg: "bg-emerald-600 text-white",
    desc: "4-hour freshness cap & fail-closed gating",
  },
  {
    id: "kyc",
    label: "NGO Access",
    icon: HeartHandshake,
    color: "blue",
    accentBg: "bg-blue-600 text-white",
    desc: "100% free food access & 12A/80G KYC rules",
  },
  {
    id: "claiming",
    label: "Instant Claims",
    icon: Zap,
    color: "amber",
    accentBg: "bg-amber-600 text-white",
    desc: "1-tap exclusive batch reservations",
  },
  {
    id: "logistics",
    label: "Delivery Fleet",
    icon: Truck,
    color: "teal",
    accentBg: "bg-teal-600 text-white",
    desc: "Insulated transport & receipt confirmation",
  },
  {
    id: "sustainability",
    label: "ESG & Carbon",
    icon: Leaf,
    color: "purple",
    accentBg: "bg-purple-600 text-white",
    desc: "Audited greenhouse gas & meal formulas",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAudience, setSelectedAudience] = useState<string>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("safety-4-hour");
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const handleVoteHelpful = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpfulFeedback((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShareQuestion = (faq: FAQItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/help#${faq.id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(faq.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Filter FAQs based on search, selected category, and audience role
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory =
        selectedCategory === "all" || faq.category === selectedCategory;
      if (!matchesCategory) return false;

      const matchesAudience =
        selectedAudience === "all" ||
        faq.audience === selectedAudience ||
        faq.audience === "Everyone";
      if (!matchesAudience) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        faq.question.toLowerCase().includes(q) ||
        faq.summary.toLowerCase().includes(q) ||
        faq.takeaway.toLowerCase().includes(q) ||
        faq.laymanTip.toLowerCase().includes(q) ||
        faq.categoryLabel.toLowerCase().includes(q) ||
        faq.audience.toLowerCase().includes(q) ||
        faq.keyPoints.some(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.detail.toLowerCase().includes(q)
        ) ||
        faq.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory, selectedAudience]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <PublicNav />

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-18 sm:pb-22 border-b border-slate-200/80 bg-gradient-to-b from-emerald-50/60 via-white to-amber-50/20">
        {/* Luxury Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-emerald-100/50 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-12 right-10 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-sky-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Knowledge Base &amp; Food Safety Standards</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              How Can We{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 bg-clip-text text-transparent">
                Help You Today?
              </span>
            </h1>

            {/* Layman Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Simple, clear answers for kitchens, charities, and drivers. Learn how meals are safely saved, claimed for free, and delivered on time.
            </p>

            {/* Interactive Luxury Search Bar */}
            <div className="pt-4 max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
                  <div className="pl-4.5 text-slate-400">
                    <Search className="w-5 h-5 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any topic (e.g. 4-hour rule, free food for NGOs, pickup time, tax relief)..."
                    className="w-full px-4 py-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="pr-4 text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-400">Popular searches:</span>
                {["4-Hour Rule", "Free Meals", "Good Samaritan", "Pickup Time", "ESG Report"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setSearchQuery(chip)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100/80 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/70 transition-colors cursor-pointer font-medium"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* Quick Layman Guide: How ZeroPlate Works */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Layman Overview
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                How ZeroPlate Works in 3 Simple Steps
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              A seamless, zero-waste cycle connecting university &amp; hospital kitchens directly to local charities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/30 border border-emerald-100 relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  Step 01
                </span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                1. Kitchen Logs Surplus
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dining halls log wholesome extra food with preparation time. An automatic 4-hour countdown starts to ensure freshness.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-slate-50/30 border border-amber-100 relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  Step 02
                </span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                2. Shelter Claims in 1 Tap
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verified charities get instant alerts. When an NGO taps Claim, the batch is instantly locked exclusively — zero cost, no duplicate trips.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/50 via-white to-slate-50/30 border border-teal-100 relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
                  Step 03
                </span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                3. Fast Pickup &amp; Impact
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Food travels in insulated bags and reaches hungry families hot and fresh. Kitchens get certified carbon and ESG reports for free.
              </p>
            </div>
          </div>
        </section>

        {/* 6 Category Bento Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Browse By Department
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Explore Topic Categories
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORY_CARDS.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? "bg-white border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20 scale-[1.02]"
                      : "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
                        isSelected
                          ? cat.accentBg
                          : "bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                        {cat.label}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                        {cat.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                    <span className={isSelected ? "text-emerald-700 font-bold" : "text-slate-400 group-hover:text-slate-700"}>
                      {isSelected ? "Active View" : "Explore"}
                    </span>
                    <ArrowRight className={`w-3 h-3 transition-transform ${isSelected ? "text-emerald-700 translate-x-0.5" : "text-slate-400 group-hover:translate-x-1"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* FAQs Results Accordion */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {selectedCategory === "all"
                  ? "Frequently Asked Questions"
                  : `${CATEGORY_CARDS.find((c) => c.id === selectedCategory)?.label} Guidance`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Showing {filteredFaqs.length} guide{filteredFaqs.length === 1 ? "" : "s"}
                {selectedAudience !== "all" ? ` for ${selectedAudience}` : ""}
                {searchQuery ? ` matching "${searchQuery}"` : ""}
              </p>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-slate-400 shrink-0 hidden sm:inline">
                Role:
              </span>
              {[
                { id: "all", label: "All Roles" },
                { id: "Kitchens & Donors", label: "👨‍🍳 Kitchens" },
                { id: "NGOs & Shelters", label: "🤝 Shelters" },
                { id: "Delivery & Drivers", label: "🚚 Drivers" },
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedAudience(role.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedAudience === role.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {role.label}
                </button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenFaqId(null)}
                className="text-xs rounded-xl border-slate-200 hover:bg-slate-50 ml-1 shrink-0"
              >
                Collapse All
              </Button>
            </div>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  No matching guidance found
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Try adjusting your search terms or switch roles above to browse all available guides.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedAudience("all");
                }}
                className="rounded-xl text-xs"
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                const isVoted = helpfulFeedback[faq.id];
                return (
                  <div
                    key={faq.id}
                    id={faq.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? "bg-white border-emerald-400/80 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                        : "bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    {/* Accordion Question Header */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${faq.badgeColor}`}
                          >
                            {faq.categoryLabel}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {faq.audience}
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {faq.question}
                        </h4>
                        {!isOpen && (
                          <p className="text-xs text-slate-500 line-clamp-1 font-normal">
                            {faq.summary}
                          </p>
                        )}
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen ? "bg-emerald-100 text-emerald-800 rotate-180" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {/* Accordion Answer Body */}
                    {isOpen && (
                      <div className="px-5 pb-6 sm:px-6 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 space-y-4">
                        {/* 1. Quick Takeaway Banner */}
                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                              Quick Summary
                            </span>
                            <p className="text-xs sm:text-sm font-semibold text-emerald-950 leading-relaxed">
                              {faq.takeaway}
                            </p>
                          </div>
                        </div>

                        {/* 2. Structured Key Highlights */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Key Details &amp; Operational Rules
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {faq.keyPoints.map((point, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 space-y-1.5"
                              >
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{point.title}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {point.detail}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. Layman Tip Callout */}
                        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Lightbulb className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-xs text-amber-950 leading-relaxed">
                            <span className="font-bold text-amber-900">Layman Tip: </span>
                            {faq.laymanTip}
                          </p>
                        </div>

                        {/* Interactive Helpful & Share Footer */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-600">Was this clear &amp; helpful?</span>
                            <button
                              type="button"
                              onClick={(e) => handleVoteHelpful(faq.id, e)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                isVoted
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "border-slate-200 hover:bg-slate-100 text-slate-600"
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? "fill-emerald-600 text-emerald-600" : ""}`} />
                              <span>{isVoted ? "Helpful!" : "Yes, helpful"}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleShareQuestion(faq, e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            >
                              {copiedId === faq.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold">Link Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>Share Link</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Regulatory Safety Charter Trust Card */}
        <section className="p-8 sm:p-10 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-amber-50/20 shadow-xl shadow-slate-100 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full inline-block">
                  FSSAI &amp; Schedule 4 Compliance
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  National Food Safety Facilitator Charter
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  ZeroPlate operates as a certified technology facilitator. Every batch features automated 4-hour freshness clocks, tamper-evident digital timestamps, and immutable audit collections so donors and shelters remain 100% compliant.
                </p>
              </div>
            </div>

            <Button asChild size="sm" variant="outline" className="border-emerald-300 hover:bg-emerald-50 text-emerald-900 rounded-xl shrink-0">
              <Link href="/food-safety-policy" className="flex items-center gap-1.5 font-bold text-xs">
                <span>Read Full Policy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Luxury Direct Human Support Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C2420] via-[#22332A] to-[#16201A] text-white p-8 sm:p-12 shadow-2xl border border-emerald-500/20 text-center space-y-6">
          {/* Ambient luxury glow */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dedicated Human Support</span>
            </span>

            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Can&apos;t Find What You Need? We&apos;re Here to Help.
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed font-normal">
              Our food safety and technical operations specialists provide direct, personalized support to cafeteria managers, verified charities, and delivery drivers.
            </p>

            {/* Direct Email Pill */}
            <div className="pt-2">
              <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <a
                    href="mailto:aerska06@gmail.com"
                    className="font-mono text-sm sm:text-base text-emerald-300 font-bold hover:underline"
                  >
                    aerska06@gmail.com
                  </a>
                </div>
                <span className="hidden sm:inline text-white/30">•</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mon – Sat, 06:00 – 22:00 IST</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl px-7 py-5 cursor-pointer text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all">
                <Link href="/contact" className="flex items-center gap-2">
                  <span>Open Contact &amp; Support Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/20 hover:bg-white/10 text-white rounded-xl text-sm px-6 py-5 cursor-pointer transition-colors">
                <Link href="/app/institution/overview">Access Kitchen Console</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
