import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";
import { InteractiveContactHub } from "@/components/contact/interactive-contact-hub";
import { Sparkles, HeartHandshake, ShieldCheck, Clock } from "lucide-react";

export const metadata = {
  title: "Contact & Support | ZeroPlate.ai",
  description:
    "Get in touch with ZeroPlate.ai institutional kitchen onboarding, verified NGO support, and 24/7 food safety escalation teams.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFB] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <PublicNav />

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-18 sm:pb-20 border-b border-slate-200/80 bg-gradient-to-b from-emerald-50/60 via-white to-amber-50/30">
        {/* Luxury Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-emerald-100/50 via-teal-50/20 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-12 right-10 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Direct Support &amp; Incident Operations</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Get in Touch With Our{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 bg-clip-text text-transparent">
                Support Team.
              </span>
            </h1>

            {/* Layman Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Whether you are a commercial kitchen wanting to donate surplus meals, a verified shelter seeking food for your community, or need urgent food safety help — we&apos;re here for you.
            </p>

            {/* Highlights row */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Average Response: Under 2 Hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-blue-600" />
                <span>100% Free for Charities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>24/7 Monitored Food Safety</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Contact Hub */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <InteractiveContactHub />
      </main>

      <PublicFooter />
    </div>
  );
}
