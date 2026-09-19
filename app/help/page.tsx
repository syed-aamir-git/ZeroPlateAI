"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon } from "@/components/icons/ledger-icons";

interface FAQItem {
  category: string;
  question: string;
  answer: string;
  tags?: string[];
}

const FAQS: FAQItem[] = [
  {
    category: "Food Safety & Gating",
    question: "What is the 4-hour safety rule for cooked surplus food?",
    answer:
      "Under FSSAI guidelines and ZeroPlate safety rules, prepared cooked foods (rice, curries, cooked pulses, breads) must be collected and dispatched within 4 hours of cooking completion. Our automated server-side safety gating engine strictly evaluates the cooking timestamp and rejects any listing whose pickup window exceeds this threshold.",
    tags: ["safety", "4-hour", "cooked", "temperature", "fssai"],
  },
  {
    category: "Food Safety & Gating",
    question: "What happens if a safety gating check encounters an error?",
    answer:
      "ZeroPlate operates under a strict 'fail-closed' policy. If a safety threshold check encounters an exception, database timeout, or cannot verify the preparation timestamp, the listing is blocked from publishing by default (HTTP 422). We never allow unverified listings to go live.",
    tags: ["fail-closed", "error", "safety", "rejection"],
  },
  {
    category: "Food Safety & Gating",
    question: "How can Platform Admins configure safety thresholds?",
    answer:
      "Platform Administrators can dynamically configure food-safety rules via the restricted /app/admin/safety-rules console. Changes (e.g. cooked food maximum hours or expiry warning thresholds) take effect immediately across all newly evaluated inventory items and listings.",
    tags: ["admin", "thresholds", "rules", "configuration"],
  },
  {
    category: "NGO Verification & KYC",
    question: "Why do NGO accounts start in 'KYC Pending' status?",
    answer:
      "To protect donor kitchens from liability and maintain high food-safety standards, all recipient organizations must be verified by a Platform Administrator before they can claim listings. Verification validates non-profit registration numbers, service areas, storage capacity, and emergency contacts.",
    tags: ["kyc", "ngo", "verification", "pending", "status"],
  },
  {
    category: "NGO Verification & KYC",
    question: "Can an unapproved NGO claim surplus food?",
    answer:
      "No. Even if an unapproved NGO attempts to claim food directly via API or interface, the server strictly blocks the request with HTTP 403 Forbidden under Section 12.8 of the Food Safety Policy until a Platform Admin reviews and approves their registration.",
    tags: ["gating", "claim", "unapproved", "403", "forbidden"],
  },
  {
    category: "Redistribution & Claims",
    question: "How does ZeroPlate prevent duplicate claims or race conditions?",
    answer:
      "When an NGO claims a listing, an atomic MongoDB findOneAndUpdate query locks the surplus item exclusively to that organization. If multiple non-profits click simultaneously, exactly one succeeds and the other receives an HTTP 409 Conflict notification.",
    tags: ["race-condition", "atomic", "claim", "locking", "concurrency"],
  },
  {
    category: "Redistribution & Claims",
    question: "How are surplus matches scored and prioritized?",
    answer:
      "The server-side matching engine ranks eligible approved NGOs using a weighted multi-factor formula: 45% proximity (Haversine distance), 35% capacity fit (daily intake capacity vs surplus batch volume), and 20% NGO reliability score based on completed pickups.",
    tags: ["matching", "algorithm", "ranking", "score", "proximity"],
  },
  {
    category: "Logistics & Delivery",
    question: "Who coordinates and executes the food delivery?",
    answer:
      "Redistributions are coordinated either through the recipient non-profit's dedicated transport or via ZeroPlate's lightweight network of registered delivery partners. Status transitions follow the step lifecycle: assigned → accepted → picked_up → delivered → confirmed.",
    tags: ["delivery", "logistics", "courier", "driver", "transport"],
  },
  {
    category: "Logistics & Delivery",
    question: "Why is recipient confirmation required to close a delivery?",
    answer:
      "The recipient organization must explicitly confirm receipt on their claims dashboard to close the loop. This confirms that the food arrived safely in acceptable condition, releases impact credits to the donor kitchen, and permanently logs the transaction.",
    tags: ["confirmation", "close-loop", "receipt", "impact"],
  },
  {
    category: "Sustainability & Reports",
    question: "What conversion factors are used for CO2e and meal metrics?",
    answer:
      "Meals are calculated at 2.5 meals per kg (0.4 kg / 400g per portion, FAO reference). Avoided greenhouse gas emissions are calculated at 1.9 kg CO2e per kg of food diverted from landfills (UNEP Food Wastage Footprint reference). Cost savings are estimated at ₹120 per kg of prepared food.",
    tags: ["co2e", "meals", "conversion", "formula", "sustainability", "fao"],
  },
  {
    category: "Sustainability & Reports",
    question: "What is included in the free ESG audit report export?",
    answer:
      "All registered institutions receive complete Scope 3 Category 5 GHG accounting reports, downloadable CSV transaction logs, FSSAI-compliant chain-of-custody timestamps, and certified documentation for CSR tax deductions at zero cost.",
    tags: ["esg", "reports", "export", "csv", "free", "scope-3"],
  },
];

const CATEGORIES = [
  "All",
  "Food Safety & Gating",
  "NGO Verification & KYC",
  "Redistribution & Claims",
  "Logistics & Delivery",
  "Sustainability & Reports",
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;

    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q) ||
      (faq.tags && faq.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-ledger-paper text-ink">
      <PublicNav />

      {/* Header Section */}
      <section className="border-b border-line pt-14 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-left">
          <span className="font-mono text-xs uppercase tracking-widest text-ink-soft block mb-2">
            Support Center & Food Safety Charter
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink leading-tight tracking-tight">
            Operational standards, food safety policies, and technical documentation.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-ink-soft leading-relaxed max-w-2xl font-sans">
            Clear, searchable guidance on automated safety gating, KYC verification protocols, 
            delivery lifecycles, and liability protections.
          </p>

          {/* Search Bar Input */}
          <div className="mt-6 max-w-xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search safety rules, KYC protocols, 4-hour window, ESG export..."
                className="w-full px-4 py-3 pl-11 rounded-md border border-line bg-ledger-surface text-ink placeholder:text-ink-soft text-sm focus:outline-none focus:ring-1 focus:ring-basil shadow-xs"
              />
              <div className="absolute left-3.5 top-3.5 text-ink-soft">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3.5 text-xs text-ink-soft hover:text-ink cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Safety Charter Callout */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 border-b border-line bg-ledger-paper">
        <div className="max-w-4xl mx-auto border border-line bg-[#FAF6EE] p-5 rounded-md flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left">
          <div className="w-10 h-10 rounded bg-basil/15 text-basil flex items-center justify-center shrink-0">
            <ShieldCheckIcon size={22} />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-base font-bold text-ink">
              FSSAI & Regulatory Facilitator Safety Charter
            </h2>
            <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
              ZeroPlate operates as a technology facilitator under national food-safety guidelines. Automated fail-closed safety gating, KYC-verified recipient organizations, and immutable audit logs ensure complete chain-of-custody transparency.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs and Search Results */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-4xl mx-auto text-left space-y-6">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? "bg-basil text-[#FAF7F2]"
                    : "bg-ledger-surface border border-line text-ink-soft hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-ink-soft pt-2">
            <span>
              Showing {filteredFaqs.length} result{filteredFaqs.length === 1 ? "" : "s"}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </span>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="text-basil hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="border border-line bg-ledger-surface p-10 text-center rounded-md space-y-3">
                <p className="text-sm font-semibold text-ink">
                  No matching guidance found for &quot;{searchQuery}&quot;
                </p>
                <p className="text-xs text-ink-soft max-w-sm mx-auto">
                  Try searching with broader terms like &quot;safety&quot;, &quot;KYC&quot;, &quot;delivery&quot;, or &quot;CO2e&quot;.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-basil underline pt-1 cursor-pointer"
                >
                  Clear search query
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-line bg-[#FAF6EE] p-5 rounded-md space-y-1.5 hover:border-line/80 transition-colors"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-basil font-bold block">
                    {faq.category}
                  </span>
                  <h3 className="font-serif text-base font-bold text-ink">
                    {faq.question}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed pt-1">
                    {faq.answer}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Direct Support Contact Box */}
          <div className="border border-line bg-[#FAF6EE] p-6 sm:p-8 rounded-md mt-12 text-center space-y-3">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink">
              Need direct assistance with an institutional deployment?
            </h3>
            <p className="text-xs sm:text-sm text-ink-soft max-w-md mx-auto">
              Our food safety and technical operations team provides direct support to institutional kitchen administrators, NGOs, and delivery coordinators.
            </p>
            <div className="pt-2">
              <span className="font-mono text-xs sm:text-sm text-basil font-semibold block">
                operations@zeroplate.ai · +91 11 4092 8800
              </span>
              <span className="text-[11px] text-ink-soft mt-0.5 block">
                Operational Support Hours: Monday – Saturday, 06:00 – 22:00 IST
              </span>
            </div>
            <div className="pt-3 flex items-center justify-center gap-3">
              <Button asChild variant="default" size="sm">
                <Link href="/app/institution/overview">Access Kitchen Console</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/app/notifications">View Notifications</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
