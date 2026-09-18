# Design PRD
## ZeroPlate.ai — Visual & Interaction Design System

**Version:** 1.0
**Prepared as:** Design specification for an AI coding agent (Antigravity), to be implemented on top of the existing Functional PRD (Next.js + shadcn/ui + Tailwind + MongoDB + better-auth).
**Author's lens:** Written as a senior product design lead would brief an engineering team — every decision is tied to what this specific product is, not a generic B2B SaaS template.

---

## 1. Design Vision

ZeroPlate.ai is not a generic inventory dashboard. It sits at the intersection of two very different worlds: the **disciplined, ticket-driven rhythm of a working kitchen** (where every plate, every ticket, every "86'd" item matters) and the **quiet trust of an institutional ledger** (where a hospital, a college, or an NGO needs to see clean, credible numbers before they rely on a platform for food safety and compliance).

The design should feel like it was built by people who have actually stood at a kitchen pass and also sat in a finance review meeting — **warm and tactile where it talks about food, precise and calm where it talks about data.**

### Guiding metaphor: "The Abundance Ledger"

Picture a well-run restaurant's order rail crossed with a beautifully kept harvest ledger — the kind a family-run grocer uses to log what came in, what went out, and what was given away at the end of the day. Order tickets get stamped. Crates get labeled. A ledger page has structure, not decoration. That's the emotional register we're building in: **abundance, tracked with care.**

This metaphor directly justifies why the interface uses stamps, tickets, and ledger-line structures instead of generic rounded SaaS cards — it's not decoration, it's the product's own internal logic (a listing really does move through a lifecycle like an order ticket; a delivery really does get "stamped" at each stage).

---

## 2. What to Avoid

Explicitly ruling these out, because they are the default visual language of generated/templated products and would undercut the "not AI-generated, premium, unique" brief:

- No warm-cream-background + single terracotta-accent combo as the *entire* palette (common AI-generated default) — this palette uses five working colors, not one accent on neutral.
- No near-black background with one neon accent.
- No newspaper/broadsheet hairline-rule layout.
- No uniform "SaaS card kit" — identical rounded corners and the same soft grey drop-shadow on every single card regardless of what the card represents.
- No tracked-out ALL-CAPS eyebrow labels above every heading.
- No meta text joined with middle dots, no "WORD — fragment" em-dash labels, no monospace font for small data labels, no arrow (→) appended to every button/link.
- No toggling between a plain "light mode" and a plain "dark mode" as the only two states — see Section 4, this is a single, deliberately colorful theme with a considered dark variant, not a grayscale-with-inversion approach.

---

## 3. Color System

Five working colors, drawn from a harvest/market palette — not a neutral base with one accent, but a genuinely colorful system where each hue has a job.

| Token | Name | Hex | Role |
|---|---|---|---|
| `--ledger-paper` | Unbleached Ledger | `#F3EEE2` | Base surface — warm paper, not stark white, not the common AI-cream |
| `--basil` | Basil | `#2F4B3A` | Primary brand color — trust, sustainability, "verified safe," primary buttons/nav |
| `--saffron` | Saffron | `#D9A441` | Secondary/warm accent — abundance, forecasting/insight highlights, in-progress states |
| `--clay-rust` | Clay Rust | `#B85C38` | Tertiary accent — urgency, "nearing expiry," warm CTAs on light surfaces |
| `--plum` | Fig Plum | `#4A2E44` | Premium accent — used sparingly for premium-tier features, admin surfaces, and the one "bold moment" per screen |
| `--ink` | Ink | `#24211C` | Primary text — warm near-black, not pure `#000`/`#111` |
| `--ink-soft` | Soft Ink | `#5A5548` | Secondary text, captions |
| `--line` | Ledger Line | `#DCD3BE` | Borders, dividers, table rules |

**Semantic status mapping** (this matters — the product has real lifecycle states, so color must carry meaning, not just brand decoration):

| State | Color | Where it appears |
|---|---|---|
| Verified Safe / Delivered / Confirmed | Basil | Safety gate pass, completed deliveries |
| Pending / Forecasted / In Transit | Saffron | Awaiting match, forecast confidence bands |
| Nearing Expiry / Action Needed | Clay Rust | Auto-flagged surplus, expiring soon |
| Rejected / Blocked / Expired | Muted Ink-Rust (`#8A4331` at 70% on paper) | Safety-gate rejections, expired listings — deliberately *not* a generic alert-red, to stay in-palette |
| Premium / Admin-only | Plum | Upsell states, Platform Admin chrome |

**Why this palette, specifically:** basil and saffron are the colors of a market crate of greens and grains; clay rust is the color of a terracotta storage pot (and doubles as urgency without resorting to stoplight red); plum is rare enough on the page that when it appears — a premium badge, an admin-only panel edge — it reads as genuinely special rather than decorative. This also happens to work cleanly for India-first branding without leaning on cliché tricolor references.

**Dark surface variant** (for the Delivery Partner mobile view and optional system dark mode) is not a literal inversion — it shifts the base to `--ink` (`#24211C`) as the surface, keeps `--ledger-paper` as the *text* color on dark, and keeps basil/saffron/clay-rust at slightly desaturated values so the palette stays warm rather than turning into a generic dark-mode dashboard.

---

## 4. Typography

Two typefaces, each with a clear job — not a display/body split for its own sake, but because this product genuinely has two registers of content (editorial/marketing vs. dense operational data).

- **Display / Editorial — Fraunces** (variable serif, warm, slightly irregular terminals). Used for: marketing landing page headlines, the onboarding welcome screens, empty-state headlines, and section titles inside dashboards where a human moment matters (e.g. "Today's surplus, on its way"). Fraunces was chosen specifically because its warmth reads as *crafted*, avoiding the generic high-contrast "AI generated" serif look, while still being confidently premium.
- **UI / Data — IBM Plex Sans**. Used for: all dashboard UI, tables, forms, navigation, buttons, numerals. IBM Plex Sans has a slightly technical, engineered character (it was designed for IBM's own products) that reads as trustworthy and institutional — appropriate for a platform hospitals and colleges rely on — while remaining distinct from the ubiquitous Inter/Helvetica look of most generated SaaS UI. Use **IBM Plex Mono** only for actual numeric ledger data in dense tables (inventory quantities, timestamps) — this is a functional choice (tabular figures align cleanly in mono), not a decorative label treatment.

**Type scale** (base 16px, ratio ~1.25):

| Role | Typeface | Size / Weight |
|---|---|---|
| Hero headline | Fraunces | 56–72px, weight 480, tight tracking |
| Section title | Fraunces | 32–40px, weight 460 |
| Card/module title | IBM Plex Sans | 20px, weight 600 |
| Body | IBM Plex Sans | 16px, weight 400, 1.6 line-height |
| Caption / meta | IBM Plex Sans | 13px, weight 500, `--ink-soft` |
| Table/ledger numerals | IBM Plex Mono | 14px, weight 400 |

Line length capped at ~72 characters for body copy on marketing pages. No all-caps labels anywhere in the product — use sentence case with weight/color to establish hierarchy instead.

---

## 5. Layout Principles by Surface

This product has genuinely different content types across its screens — the layout language should reflect that rather than using one dashboard template everywhere.

### 5.1 Marketing / Landing Page
Asymmetric, left-aligned hero — not centered-hero-with-gradient-blob. The hero's "most characteristic thing in this product's world" is the moment surplus becomes someone's meal — so the hero treatment is a **live, looping visual ledger strip**: a horizontal row of small "ticket" cards silently sliding left, each representing a real kind of surplus item turning into a "claimed" stamp, then fading. This is the one orchestrated motion moment for the marketing page (see Section 7) — everything else on the page is static and calm by contrast.

```
┌─────────────────────────────────────────────┐
│  ZeroPlate                        Log in →  │  <- thin nav, basil on paper
│                                                │
│  Predict what's needed.                       │  <- Fraunces, left-aligned
│  Redistribute what's left.                    │
│  Measure what it meant.                       │
│                                                │
│  [ Get started ]  [ See how it works ]        │
│                                                │
│  ▭▭▭▭ ▭▭▭▭ ▭▭▭▭ ▭▭▭▭  <- ticket strip, animated
└─────────────────────────────────────────────┘
```
Below the fold: the four-stage pipeline (Predict → Prevent → Redistribute → Measure) is a legitimate numbered sequence — use numbered ledger-tab markers here (this is one of the few places numbering is earned, since the content is actually sequential).

### 5.2 Institution Admin Dashboard
Dense, ledger-table-first, not card-grid-first. Primary view is a real data table (inventory/listings) with a slim metrics rail above it — not four identical KPI cards in a row. Metrics are shown as a single horizontal "ledger strip" with thin vertical dividers between numbers (evoking a receipt total line), not boxed cards with drop shadows.

```
┌───────────────────────────────────────────────┐
│ Waste prevented   Meals given   CO2e avoided   │  <- one strip, hairline
│ 340 kg        │      812       │   612 kg      │     dividers, no card shadows
├───────────────────────────────────────────────┤
│ Inventory                          [+ Add item]│
│ ─────────────────────────────────────────────  │
│ Item          Qty     Expires      Status      │  <- real table, mono numerals
│ ...                                             │
└───────────────────────────────────────────────┘
```

### 5.3 NGO Browse/Claim View
Card-based here is correct — because NGOs are genuinely browsing discrete, claimable *things*, not scanning a ledger. But the card shape is the "ticket," not a rounded SaaS card: a slightly irregular top edge (like a torn perforation, done in CSS via a clipped SVG mask, not a literal image), a stamp-style status badge in the corner, basil-on-paper for "Verified Safe."

### 5.4 Delivery Partner View
Mobile-first, single-column, large touch targets. This is the one surface where the dark ledger variant (Section 3) is default, since delivery partners are often outdoors/low-light. Status progression uses a horizontal stepper with literal "stamp" animation on advance (Section 7).

### 5.5 Platform Admin
Plum accent becomes the dominant chrome color here (not just a highlight) — this is the one place in the product where the "premium/serious" register is the whole surface, signaling this is a restricted, high-trust area.

---

## 6. Component Language (shadcn/Tailwind implementation)

Implement as a custom shadcn theme, not the default shadcn palette. Suggested `globals.css` CSS variable mapping:

```css
:root {
  --background: 42 38% 91%;        /* --ledger-paper #F3EEE2 */
  --foreground: 40 12% 13%;        /* --ink #24211C */
  --primary: 147 24% 24%;          /* --basil #2F4B3A */
  --primary-foreground: 42 38% 91%;
  --secondary: 38 61% 55%;         /* --saffron #D9A441 */
  --accent: 17 47% 45%;            /* --clay-rust #B85C38 */
  --destructive: 12 40% 35%;       /* muted ink-rust, not stoplight red */
  --muted: 42 24% 85%;
  --muted-foreground: 39 10% 36%;  /* --ink-soft */
  --border: 43 28% 79%;            /* --line */
  --ring: 147 24% 24%;
  --radius: 0.375rem;              /* deliberately modest, not the generic 1rem rounded-everything */
}
.dark {
  --background: 40 12% 13%;        /* --ink as surface */
  --foreground: 42 30% 88%;
  --primary: 147 20% 55%;          /* desaturated basil for dark */
  --secondary: 38 50% 58%;
  --accent: 17 40% 55%;
  --border: 40 10% 24%;
}
```

**Border radius discipline**: not one radius on everything. Buttons and inputs: `--radius` (6px, crisp/institutional). Ticket-style surplus cards: custom clipped corner (not a border-radius at all — a CSS `clip-path` notch on one corner, evoking a torn ticket stub). Status badges: fully pill-rounded (the one place full-round is used, to read clearly as a "stamp"). This variation is intentional — a single radius value applied everywhere is exactly the templated look we're avoiding.

**Shadows**: no default soft grey `rgba(0,0,0,.1)` box-shadow on every card. Use a single, warm, low-opacity shadow (`rgba(36,33,28,.08)`) only on truly elevated surfaces (modals, the notification popover) — flat ledger tables and ticket cards stay shadowless, separated by hairline `--border` rules instead, which reinforces the "ledger" feel over the "floating card" feel.

**Buttons**: primary action = solid basil fill, paper text. Secondary = paper fill, basil 1px border, basil text. Destructive-adjacent actions (reject listing, deny KYC) use the muted ink-rust, never a bright red — stay in-palette even for warnings.

---

## 7. Motion Principles

One deliberate motion moment per major surface, not scattered hover/fade effects everywhere:

- **Landing page**: the ticket-strip hero animation described in 5.1 — a slow, continuous horizontal drift with an occasional "claimed" stamp-down effect on one ticket. This is the single orchestrated moment for the whole marketing page.
- **Surplus listing → claimed**: when an NGO claims a listing, the status badge performs a brief stamp-down scale+settle animation (100–150ms, slight overshoot) rather than an instant color swap — this is motion that answers a user's action, not ambient decoration.
- **Delivery status stepper**: each stage advance animates as a literal stamp mark appearing on that stage of the stepper, with a short paper-texture "thunk" — again, responding to a real state change (a delivery partner tapping "Picked up"), not a page-load flourish.
- **Dashboard metrics**: numbers count up once on first load of a session (not on every re-render), subtle and quick (400ms), never looping or repeating.
- Everything else — cards, table rows, nav — has **no** entrance animation. No fade-and-slide-up on scroll for every section; that specific pattern is the clearest tell of a generated page and is explicitly excluded here.
- Respect `prefers-reduced-motion`: all of the above degrade to instant state changes with no animated transition.

---

## 8. Iconography & Imagery

No generic flat SaaS icon set (rounded-square outline icons in a single accent color scattered everywhere). Instead:
- A small custom icon set built around the ledger/kitchen metaphor: a stamp mark for "verified," a crate outline for inventory, a simple hand-drawn-feeling route line for delivery, a ledger-tab for reports. These can be built as simple single-stroke SVGs in `--ink` or the relevant semantic color — consistent stroke width (1.5px), no fills, no drop shadows on icons.
- No stock photography of generic smiling people in a warehouse. If imagery is needed (e.g. marketing page), prefer simple, warm illustrated textures (a paper-grain background texture at very low opacity behind hero sections) over photography, to keep the tone consistent and avoid the stock-photo tell.

---

## 9. Content & Voice Guidelines

Consistent with the "ledger kept by someone who cares" personality — plain, active, specific, never salesy inside the product itself (marketing page can be slightly more aspirational; in-app copy is strictly functional).

- Buttons name the exact action: "List surplus," "Claim listing," "Confirm receipt," "Approve organization" — never "Submit" or "Continue."
- The vocabulary stays consistent end-to-end: an item that is "Listed" produces a listing that NGOs see as "Available," never renamed to "Posted" or "Published" elsewhere.
- Empty states are invitations, not apologies: e.g. an NGO with no available listings nearby sees *"Nothing nearby right now — we'll notify you the moment something is listed"* rather than "No results found."
- Safety-gate rejections explain themselves plainly: *"This item wasn't listed — it's past the 4-hour safety window for cooked food."* Never vague ("Something went wrong") and never apologetic in tone.
- No exclamation-point enthusiasm, no "Woohoo!" on success states — confirmations are calm and factual: *"Delivery confirmed. Added to today's impact total."*

---

## 10. Accessibility & Responsive Floor

- All interactive elements have a visible keyboard focus ring using `--ring` (basil), never removed.
- Color is never the only signal for status — every status badge pairs color with a short text label and/or the icon set from Section 8.
- Minimum contrast: body text on `--ledger-paper` and on dark surface both meet WCAG AA at minimum.
- Fully responsive down to a 360px mobile viewport, with the Delivery Partner and NGO claim views designed mobile-first since those roles are most likely to be on a phone.
- Touch targets minimum 44px on mobile surfaces.

---

## 11. Summary Table for Implementation

| Element | Decision |
|---|---|
| Base palette | 5-color harvest/ledger system (Section 3) — not neutral+single-accent |
| Display type | Fraunces (serif, warm, editorial moments only) |
| UI type | IBM Plex Sans (+ IBM Plex Mono for tabular data) |
| Card shape | Varies by content: ticket-notch for listings, flat ledger rows for tables, pill only for status stamps |
| Shadows | Minimal, warm, only on true overlays — not on every card |
| Motion | One orchestrated moment per surface, functional micro-interactions only elsewhere |
| Icons | Custom single-stroke ledger/kitchen-metaphor set, no generic flat icon kit |
| Dark mode | Warm ink-based variant, not a literal color inversion |
| Voice | Plain, active, specific — consistent verb-to-outcome naming throughout |

---

## 12. Multi-Page Site Architecture & Navigation

Consistent with how Zomato, Swiggy, and other consumer/institutional platforms are structured: a **public marketing site** that anyone can browse without an account, and a **full authenticated application** that unlocks once someone logs in or signs up. This is not a single-page dashboard behind a login wall — it's a real multi-page site with its own navigation, footer, and content, followed by a distinct app shell post-login. All pages below follow the design language already defined in Sections 3–9 (ledger palette, Fraunces/IBM Plex type pairing, ticket-card language, restrained motion).

### 12.1 Public Site (pre-login) — Site Map

```
Home (/)
 ├─ How it works (/how-it-works)
 ├─ For Institutions (/institutions)      <- kitchens & processing units pitch
 ├─ For NGOs & Recipients (/ngos)         <- recipient-side pitch
 ├─ Pricing (/pricing)                    <- free vs premium tiers
 ├─ Impact (/impact)                      <- public, aggregate platform-wide stats
 ├─ About (/about)
 ├─ Log in (/login)
 └─ Sign up (/signup)
```

**Home (`/`)**: the hero described in Section 5.1 (ticket-strip animation, "Predict what's needed. Redistribute what's left. Measure what it meant."), followed by the four-stage pipeline as a numbered sequence, a "built for institutions, not individuals" positioning block, a public impact counter (live-feeling number of meals redistributed platform-wide, using the count-up motion from Section 7), and role-based entry points ("I run a kitchen," "I run an NGO," "I deliver") that route into the signup flow pre-filled with that role.

**How it works (`/how-it-works`)**: walks the full pipeline (Section 8 of the functional PRD) as a single long-form page — plan, prepare, detect, gate, match, deliver, confirm, measure — using the numbered ledger-tab marker treatment, since this content is a genuine sequence.

**For Institutions / For NGOs (`/institutions`, `/ngos`)**: audience-specific landing pages, same visual system, different hero copy and different feature emphasis (institutions see forecasting + ESG reporting first; NGOs see verified listings + reliability scoring first).

**Pricing (`/pricing`)**: two-column ledger-style comparison (not a 3-tier pricing-card grid with a "Most Popular" ribbon — that's a generic SaaS tell). Free vs. Premium laid out as ledger line-items, consistent with the "ledger" metaphor rather than typical pricing cards.

**Impact (`/impact`)**: public, platform-wide sustainability numbers (aggregate CO2e avoided, meals redistributed, institutions onboarded) — this is a legitimate public trust/transparency page, common on food-redistribution platforms, and reinforces credibility before signup.

**Public nav bar**: persistent top bar, `--ledger-paper` background, basil wordmark left-aligned, page links center/right, "Log in" as a quiet text link and "Sign up" as the one solid-basil button in the bar — not two equally-weighted buttons.

**Public footer** (Zomato/Swiggy-style full footer, appropriate for an institutional trust product): organized in columns — Product (How it works, Pricing, Impact), For Institutions, For NGOs, Company (About, Contact), Legal (Terms, Privacy, Food Safety Policy) — set in IBM Plex Sans, on a basil-tinted dark strip (using the dark ledger variant from Section 3), not the same paper background as the rest of the page, so the site has a clear "end."

### 12.2 Authenticated App (post-login) — Site Map

Once logged in, the person leaves the marketing site entirely and enters the app shell relevant to their role — same underlying design tokens, but app-shell navigation (persistent sidebar or top app-bar, not the marketing nav).

```
/onboarding                         <- role selection + profile completion (first login only)

/app/institution/                   <- Institution Admin
 ├─ overview                        (ledger-strip metrics + recent activity)
 ├─ inventory                       (full inventory table, Section 5.2)
 ├─ forecast                        (AI demand forecast, confidence bands in saffron)
 ├─ surplus-listings                (create/manage listings + live status)
 ├─ deliveries                      (active deliveries, stepper view)
 ├─ reports                         (ESG/sustainability export — premium gated)
 ├─ settings                        (institution profile, plan/billing)

/app/ngo/                           <- NGO / Recipient
 ├─ browse                          (ticket-card claimable listings, Section 5.3)
 ├─ my-claims                       (claimed/in-progress/history)
 ├─ impact                          (this org's own redistribution impact)
 ├─ organization                    (KYC profile, service area, capacity)

/app/delivery/                      <- Delivery Partner (mobile-first, dark variant default)
 ├─ assignments                     (current/available assignments)
 ├─ history                         (completed deliveries)
 ├─ profile

/app/admin/                         <- Platform Admin (plum-dominant chrome, Section 5.5)
 ├─ overview                        (platform-wide analytics)
 ├─ ngo-verification                (KYC approval queue)
 ├─ institutions                    (all onboarded institutions)
 ├─ safety-rules                    (configure gating thresholds)
 ├─ audit-log
 ├─ users
```

**App shell navigation**: left sidebar (collapsible on smaller viewports) for Institution Admin, NGO, and Platform Admin roles — sidebar item icons drawn from the custom ledger/kitchen icon set (Section 8), current-section indicated by a basil left-border tick rather than a filled highlight block. Top-right of the app shell holds the notification bell (Popover, per the functional PRD) and a profile menu (account, plan/billing, log out).

**Delivery Partner** gets a distinct mobile-app-like shell instead of a sidebar: a bottom tab bar (Assignments / History / Profile) in the dark ledger variant, consistent with Section 5.4 — this role is overwhelmingly used on a phone, so it should feel like a delivery app, not a scaled-down desktop dashboard.

**Transition from public site to app**: logging in or completing signup routes into `/onboarding` (first time only) then directly into that role's `overview`/`browse`/`assignments` landing page — the public marketing nav and footer disappear entirely; there is no bleed-through of marketing chrome into the authenticated app, matching how Zomato/Swiggy fully separate their marketing site from their logged-in ordering experience.

### 12.3 Additional Feature Pages Worth Including

A few pages beyond the functional PRD's core flows, in keeping with what a mature platform like this would ship:

- **Notifications center** (`/app/*/notifications`): full-page version of the notification bell's popover, for anyone with a long history of alerts.
- **Help / Support** (`/help`, accessible from both public site and app shell): searchable help content plus a contact path — every institutional platform needs this, especially one touching food safety.
- **Organization directory** (`/app/institution/network`, premium): lets an Institution Admin see (not contact directly) which verified NGOs are active in their area, building trust before their first listing.
- **Onboarding checklist** (shown on `overview` for new Institution/NGO accounts until dismissed): a short ledger-line checklist ("Add your first inventory item," "List your first surplus item") rather than a modal wizard — keeps new users oriented without interrupting the page.
