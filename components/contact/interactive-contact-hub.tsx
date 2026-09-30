"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  HeartHandshake,
  Truck,
  ShieldAlert,
  Mail,
  Copy,
  Check,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  PhoneCall,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function InteractiveContactHub() {
  const [selectedCategory, setSelectedCategory] = useState<
    "kitchen" | "ngo" | "logistics" | "safety" | "general"
  >("kitchen");

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [message, setMessage] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const primaryEmail = "aerska06@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(primaryEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const categories = [
    {
      id: "kitchen",
      label: "Kitchens & Donors",
      icon: Building2,
      color: "emerald",
      badge: "Commercial Kitchens",
      bgClass: "from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-900",
      activeTab: "bg-emerald-600 text-white shadow-emerald-600/25",
    },
    {
      id: "ngo",
      label: "NGOs & Shelters",
      icon: HeartHandshake,
      color: "blue",
      badge: "Community Relief",
      bgClass: "from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-900",
      activeTab: "bg-blue-600 text-white shadow-blue-600/25",
    },
    {
      id: "logistics",
      label: "Delivery & Drivers",
      icon: Truck,
      color: "amber",
      badge: "Fleet Dispatch",
      bgClass: "from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-900",
      activeTab: "bg-amber-600 text-white shadow-amber-600/25",
    },
    {
      id: "safety",
      label: "Food Safety Emergency",
      icon: ShieldAlert,
      color: "rose",
      badge: "24/7 Priority",
      bgClass: "from-rose-500/10 to-red-500/10 border-rose-500/30 text-rose-900",
      activeTab: "bg-rose-600 text-white shadow-rose-600/25",
    },
    {
      id: "general",
      label: "General Questions",
      icon: MessageSquare,
      color: "purple",
      badge: "Support Desk",
      bgClass: "from-purple-500/10 to-violet-500/10 border-purple-500/30 text-purple-900",
      activeTab: "bg-purple-600 text-white shadow-purple-600/25",
    },
  ];

  const categoryDetails = {
    kitchen: {
      title: "Commercial Kitchens & Food Donors",
      tagline: "Turn daily excess kitchen food into certified community impact.",
      bullets: [
        "Connect university dining halls, hospital cafeterias & banquet caterers",
        "Set up automated AI demand forecasting to prevent kitchen surplus",
        "Generate FSSAI-compliant tax relief & ESG carbon deduction receipts",
      ],
      defaultSubject: "Kitchen Partnership & Surplus Food Donation Inquiry",
      badgeText: "Solutions Engineering",
      responseTime: "Response in < 2 hours",
    },
    ngo: {
      title: "Verified NGOs, Food Banks & Shelters",
      tagline: "Receive fresh, dignified, 100% free surplus meals delivered to your door.",
      bullets: [
        "12A / 80G verification and speedy onboarding support",
        "Expand regional service radius and daily plate intake capacity",
        "Exclusive 1-tap food claim locks — zero phantom reservations",
      ],
      defaultSubject: "NGO KYC & Recipient Food Access Inquiry",
      badgeText: "Community Welfare",
      responseTime: "Response in < 2 hours",
    },
    logistics: {
      title: "Logistics, Couriers & Delivery Fleet",
      tagline: "Smooth, rapid refrigerated and insulated dispatch coordination.",
      bullets: [
        "Support with active route assignments and GPS pickup waypoints",
        "Thermal delivery box protocols & temperature seal guidance",
        "Vehicle assignment, partner onboarding, and dispatch troubleshooting",
      ],
      defaultSubject: "Logistics & Driver Fleet Support Inquiry",
      badgeText: "Fleet Operations",
      responseTime: "Response in < 15 minutes",
    },
    safety: {
      title: "Food Safety Gating & Incident Escalation",
      tagline: "Strict 4-hour freshness lock and cold-chain compliance desk.",
      bullets: [
        "Immediate batch recall and safety threshold audits",
        "FSSAI Schedule 4 sanitary checklist questions",
        "Good Samaritan statutory legal protection guidance",
      ],
      defaultSubject: "URGENT: Food Safety Gating Escalation",
      badgeText: "24/7 Monitored Queue",
      responseTime: "Immediate Attention (24/7)",
    },
    general: {
      title: "General Platform Questions & Feedback",
      tagline: "We're always here to listen, partner, and help anyone in the community.",
      bullets: [
        "Learn how ZeroPlate works for colleges and corporate campuses",
        "Press, research collaborations, and municipal municipal partnerships",
        "Suggestions and platform feature requests",
      ],
      defaultSubject: "General Inquiry - ZeroPlate.ai",
      badgeText: "General Support",
      responseTime: "Response in < 2 hours",
    },
  };

  const currentDetail = categoryDetails[selectedCategory];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    // Build mailto link so it directly opens the email client
    const subject = encodeURIComponent(
      `[ZeroPlate ${categories.find((c) => c.id === selectedCategory)?.label}] ${orgName ? `${orgName} - ` : ""}${currentDetail.defaultSubject}`
    );
    const body = encodeURIComponent(
      `Hi ZeroPlate Support Team,\n\nName: ${name}\nEmail: ${email}\nOrganization: ${orgName || "N/A"}\nDepartment: ${categories.find((c) => c.id === selectedCategory)?.label}\n\nMessage:\n${message}\n\n---\nSent via ZeroPlate.ai Interactive Contact Portal`
    );

    window.location.href = `mailto:${primaryEmail}?subject=${subject}&body=${body}`;
  };

  const quickFaqs = [
    {
      q: "Is there any cost for non-profits or community shelters to receive food?",
      a: "None whatsoever. All redistributed surplus food is 100% free forever for verified shelters, orphanages, and community food banks. ZeroPlate charges zero delivery or subscription fees to charitable organizations.",
    },
    {
      q: "How fast does an institutional pickup take place?",
      a: "Once an institutional kitchen posts a surplus ticket, verified nearby NGOs are alerted instantly. Courier pickup is matched within minutes, with average gate arrival between 30 to 60 minutes within safe temperature limits.",
    },
    {
      q: "Are commercial food donors protected legally if they donate extra food?",
      a: "Yes. Under official Food Safety regulations and Good Samaritan statutory guidelines, bona fide commercial food donors who donate wholesome food in good faith through certified audit checkpoints are shielded from civil liability.",
    },
    {
      q: "What types of institutions can register to donate surplus food?",
      a: "Any licensed commercial or institutional facility, including university dining halls, hospital cafeterias, corporate office pantries, hotel banquets, wedding caterers, and food processing factories.",
    },
  ];

  return (
    <div className="space-y-16">
      {/* Top Interactive Category Selector */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Select Your Inquiry Category</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Can We Assist You Today?
          </h2>
          <p className="text-sm text-slate-600">
            Choose your organization type for direct routing to our dedicated support specialists.
          </p>
        </div>

        {/* Tab Pills in a Single Straight Line */}
        <div className="w-full flex items-center justify-center overflow-x-auto py-2 px-2">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-xs shrink-0 flex-nowrap">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id as any);
                    setFormSubmitted(false);
                  }}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? `${cat.activeTab} shadow-md scale-102`
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-500"}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main 2-Column Split: Dynamic Department Info + Quick Message Form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focused Department Card */}
        <div className="lg:col-span-6 space-y-6">
          <div
            className={`p-7 sm:p-8 rounded-3xl border bg-gradient-to-br ${currentDetail.badgeText.includes("24/7") ? "from-rose-50/70 via-white to-red-50/40 border-rose-200/80 shadow-rose-100" : "from-emerald-50/70 via-white to-amber-50/30 border-slate-200/90 shadow-slate-100"} shadow-xl transition-all duration-300 relative overflow-hidden`}
          >
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-2xl pointer-events-none -z-10" />

            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-white shadow-2xs">
                {currentDetail.badgeText}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>{currentDetail.responseTime}</span>
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {currentDetail.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
              {currentDetail.tagline}
            </p>

            {/* Crisp Feature Bullets */}
            <div className="mt-6 pt-6 border-t border-slate-200/80 space-y-3">
              {currentDetail.bullets.map((b, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{b}</span>
                </div>
              ))}
            </div>

            {/* Direct Official Contact Box */}
            <div className="mt-8 p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-wider font-semibold">Official Contact Channel</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Direct Monitored Inbox
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-sm sm:text-base font-bold text-emerald-300 truncate">
                    {primaryEmail}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEmail}
                    className="border-slate-700 hover:bg-slate-800 text-white text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    <a href={`mailto:${primaryEmail}?subject=${encodeURIComponent(currentDetail.defaultSubject)}`}>
                      <span>Write Email</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Good Samaritan Shield</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Full donor immunity under verified FSSAI guidelines.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Zero Platform Fees</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                100% free food access for non-profits and charities.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Quick Message Dispatcher */}
        <div className="lg:col-span-6">
          <div className="p-7 sm:p-8 rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-100 relative">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Express Inquiry
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5">
                  Send a Direct Message
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                <Send className="w-4 h-4" />
              </div>
            </div>

            {formSubmitted ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-slate-900">Email Draft Prepared!</h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                    Your inquiry has been formulated and directed to{" "}
                    <strong className="text-emerald-700">{primaryEmail}</strong>. If your mail app did not open automatically, click the button below.
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 py-2.5"
                  >
                    <a
                      href={`mailto:${primaryEmail}?subject=${encodeURIComponent(
                        `[ZeroPlate] ${orgName ? `${orgName} - ` : ""}${currentDetail.defaultSubject}`
                      )}&body=${encodeURIComponent(
                        `Hi ZeroPlate Support,\n\nName: ${name}\nEmail: ${email}\nOrg: ${orgName || "N/A"}\nMessage:\n${message}`
                      )}`}
                    >
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      <span>Open Mail Client Again</span>
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormSubmitted(false);
                      setMessage("");
                    }}
                    className="text-xs rounded-xl"
                  >
                    Send Another Note
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="mt-6 space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. priya@organization.org"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Organization / Facility Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Apex Hospital Dining / Green Care Foundation"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    How Can We Help You? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Describe your kitchen volume, shelter intake needs, or any questions for our ${categories.find((c) => c.id === selectedCategory)?.label} team...`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer text-sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  <span>Send Inquiry to {primaryEmail}</span>
                </Button>

                <p className="text-[11px] text-center text-slate-500">
                  🔒 We respect your privacy. No spam. You will receive a direct reply to your email.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 4 Dedicated Cards Grid for Quick Scan */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Dedicated Specialized Desks
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Direct Department Channels
          </h3>
          <p className="text-sm text-slate-600">
            Every request is directly triaged by specialists in food safety, logistics, and non-profit welfare.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Kitchens */}
          <div className="p-6 rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 via-white to-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left group">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full inline-block">
                For Kitchens
              </span>
              <h4 className="text-lg font-bold text-slate-900">
                Enterprise &amp; Donors
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect university cafeterias, hotel kitchens, and corporate dining halls for daily automated surplus pickups.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
              <div className="font-mono text-xs font-bold text-emerald-800 break-all">
                {primaryEmail}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>Mon-Sat • 06:00 - 22:00 IST</span>
              </div>
            </div>
          </div>

          {/* Card 2: NGOs */}
          <div className="p-6 rounded-3xl border border-blue-200/80 bg-gradient-to-b from-blue-50/40 via-white to-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left group">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full inline-block">
                For Charities
              </span>
              <h4 className="text-lg font-bold text-slate-900">
                NGO KYC &amp; Verification
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get non-profit 12A/80G credentials approved, expand delivery territory, or schedule bulk refrigerated shipments.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
              <div className="font-mono text-xs font-bold text-blue-800 break-all">
                {primaryEmail}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                <span>100% Free Food Support</span>
              </div>
            </div>
          </div>

          {/* Card 3: Logistics */}
          <div className="p-6 rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left group">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full inline-block">
                For Logistics
              </span>
              <h4 className="text-lg font-bold text-slate-900">
                Dispatch &amp; Fleet Operations
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live driver route navigation, thermal container handling, and batch gate verification support.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
              <div className="font-mono text-xs font-bold text-amber-800 break-all">
                {primaryEmail}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-600" />
                <span>Immediate Dispatch Help</span>
              </div>
            </div>
          </div>

          {/* Card 4: Food Safety Emergency */}
          <div className="p-6 rounded-3xl border border-rose-200/80 bg-gradient-to-b from-rose-50/40 via-white to-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left group">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full inline-block">
                24/7 Priority
              </span>
              <h4 className="text-lg font-bold text-slate-900">
                Food Safety Emergency
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Urgent cold-chain deviations, strict 4-hour cooking lockouts, or immediate safety recalls.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
              <div className="font-mono text-xs font-bold text-rose-700 break-all">
                {primaryEmail}
              </div>
              <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>24/7 Priority Monitored</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layman-Friendly FAQ Accordion */}
      <section className="p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-100/60 text-left space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Common Questions
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Short, crystal-clear answers to common queries for first-time donors and shelters.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 hover:bg-slate-50 shrink-0">
            <Link href="/help" className="flex items-center gap-1.5">
              <span>View Full Help Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickFaqs.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div
                key={i}
                onClick={() => setActiveFaq(isOpen ? null : i)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isOpen
                    ? "bg-emerald-50/40 border-emerald-300 shadow-sm"
                    : "bg-slate-50/50 hover:bg-slate-50 border-slate-200/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {faq.q}
                  </h4>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 mt-0.5 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-emerald-700" : ""
                    }`}
                  />
                </div>
                {isOpen && (
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Luxury Help Center & Knowledge Base Banner */}
      <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#1C2420] via-[#24332B] to-[#141A17] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Instant Knowledge Base
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Prefer Searching for Quick Guides?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Check our searchable Help Center covering food safety regulations, NGO onboarding criteria, step-by-step donation guides, and driver handover protocols.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            asChild
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-5 rounded-xl shadow-lg transition-all cursor-pointer text-sm"
          >
            <Link href="/help" className="flex items-center gap-2">
              <span>Open Help Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/20 hover:bg-white/10 text-white font-semibold px-5 py-5 rounded-xl transition-all cursor-pointer text-sm"
          >
            <Link href="/food-safety-policy">Safety Guidelines</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
