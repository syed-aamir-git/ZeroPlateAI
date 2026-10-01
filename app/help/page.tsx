"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  ThumbsDown,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
  Share2,
  Check,
} from "lucide-react";

interface FAQItem {
  id: string;
  category: "safety" | "kyc" | "claiming" | "logistics" | "sustainability";
  categoryLabel: string;
  question: string;
  summary: string;
  answer: string;
  tags: string[];
  badgeColor: string;
}

const INITIAL_FEEDBACK_COUNTS: Record<string, { helpful: number; unhelpful: number }> = {
  "safety-4-hour": { helpful: 48, unhelpful: 2 },
  "safety-fail-closed": { helpful: 34, unhelpful: 1 },
  "safety-legal-protection": { helpful: 41, unhelpful: 0 },
  "kyc-free-meals": { helpful: 56, unhelpful: 1 },
  "kyc-approval-process": { helpful: 39, unhelpful: 2 },
  "kyc-unapproved-claim": { helpful: 27, unhelpful: 1 },
  "claims-race-condition": { helpful: 45, unhelpful: 1 },
  "claims-smart-matching": { helpful: 32, unhelpful: 0 },
  "logistics-courier-pickup": { helpful: 38, unhelpful: 2 },
  "logistics-recipient-confirm": { helpful: 29, unhelpful: 1 },
  "reports-co2-formula": { helpful: 43, unhelpful: 2 },
  "reports-free-export": { helpful: 37, unhelpful: 0 },
};

const FAQS: FAQItem[] = [
  // 1. Food Safety & Gating
  {
    id: "safety-4-hour",
    category: "safety",
    categoryLabel: "Food Safety",
    question: "What is the 4-Hour Rule for cooked surplus food?",
    summary: "Cooked meals must be picked up within 4 hours of cooking to guarantee safety and freshness.",
    answer:
      "Under national FSSAI food-safety standards and ZeroPlate rules, all freshly cooked meals (rice, curries, lentils, rotis) must be collected and dispatched within 4 hours of cooking completion. Our system automatically checks the preparation timestamp when a kitchen logs surplus — if the 4-hour window has passed, the listing is automatically locked out to protect community health.",
    tags: ["safety", "4-hour", "freshness", "cooked food", "fssai", "temperature"],
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "safety-fail-closed",
    category: "safety",
    categoryLabel: "Food Safety",
    question: "What happens if a safety check encounters an error or missing detail?",
    summary: "Our system operates on a zero-tolerance 'fail-closed' policy — unverified food is never listed.",
    answer:
      "Safety is never treated as an afterthought. If an ingredient list is incomplete, a cooking timestamp cannot be confirmed, or a network glitch occurs, ZeroPlate automatically rejects the listing. We never allow unverified surplus to go live. Food must pass 100% of safety criteria before any charity can claim it.",
    tags: ["fail-closed", "zero-tolerance", "safety check", "rejection", "quality"],
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "safety-legal-protection",
    category: "safety",
    categoryLabel: "Food Safety",
    question: "Are commercial kitchens and food donors legally protected when donating?",
    summary: "Yes. Donors who donate safe surplus in good faith are fully shielded under Good Samaritan legal norms.",
    answer:
      "Many kitchens used to discard wholesome food out of liability fears. Under official Food Safety regulations and statutory Good Samaritan guidelines, commercial donors who donate surplus food in good faith through certified audit checkpoints are shielded from civil liability. Every donation creates a digital chain-of-custody timestamp proving proper hygiene.",
    tags: ["legal", "good samaritan", "liability", "donor protection", "law"],
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },

  // 2. NGO Verification & Free Food Access
  {
    id: "kyc-free-meals",
    category: "kyc",
    categoryLabel: "NGO Access",
    question: "Is there any cost for charities and shelters to receive food?",
    summary: "100% Free forever. Charities and non-profits never pay a single rupee for food or delivery.",
    answer:
      "Food rescue should never be an administrative burden for non-profits. Verified charities, orphanages, homeless shelters, and community kitchens receive fresh hot meals delivered directly to their facilities with zero subscription, food, or delivery charges.",
    tags: ["free", "cost", "charity", "shelters", "zero fee", "non-profit"],
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "kyc-approval-process",
    category: "kyc",
    categoryLabel: "NGO Access",
    question: "How does a non-profit or shelter get approved to claim food?",
    summary: "A quick 1-time verification validates your non-profit registration (12A/80G) and capacity.",
    answer:
      "To protect donor kitchens and ensure wholesome distribution, every receiving organization undergoes a quick KYC check. Non-profits provide their NGO registration details (e.g. 12A/80G, DARPAN ID), primary location, daily plate capacity, and an emergency contact. Verification is typically reviewed and completed by our team within 24 hours.",
    tags: ["kyc", "approval", "verification", "registration", "12a", "80g"],
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "kyc-unapproved-claim",
    category: "kyc",
    categoryLabel: "NGO Access",
    question: "Can an unverified organization or private individual claim food?",
    summary: "No. Surplus food is reserved exclusively for officially verified non-profit shelters.",
    answer:
      "Surplus food is never made public to unverified individuals or commercial entities. Only registered charities that have successfully completed hygiene and identity verification can view and claim available batches. This prevents resale and ensures food reaches genuinely hungry families.",
    tags: ["unverified", "security", "exclusive", "shelter", "eligibility"],
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },

  // 3. Instant Claiming & Redistribution
  {
    id: "claims-race-condition",
    category: "claiming",
    categoryLabel: "Instant Claims",
    question: "How does ZeroPlate prevent two charities from claiming the same batch?",
    summary: "With 1-tap exclusive digital locking. Once claimed, a batch is immediately locked to that shelter.",
    answer:
      "Shelters should never travel across the city only to find someone else took the food. The exact millisecond an approved NGO clicks 'Claim Food', the database places an exclusive atomic lock on that surplus ticket. If another non-profit clicks at the same time, the system alerts them that the batch is already assigned and suggests nearby alternatives.",
    tags: ["exclusive lock", "duplicate claims", "atomic lock", "instant reservation"],
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "claims-smart-matching",
    category: "claiming",
    categoryLabel: "Instant Claims",
    question: "How does ZeroPlate match which shelter receives which food batch?",
    summary: "Our smart proximity engine pairs donations based on travel distance and shelter capacity.",
    answer:
      "Our automated matching engine evaluates three primary factors: distance (pairing the closest verified shelter to keep travel time minimal), capacity fit (ensuring a 200-meal donation goes to a shelter that can actually distribute 200 meals), and reliable past receipt history. This ensures hot food arrives fresh without delay.",
    tags: ["smart match", "algorithm", "proximity", "distance", "capacity"],
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
  },

  // 4. Logistics & Delivery Fleet
  {
    id: "logistics-courier-pickup",
    category: "logistics",
    categoryLabel: "Logistics",
    question: "Who delivers the food from the donor kitchen to the shelter?",
    summary: "Deliveries are handled by the shelter's own vehicles or our verified partner courier fleet.",
    answer:
      "Depending on the batch size and distance, redistributions are handled either by the non-profit's dedicated vans or by registered ZeroPlate delivery partners equipped with insulated thermal carriers. The delivery status is tracked live through every milestone: Assigned → Accepted → Picked Up → Delivered → Confirmed.",
    tags: ["delivery", "driver", "transport", "courier", "logistics", "thermal bag"],
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
  },
  {
    id: "logistics-recipient-confirm",
    category: "logistics",
    categoryLabel: "Logistics",
    question: "Why must the shelter confirm receipt on their phone upon delivery?",
    summary: "Recipient confirmation provides digital proof of hygiene and closes the loop.",
    answer:
      "When the courier reaches the shelter, the NGO coordinator inspects the sealed containers and taps 'Confirm Delivery' on their dashboard. This single step confirms the food arrived safely, releases carbon reduction credits to the donor kitchen, and logs an immutable audit receipt.",
    tags: ["confirmation", "receipt", "audit", "delivery closure", "handover"],
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
  },

  // 5. Carbon Savings & ESG Reports
  {
    id: "reports-co2-formula",
    category: "sustainability",
    categoryLabel: "ESG & Carbon",
    question: "How are meal counts and carbon (CO2e) reduction numbers calculated?",
    summary: "Using official FAO and UNEP environmental benchmarks: 2.5 meals/kg and 1.8 kg CO2e saved/kg.",
    answer:
      "Every diverted kilogram is tracked transparently: meals rescued are calculated at 2.5 meals per kilogram (standard 400g nutritious portion based on FAO standards). Greenhouse gas emissions avoided are calculated at 1.8 kg CO2e avoided per kilogram of organic waste diverted from municipal landfills. Water conservation is estimated at 850 liters per kilogram.",
    tags: ["co2e", "carbon", "metrics", "formula", "meals rescued", "fao", "unep"],
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    id: "reports-free-export",
    category: "sustainability",
    categoryLabel: "ESG & Carbon",
    question: "Can commercial kitchens download certified ESG and CSR reports for free?",
    summary: "Yes. All kitchens receive free downloadable audit reports, CSV logs, and tax relief records.",
    answer:
      "Every registered facility can download Scope 3 Category 5 GHG accounting logs, monthly waste diversion metrics, and FSSAI hygiene audit summaries in 1 click from their Kitchen Console. These documents provide verifiable proof for CSR spending and corporate sustainability disclosures.",
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
    label: "NGO Verification",
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
  const [openFaqId, setOpenFaqId] = useState<string | null>("safety-4-hour");
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, "yes" | "no">>({});
  const [feedbackCounts, setFeedbackCounts] = useState<Record<string, { helpful: number; unhelpful: number }>>(INITIAL_FEEDBACK_COUNTS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load saved votes from localStorage and latest aggregate counts from API
  useEffect(() => {
    try {
      const savedVotes = localStorage.getItem("zeroplate_help_faq_votes");
      if (savedVotes) {
        setHelpfulFeedback(JSON.parse(savedVotes));
      }
    } catch (e) {
      console.error("Failed to load saved votes from localStorage", e);
    }

    fetch("/api/v1/help/feedback")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.counts) {
          setFeedbackCounts((prev) => ({
            ...prev,
            ...data.counts,
          }));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch latest feedback counts, using baseline", err);
      });
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const handleVoteHelpful = async (id: string, vote: "yes" | "no", e: React.MouseEvent) => {
    e.stopPropagation();

    const currentVote = helpfulFeedback[id];
    let newVote: "yes" | "no" | null = null;
    let action: "yes" | "no" | "clear" = vote;

    if (currentVote === vote) {
      newVote = null;
      action = "clear";
    } else {
      newVote = vote;
      action = vote;
    }

    // 1. Update personal feedback state and localStorage immediately
    const updatedFeedback = { ...helpfulFeedback };
    if (newVote === null) {
      delete updatedFeedback[id];
    } else {
      updatedFeedback[id] = newVote;
    }
    setHelpfulFeedback(updatedFeedback);
    try {
      localStorage.setItem("zeroplate_help_faq_votes", JSON.stringify(updatedFeedback));
    } catch (err) {
      console.error("Failed to save vote to localStorage", err);
    }

    // 2. Optimistically update displayed counts
    setFeedbackCounts((prev) => {
      const existing = prev[id] || INITIAL_FEEDBACK_COUNTS[id] || { helpful: 0, unhelpful: 0 };
      let hDelta = 0;
      let uDelta = 0;

      if (action === "yes") {
        if (currentVote === "no") uDelta = -1;
        hDelta = 1;
      } else if (action === "no") {
        if (currentVote === "yes") hDelta = -1;
        uDelta = 1;
      } else if (action === "clear") {
        if (currentVote === "yes") hDelta = -1;
        if (currentVote === "no") uDelta = -1;
      }

      return {
        ...prev,
        [id]: {
          helpful: Math.max(0, existing.helpful + hDelta),
          unhelpful: Math.max(0, existing.unhelpful + uDelta),
        },
      };
    });

    // 3. Persist to API
    try {
      const res = await fetch("/api/v1/help/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faqId: id,
          vote: action,
          previousVote: currentVote || null,
        }),
      });
      const data = await res.json();
      if (data?.success && data?.counts) {
        setFeedbackCounts((prev) => ({
          ...prev,
          [id]: data.counts,
        }));
      }
    } catch (err) {
      console.warn("Failed to sync vote with server:", err);
    }
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

  // Filter FAQs based on search and selected category
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory =
        selectedCategory === "all" || faq.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        faq.question.toLowerCase().includes(q) ||
        faq.summary.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.categoryLabel.toLowerCase().includes(q) ||
        faq.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

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
              Clear, friendly answers to common questions about safe food donations, shelter meal pickups, Good Samaritan laws, and carbon ledger reports.
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
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
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
                  onClick={() => {
                    const next = selectedCategory === cat.id && cat.id !== "all" ? "all" : cat.id;
                    setSelectedCategory(next);
                    const first = FAQS.find((f) => next === "all" || f.category === next);
                    if (first) setOpenFaqId(first.id);
                  }}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {selectedCategory === "all"
                  ? "All Frequently Asked Questions"
                  : `${CATEGORY_CARDS.find((c) => c.id === selectedCategory)?.label} Guidance`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Showing {filteredFaqs.length} guide{filteredFaqs.length === 1 ? "" : "s"}
                {searchQuery ? ` matching "${searchQuery}"` : ""}
              </p>
            </div>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  No matching guidance found for &quot;{searchQuery}&quot;
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Try searching with terms like &quot;4-hour&quot;, &quot;NGO&quot;, &quot;delivery&quot;, &quot;free&quot;, or browse our categories above.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="rounded-xl text-xs"
              >
                Reset Search Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                const currentVote = helpfulFeedback[faq.id];
                const counts = feedbackCounts[faq.id] || INITIAL_FEEDBACK_COUNTS[faq.id] || { helpful: 0, unhelpful: 0 };
                return (
                  <div
                    key={faq.id}
                    id={faq.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? "bg-white border-emerald-300 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                        : "bg-white hover:bg-slate-50/80 border-slate-200/90"
                    }`}
                  >
                    {/* Accordion Question Header */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${faq.badgeColor}`}
                          >
                            {faq.categoryLabel}
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
                      <div className="px-5 pb-6 sm:px-6 pt-1 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 space-y-4">
                        <p className="text-sm text-slate-700 leading-relaxed font-normal">
                          {faq.answer}
                        </p>

                        {/* Interactive Helpful & Share Footer */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-600">Was this helpful?</span>
                            <button
                              type="button"
                              onClick={(e) => handleVoteHelpful(faq.id, "yes", e)}
                              aria-label={`Helpful (${counts.helpful})`}
                              title="Helpful"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                currentVote === "yes"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                                  : "border-slate-200 hover:bg-slate-100 text-slate-600"
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${currentVote === "yes" ? "fill-emerald-600 text-emerald-600" : ""}`} />
                              <span className="tabular-nums text-xs">{counts.helpful}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleVoteHelpful(faq.id, "no", e)}
                              aria-label={`Not helpful (${counts.unhelpful})`}
                              title="Not helpful"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                currentVote === "no"
                                  ? "bg-rose-50 text-rose-800 border-rose-300 shadow-2xs"
                                  : "border-slate-200 hover:bg-slate-100 text-slate-600"
                              }`}
                            >
                              <ThumbsDown className={`w-3.5 h-3.5 ${currentVote === "no" ? "fill-rose-600 text-rose-600" : ""}`} />
                              <span className="tabular-nums text-xs">{counts.unhelpful}</span>
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
