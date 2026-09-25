import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TicketCard } from "@/components/ui/ticket-card";
import {
  StampIcon,
  CrateIcon,
  RouteIcon,
  LedgerTabIcon,
  BellIcon,
  ForecastIcon,
} from "@/components/icons/ledger-icons";
import { PublicNav } from "@/components/layouts/public-nav";
import { PublicFooter } from "@/components/layouts/public-footer";

export default function StyleGuidePage() {
  const colorTokens = [
    { name: "Unbleached Ledger", token: "--ledger-paper", hex: "#F3EEE2", role: "Base surface — warm paper, not stark white", bg: "bg-[#F3EEE2]", text: "text-[#24211C]", border: "border-[#DCD3BE]" },
    { name: "Basil", token: "--basil", hex: "#2F4B3A", role: "Primary brand — trust, sustainability, verified safe", bg: "bg-[#2F4B3A]", text: "text-[#F3EEE2]", border: "border-[#2F4B3A]" },
    { name: "Saffron", token: "--saffron", hex: "#D9A441", role: "Secondary accent — abundance, forecasting, pending", bg: "bg-[#D9A441]", text: "text-[#24211C]", border: "border-[#D9A441]" },
    { name: "Clay Rust", token: "--clay-rust", hex: "#B85C38", role: "Tertiary accent — urgency, nearing expiry", bg: "bg-[#B85C38]", text: "text-[#F3EEE2]", border: "border-[#B85C38]" },
    { name: "Fig Plum", token: "--plum", hex: "#4A2E44", role: "Premium accent — admin chrome, special moment", bg: "bg-[#4A2E44]", text: "text-[#F3EEE2]", border: "border-[#4A2E44]" },
    { name: "Ink", token: "--ink", hex: "#24211C", role: "Primary text — warm near-black", bg: "bg-[#24211C]", text: "text-[#F3EEE2]", border: "border-[#24211C]" },
    { name: "Soft Ink", token: "--ink-soft", hex: "#5A5548", role: "Secondary text, captions", bg: "bg-[#5A5548]", text: "text-[#F3EEE2]", border: "border-[#5A5548]" },
    { name: "Ledger Line", token: "--line", hex: "#DCD3BE", role: "Borders, dividers, table rules", bg: "bg-[#DCD3BE]", text: "text-[#24211C]", border: "border-[#B8AB8F]" },
    { name: "Muted Ink-Rust", token: "--ink-rust", hex: "#8A4331", role: "Rejected, blocked, expired (never bright red)", bg: "bg-[#8A4331]", text: "text-[#F3EEE2]", border: "border-[#8A4331]" },
  ];

  return (
    <div className="min-h-screen bg-ledger-paper text-ink">
      {/* Shell Preview 1: Public Top Navigation */}
      <PublicNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Header */}
        <div className="border-b border-line pb-6">
          <div className="text-xs uppercase tracking-widest text-ink-soft mb-2 font-mono-numeral">
            ZeroPlate.ai — Visual Design System Specification
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-ink">
            The Abundance Ledger — Style Guide
          </h1>
          <p className="mt-3 text-base text-ink-soft max-w-3xl">
            Warm and tactile where it speaks of food, precise and calm where it speaks of data.
            Built on a 5-color harvest palette, Fraunces editorial type, IBM Plex data figures,
            and flat hairline ledger lines.
          </p>
        </div>

        {/* Section 1: Five-Color Harvest Palette */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-normal text-ink">
              1. Color System (Section 3 & 6)
            </h2>
            <p className="text-sm text-ink-soft">
              Five working colors drawn from market crates and terracotta pots — no neon accents, no generic AI-cream monochrome.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorTokens.map((c) => (
              <div
                key={c.name}
                className="border border-line p-4 rounded-[6px] bg-[#FAF6EE] flex flex-col justify-between h-36"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-sm text-ink block">
                      {c.name}
                    </span>
                    <span className="font-mono-numeral text-xs text-ink-soft block">
                      {c.hex} ({c.token})
                    </span>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-[4px] border ${c.bg} ${c.border}`}
                  />
                </div>
                <p className="text-xs text-ink-soft">{c.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography Scale */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-normal text-ink">
              2. Typography System (Section 4)
            </h2>
            <p className="text-sm text-ink-soft">
              Fraunces variable serif for editorial human moments, IBM Plex Sans for trustworthy institutional UI, and IBM Plex Mono for numeric ledger figures.
            </p>
          </div>

          <div className="border border-line bg-[#FAF6EE] p-6 rounded-[6px] space-y-6">
            <div className="border-b border-line pb-4">
              <span className="text-xs font-mono-numeral text-ink-soft uppercase tracking-wider block mb-1">
                Hero Headline — Fraunces (56–72px, Weight 480)
              </span>
              <div className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink font-normal leading-tight">
                Predict what&apos;s needed.
                <br />
                Redistribute what&apos;s left.
              </div>
            </div>

            <div className="border-b border-line pb-4">
              <span className="text-xs font-mono-numeral text-ink-soft uppercase tracking-wider block mb-1">
                Section Title — Fraunces (32–40px, Weight 460)
              </span>
              <div className="font-display text-2xl sm:text-3xl text-ink">
                Today&apos;s surplus, safely on its way.
              </div>
            </div>

            <div className="border-b border-line pb-4">
              <span className="text-xs font-mono-numeral text-ink-soft uppercase tracking-wider block mb-1">
                Card / Module Title — IBM Plex Sans (20px, Weight 600)
              </span>
              <div className="font-sans text-xl font-semibold text-ink">
                Central Kitchen Daily Inventory Ledger
              </div>
            </div>

            <div className="border-b border-line pb-4">
              <span className="text-xs font-mono-numeral text-ink-soft uppercase tracking-wider block mb-1">
                Body Copy — IBM Plex Sans (16px, Weight 400, 1.6 line-height)
              </span>
              <p className="font-sans text-base text-ink leading-relaxed max-w-2xl">
                ZeroPlate.ai is built for the operational realities of institutional kitchens: bulk volumes,
                FSSAI-aligned compliance, safe redistribution to verified recipients, and real-time ESG metrics.
              </p>
            </div>

            <div className="border-b border-line pb-4">
              <span className="text-xs font-mono-numeral text-ink-soft uppercase tracking-wider block mb-1">
                Caption / Meta — IBM Plex Sans (13px, Weight 500)
              </span>
              <p className="font-sans text-[13px] font-medium text-ink-soft">
                Verified pickup window: 14:00 – 16:30 IST • Capacity: 45 kg • Cooked 2.5h ago
              </p>
            </div>

            <div>
              <span className="text-xs font-mono-numeral text-ink-soft uppercase tracking-wider block mb-1">
                Table / Ledger Numerals — IBM Plex Mono (14px, Tabular Figures)
              </span>
              <div className="font-ledger-mono text-sm text-ink space-x-6">
                <span>340 kg prevented</span>
                <span>812 meals</span>
                <span>₹48,720 saved</span>
                <span>612 kg CO2e</span>
                <span>10:45:00 IST</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Border Radius & Component Shapes */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-normal text-ink">
              3. Border Radius Discipline & Component Shapes (Section 6)
            </h2>
            <p className="text-sm text-ink-soft">
              Intentional variation: modest 6px radius for buttons/inputs, torn ticket notch (clip-path) for surplus listings, and pill-round strictly for status stamps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ticket Card Sample */}
            <div className="space-y-3">
              <span className="text-xs font-mono-numeral text-ink-soft uppercase tracking-wider block">
                Clipped-Corner Ticket Stub Card (CSS clip-path)
              </span>
              <TicketCard className="bg-[#FAF6EE]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-display text-lg font-semibold text-ink">
                      Steamed Basmati Rice & Dal
                    </span>
                    <span className="text-xs text-ink-soft block font-mono-numeral">
                      Batch #CK-2026-0918-04
                    </span>
                  </div>
                  <StatusBadge variant="verified_safe" showIcon />
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 my-2 border-y border-line text-xs">
                  <div>
                    <span className="text-ink-soft block">Surplus Quantity</span>
                    <span className="font-ledger-mono text-sm font-semibold text-ink">
                      45.0 kg (~110 meals)
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-soft block">Pickup Window</span>
                    <span className="font-ledger-mono text-sm font-semibold text-ink">
                      14:00 – 16:30 IST
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-ink-soft">
                    Location: IIT Delhi Central Mess A
                  </span>
                  <Button variant="default" size="sm">
                    Claim listing
                  </Button>
                </div>
              </TicketCard>
            </div>

            {/* Status Badges & Stamp Marks */}
            <div className="space-y-3">
              <span className="text-xs font-mono-numeral text-ink-soft uppercase tracking-wider block">
                Status Badges — Pill Shape (The Only Place Full-Round is Used)
              </span>
              <div className="border border-line bg-[#FAF6EE] p-5 rounded-[6px] space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge variant="verified_safe" showIcon />
                  <StatusBadge variant="delivered" />
                  <StatusBadge variant="confirmed" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge variant="pending" />
                  <StatusBadge variant="forecasted" />
                  <StatusBadge variant="in_transit" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge variant="nearing_expiry" />
                  <StatusBadge variant="action_needed" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge variant="rejected" />
                  <StatusBadge variant="expired" />
                  <StatusBadge variant="premium" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Button Hierarchy */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-normal text-ink">
              4. Button Hierarchy (Section 6)
            </h2>
            <p className="text-sm text-ink-soft">
              Primary is solid basil on paper text. Secondary is paper fill with 1px basil border. Destructive-adjacent actions use muted ink-rust, never a bright alarm red.
            </p>
          </div>

          <div className="border border-line bg-[#FAF6EE] p-6 rounded-[6px] flex flex-wrap items-center gap-4">
            <Button variant="default">Primary (Solid Basil)</Button>
            <Button variant="secondary">Secondary (Paper + Basil Border)</Button>
            <Button variant="outline">Outline (Ledger Line)</Button>
            <Button variant="destructive">Reject / Deny (Muted Ink-Rust)</Button>
            <Button variant="ghost">Ghost Action</Button>
            <Button variant="link">Text Link →</Button>
          </div>
        </section>

        {/* Section 5: Shadows & Flat Ledger Table */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-normal text-ink">
              5. Shadow Rules & Flat Ledger Tables (Section 5.2 & 6)
            </h2>
            <p className="text-sm text-ink-soft">
              No generic soft-grey card drop-shadows everywhere. Flat tables with hairline dividers, and warm low-opacity overlay shadow strictly reserved for modals/popovers.
            </p>
          </div>

          {/* Horizontal Metric Strip (receipt total line metaphor) */}
          <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-hidden">
            <div className="px-5 py-3 border-b border-line bg-[#EAE3D4]/50 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-ink">
                Receipt-Total Ledger Strip (No Card Shadows)
              </span>
              <span className="text-xs font-mono-numeral text-ink-soft">
                Refreshed 2m ago
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line p-4">
              <div className="px-4 py-2">
                <span className="text-xs text-ink-soft block">Waste Prevented</span>
                <span className="font-ledger-mono text-2xl font-semibold text-ink">
                  340.5 <span className="text-sm font-normal text-ink-soft">kg</span>
                </span>
              </div>
              <div className="px-4 py-2">
                <span className="text-xs text-ink-soft block">Meals Redistributed</span>
                <span className="font-ledger-mono text-2xl font-semibold text-basil">
                  851
                </span>
              </div>
              <div className="px-4 py-2">
                <span className="text-xs text-ink-soft block">CO2e Avoided</span>
                <span className="font-ledger-mono text-2xl font-semibold text-ink">
                  612.9 <span className="text-sm font-normal text-ink-soft">kg</span>
                </span>
              </div>
              <div className="px-4 py-2">
                <span className="text-xs text-ink-soft block">Cost Saved</span>
                <span className="font-ledger-mono text-2xl font-semibold text-[#B85C38]">
                  ₹40,860
                </span>
              </div>
            </div>
          </div>

          {/* Flat Ledger Table Sample */}
          <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#EAE3D4] border-b border-line text-xs uppercase tracking-wider text-ink">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item Name</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Expiry Window</th>
                  <th className="px-4 py-3 font-semibold">Safety Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr className="hover:bg-[#F3EDE0]/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">Cooked Chapati (Wheat)</td>
                  <td className="px-4 py-3 text-ink-soft">Cooked Food</td>
                  <td className="px-4 py-3 font-ledger-mono">350 pcs (~116 plates)</td>
                  <td className="px-4 py-3 font-ledger-mono text-xs">Today, 18:00</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant="verified_safe" showIcon />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="default" size="sm">List surplus</Button>
                  </td>
                </tr>
                <tr className="hover:bg-[#F3EDE0]/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">Mixed Vegetable Curry</td>
                  <td className="px-4 py-3 text-ink-soft">Cooked Food</td>
                  <td className="px-4 py-3 font-ledger-mono">22.0 kg</td>
                  <td className="px-4 py-3 font-ledger-mono text-xs text-clay-rust font-semibold">In 1.5 hours</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant="nearing_expiry" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="default" size="sm">List surplus</Button>
                  </td>
                </tr>
                <tr className="hover:bg-[#F3EDE0]/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">Pasteurized Dairy Milk</td>
                  <td className="px-4 py-3 text-ink-soft">Dairy</td>
                  <td className="px-4 py-3 font-ledger-mono">40.0 L</td>
                  <td className="px-4 py-3 font-ledger-mono text-xs">Tomorrow, 08:00</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant="pending" label="In Stock" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm">Edit log</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Warm Overlay Shadow Demonstration */}
          <div className="p-6 border border-line bg-[#FAF6EE] rounded-[6px] space-y-2">
            <span className="text-xs font-mono-numeral text-ink-soft uppercase tracking-wider block">
              Warm Overlay Shadow Box (Reserved for True Overlays / Modals)
            </span>
            <div className="bg-ledger-paper p-5 border border-line rounded-[6px] shadow-warm-overlay max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-ink">
                  Notification Popover Overlay
                </span>
                <span className="text-[11px] font-mono-numeral text-ink-soft">Just now</span>
              </div>
              <p className="text-xs text-ink-soft">
                New listing claimed: IIT Delhi Central Mess has been claimed by Robin Hood Army. Delivery partner assignment dispatched.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Custom Ledger Iconography */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-normal text-ink">
              6. Custom Single-Stroke Icon Set (Section 8)
            </h2>
            <p className="text-sm text-ink-soft">
              1.5px stroke width, single-stroke ledger/kitchen metaphor — no flat SaaS icon kits with fills or shadows.
            </p>
          </div>

          <div className="border border-line bg-[#FAF6EE] p-6 rounded-[6px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 border border-line rounded-[6px] text-basil bg-[#F3EEE2]">
                <StampIcon size={24} />
              </div>
              <span className="text-xs font-medium text-ink">Stamp (Verified)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="p-3 border border-line rounded-[6px] text-ink bg-[#F3EEE2]">
                <CrateIcon size={24} />
              </div>
              <span className="text-xs font-medium text-ink">Crate (Inventory)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="p-3 border border-line rounded-[6px] text-saffron bg-[#F3EEE2]">
                <RouteIcon size={24} />
              </div>
              <span className="text-xs font-medium text-ink">Route (Delivery)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="p-3 border border-line rounded-[6px] text-plum bg-[#F3EEE2]">
                <LedgerTabIcon size={24} />
              </div>
              <span className="text-xs font-medium text-ink">Ledger-Tab (Reports)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="p-3 border border-line rounded-[6px] text-clay-rust bg-[#F3EEE2]">
                <BellIcon size={24} />
              </div>
              <span className="text-xs font-medium text-ink">Bell (Alerts)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="p-3 border border-line rounded-[6px] text-[#D9A441] bg-[#F3EEE2]">
                <ForecastIcon size={24} />
              </div>
              <span className="text-xs font-medium text-ink">Forecast (Insight)</span>
            </div>
          </div>
        </section>

        {/* Section 7: Structural Layout Shells Summary */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-normal text-ink">
              7. Structural Layout Shells (Section 12)
            </h2>
            <p className="text-sm text-ink-soft">
              Component shells ready for each role — Public Nav/Footer, Institution/NGO/Admin Sidebar Shell, and Delivery Mobile Bottom-Tab Shell.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="border border-line bg-[#FAF6EE] p-4 rounded-[6px] space-y-2">
              <span className="font-semibold text-sm text-ink block">
                Public Site Shell
              </span>
              <p className="text-ink-soft">
                Persistent top bar, basil wordmark, quiet &quot;Log in&quot; link, solid basil &quot;Sign up&quot; button, full dark basil footer.
              </p>
              <div className="text-basil font-medium pt-1">Active on this page</div>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-4 rounded-[6px] space-y-2">
              <span className="font-semibold text-sm text-ink block">
                App Sidebar Shell
              </span>
              <p className="text-ink-soft">
                Collapsible sidebar, active section basil left-border tick, notification popover, and profile menu. Plum chrome for Admin.
              </p>
              <div className="text-ink-soft font-mono-numeral pt-1">
                components/layouts/app-sidebar-shell.tsx
              </div>
            </div>

            <div className="border border-line bg-[#FAF6EE] p-4 rounded-[6px] space-y-2">
              <span className="font-semibold text-sm text-ink block">
                Delivery Mobile Shell
              </span>
              <p className="text-ink-soft">
                Mobile-first dark ledger variant (#24211C), single-column, 48px touch targets, bottom tab bar (Assignments/History/Profile).
              </p>
              <div className="text-ink-soft font-mono-numeral pt-1">
                components/layouts/delivery-mobile-shell.tsx
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Shell Preview 2: Public Multi-Column Footer */}
      <PublicFooter />
    </div>
  );
}
