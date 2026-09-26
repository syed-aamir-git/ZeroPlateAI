import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { Button } from "@/components/ui/button";
import { HowItWorksSection } from "@/components/public/how-it-works-section";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Utensils,
  Scale,
  Leaf,
  Building2,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  HeartHandshake,
  Truck,
  HelpCircle,
  FileCheck2,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "How It Works | ZeroPlate.ai",
  description: "Learn how ZeroPlate connects institutional kitchens with verified charities to rescue fresh surplus food in 4 simple steps.",
};

export default function HowItWorksPage() {
  const faqs = [
    {
      q: "How do you guarantee that the surplus food is fresh and safe?",
      a: "ZeroPlate enforces strict, automated food safety rules. Cooked hot food must be logged within its safe thermal window (under 4 hours). If any batch violates hygiene or temperature guidelines, our system blocks it automatically from listing.",
    },
    {
      q: "Is ZeroPlate really free for charities and non-profits?",
      a: "Yes! 100% free. Verified NGOs, shelters, and food banks never pay a single rupee for food or platform access. Kitchens donate the surplus, and logistics are coordinated to deliver meals at zero cost to charities.",
    },
    {
      q: "How fast does a batch get claimed and picked up?",
      a: "Very fast. Because our system alerts nearby charities within a 10 km radius via instant push notifications, most surplus batches are claimed in under 4 minutes, and drivers arrive within 25–40 minutes.",
    },
    {
      q: "What types of food can commercial kitchens donate?",
      a: "Kitchens can donate freshly prepared hot meals (rice, curries, rotis, sabzi), unserved bulk trays, dairy products, bakery goods, and raw kitchen staples with remaining shelf life.",
    },
    {
      q: "How do institutions receive ESG and tax-deductible certificates?",
      a: "Every verified delivery generates an audit-ready digital certificate. Our platform automatically calculates kilograms saved, meals served, and Scope 3 greenhouse gas (CO₂e) emissions prevented according to international FAO standards.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <PublicNav />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-20 border-b border-slate-200/80 bg-gradient-to-b from-emerald-50/50 via-white to-slate-50/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs mb-5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Simple, Transparent & Fast</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            How ZeroPlate Works
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
            From smart kitchen prep to verified delivery at local shelters — here is how we make surplus food rescue effortless, safe, and transparent.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-7 py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
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
              className="border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-6 rounded-xl shadow-xs"
            >
              <Link href="#faqs">Frequently Asked Questions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Interactive Guide Component */}
      <HowItWorksSection />

      {/* Layman FAQs Section */}
      <section id="faqs" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Everything You Need to Know
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Clear, straightforward answers about food safety, logistics, and partner eligibility.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
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
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-4">
              <Zap className="w-3.5 h-3.5" />
              Get Started in Minutes
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to stop kitchen food waste?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Register your dining hall or verified non-profit today. No credit cards or complicated installations required.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/register?role=institution_admin">Register as Kitchen</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 hover:bg-white/10 text-white font-semibold px-6 py-6 rounded-xl transition-all"
              >
                <Link href="/register?role=ngo">Register as Charity</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
