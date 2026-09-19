import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="bg-[#1C2420] text-[#E0DACE] border-t border-[#2D3933] py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Col 1: Brand & Positioning */}
        <div className="md:col-span-1 space-y-3">
          <div className="font-display text-2xl font-bold text-[#F3EEE2] tracking-tight">
            ZeroPlate<span className="text-saffron">.ai</span>
          </div>
          <p className="text-xs text-[#A8A193] leading-relaxed">
            The B2B operating system for institutional food waste — forecasting,
            redistribution, and ESG reporting.
          </p>
          <div className="text-xs text-[#7F796C] pt-2">
            © {new Date().getFullYear()} ZeroPlate.ai. All rights reserved.
          </div>
        </div>

        {/* Col 2: Product */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[#F3EEE2] uppercase tracking-wider">
            Product
          </h4>
          <ul className="space-y-2 text-sm text-[#BFB8AA]">
            <li>
              <Link href="/how-it-works" className="hover:text-[#F3EEE2] transition-colors">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/impact" className="hover:text-[#F3EEE2] transition-colors">
                Public Impact Ledger
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: For Institutions */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[#F3EEE2] uppercase tracking-wider">
            For Institutions
          </h4>
          <ul className="space-y-2 text-sm text-[#BFB8AA]">
            <li>
              <Link href="/institutions" className="hover:text-[#F3EEE2] transition-colors">
                Kitchens & Cafeterias
              </Link>
            </li>
            <li>
              <Link href="/institutions#processing" className="hover:text-[#F3EEE2] transition-colors">
                Food Processing Units
              </Link>
            </li>
            <li>
              <Link href="/institutions#forecasting" className="hover:text-[#F3EEE2] transition-colors">
                Demand Forecasting
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: For NGOs */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[#F3EEE2] uppercase tracking-wider">
            For NGOs
          </h4>
          <ul className="space-y-2 text-sm text-[#BFB8AA]">
            <li>
              <Link href="/ngos" className="hover:text-[#F3EEE2] transition-colors">
                Recipient Network
              </Link>
            </li>
            <li>
              <Link href="/ngos#kyc" className="hover:text-[#F3EEE2] transition-colors">
                KYC Verification
              </Link>
            </li>
            <li>
              <Link href="/ngos#safety" className="hover:text-[#F3EEE2] transition-colors">
                Food Safety Gating
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 5: Company & Legal */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[#F3EEE2] uppercase tracking-wider">
            Company & Legal
          </h4>
          <ul className="space-y-2 text-sm text-[#BFB8AA]">
            <li>
              <Link href="/about" className="hover:text-[#F3EEE2] transition-colors">
                About ZeroPlate
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#F3EEE2] transition-colors">
                Contact & Support
              </Link>
            </li>
            <li>
              <Link href="/help" className="hover:text-[#F3EEE2] transition-colors">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/food-safety-policy" className="hover:text-[#F3EEE2] transition-colors">
                Food Safety Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-[#F3EEE2] transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-[#F3EEE2] transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
