import Link from "next/link";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";

export const metadata = {
  title: "Contact & Support | ZeroPlate.ai",
  description:
    "Get in touch with ZeroPlate.ai institutional onboarding, logistics support, and food safety teams.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3EEE2] text-[#24211C]">
      <PublicNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        <div className="border-b border-[#DCD3BE] pb-6 space-y-2">
          <span className="font-mono text-xs text-[#5A5548] uppercase tracking-wider">
            Institutional Relations & Incident Response
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#24211C]">
            Contact ZeroPlate.ai
          </h1>
          <p className="text-sm text-[#5A5548]">
            Direct channels for enterprise cafeterias, verified NGOs, and municipal logistics partners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-[6px] bg-white border border-[#DCD3BE] space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#24211C]">
              Enterprise & Kitchen Onboarding
            </h2>
            <p className="text-xs text-[#5A5548]">
              Connect with our solutions engineers to integrate ZeroPlate.ai with your SAP/Oracle kitchen ERP, bulk procurement systems, or corporate ESG reporting.
            </p>
            <div className="font-mono text-xs text-[#2F4B3A] font-medium pt-2">
              institutions@zeroplate.ai
            </div>
          </div>

          <div className="p-6 rounded-[6px] bg-white border border-[#DCD3BE] space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#24211C]">
              NGO KYC & Recipient Verification
            </h2>
            <p className="text-xs text-[#5A5548]">
              Need help verifying your 12A/80G status, expanding service areas, or scheduling bulk refrigerated pickup logistics?
            </p>
            <div className="font-mono text-xs text-[#2F4B3A] font-medium pt-2">
              ngos@zeroplate.ai
            </div>
          </div>

          <div className="p-6 rounded-[6px] bg-white border border-[#DCD3BE] space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#24211C]">
              Logistics & Delivery Fleet Support
            </h2>
            <p className="text-xs text-[#5A5548]">
              For active dispatch issues, transit temperature inquiries, or vehicle assignment queries.
            </p>
            <div className="font-mono text-xs text-[#2F4B3A] font-medium pt-2">
              dispatch@zeroplate.ai
            </div>
          </div>

          <div className="p-6 rounded-[6px] bg-white border border-[#DCD3BE] space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#24211C]">
              Food Safety & Emergency Escalation
            </h2>
            <p className="text-xs text-[#5A5548]">
              Urgent inquiries regarding batch recalls, cold-chain deviations, or safety gating audits.
            </p>
            <div className="font-mono text-xs text-clay-rust font-medium pt-2">
              safety@zeroplate.ai · 24/7 Monitored
            </div>
          </div>
        </div>

        <div className="p-4 rounded-[6px] bg-[#24211C] text-[#F3EEE2] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-display font-semibold text-sm">
              Looking for quick answers?
            </div>
            <div className="text-xs text-[#A8A193]">
              Check our searchable help center for instant guides on safety rules and claim workflows.
            </div>
          </div>
          <Link
            href="/help"
            className="px-4 py-2 bg-[#2F4B3A] hover:bg-[#2F4B3A]/90 text-[#F3EEE2] text-xs font-semibold rounded-[6px] shrink-0"
          >
            Visit Help Center
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
