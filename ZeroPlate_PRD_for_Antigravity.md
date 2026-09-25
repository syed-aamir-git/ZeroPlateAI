# Product Requirements Document (PRD)
## ZeroPlate.ai — AI-Powered Smart Food Waste Reduction & Sustainable Redistribution Ecosystem

**Version:** 2.0 (Consolidated — Strategy + Technical Build Spec)
**Type:** B2B Web Application — Full-stack Next.js
**Target audience for this document:** AI coding agent (Antigravity). This is the single source of truth — build directly from this document.

---

## 1. Problem Statement

Nearly one-third of food produced globally for human consumption is wasted (FAO), causing financial loss, resource inefficiency, and environmental degradation, while food insecurity persists among vulnerable populations. Institutional kitchens (colleges, hospitals, hotels, corporate cafeterias) and food processing units currently manage inventory, production, and surplus reactively — with no predictive intelligence, no systematic redistribution channel, and no measurable sustainability tracking. There is no unified, AI-driven system that connects **demand forecasting**, **surplus detection**, **safe redistribution**, and **operational efficiency monitoring** across both institutional food service and food processing.

## 2. Proposed Solution & Vision

ZeroPlate.ai is a B2B AI-powered platform that helps institutional kitchens and food processing units reduce food waste through demand forecasting, surplus/expiry detection, and safe redistribution to verified NGOs/recipients — with a built-in lightweight logistics module and sustainability/ESG reporting.

**Core pipeline:** Predict → Prevent → Redistribute → Measure Impact

A shared core engine (inventory, expiry/quality detection, surplus classification, redistribution matching, analytics) serves both verticals through configurable, segment-specific modules, avoiding the fragmentation of building two separate products.

**Final Product Vision:** A single AI-powered ecosystem where institutional kitchens and food processing units move from reactive waste disposal to proactive, data-driven food management — forecasting demand accurately, safely redistributing unavoidable surplus to verified recipients, and quantifying their sustainability impact — creating a circular, technology-enabled food system that is measurably more efficient, socially responsible, and environmentally sustainable.

## 3. Target Users & Stakeholders

**Target Users**
- Institutional kitchen administrators: colleges/hostels, hospitals, hotels, corporate cafeterias
- Food processing unit managers: dairy, bakery, RTE, packaged/FMCG plants
- NGOs, food banks, shelters, community kitchens (surplus recipients)
- Delivery/logistics partners (own volunteer/driver network)
- Platform administrators / sustainability officers

**Stakeholders**
Institutions (kitchens + processing units), NGOs/recipients, logistics partners, regulatory bodies (FSSAI), platform operators/investors, and indirectly, food-insecure communities.

## 4. Core Value Proposition & Differentiators

**"The B2B operating system for institutional food waste — from forecasting to redistribution to ESG reporting — purpose-built for institutions, not consumers."**

Unlike consumer apps (Too Good To Go, No Food Waste), this platform is built for the operational realities of institutional kitchens and processing units: bulk volumes, compliance needs, procurement workflows, and measurable ESG outcomes.

**Unique/Innovative Differentiators**
- Institutional/B2B focus (vs. consumer-facing competitors)
- Unified pipeline across forecasting, redistribution, AND processing-unit efficiency
- Phased hardware roadmap (manual → computer vision → IoT) — realistic, not hardware-dependent from day one
- Own lightweight logistics module with Swiggy-style UX without full gig-economy overhead
- ESG/sustainability reporting as a monetizable, compliance-relevant output

## 5. Goals & Non-Goals

**Goals**
1. Let institutions log inventory/production and get AI demand forecasts to reduce overproduction.
2. Detect surplus/near-expiry food and safely list it for redistribution.
3. Match surplus to verified NGOs/recipients and coordinate pickup/delivery.
4. Give institutions dashboards showing waste prevented, meals redistributed, and sustainability impact.

**Non-Goals (explicitly out of scope for MVP)**
- Computer-vision-based food quality grading (Phase 2)
- IoT sensor integration for storage conditions (Phase 3)
- Live GPS tracking for delivery partners (Phase 2 — MVP uses status-based tracking, not a live map)
- Payment processing / e-commerce for secondary buyers (Phase 3)
- Native mobile apps (MVP is a responsive web app only, mobile-first with Tailwind/shadcn)
- Multi-language support (English only for MVP)

---

## 6. Tech Stack

- **Framework**: Next.js (App Router), TypeScript
- **UI**: shadcn/ui components + Tailwind CSS
- **Database**: MongoDB, accessed via the official native **MongoDB Node.js driver** (no ODM/Mongoose — plain typed collections via a shared `lib/mongodb.ts` connection singleton suited to Next.js serverless functions)
- **Auth**: **better-auth**, configured with:
  - Email + password provider
  - Google OAuth provider
  - Session handling via better-auth's built-in session/cookie management, backed by MongoDB as the auth adapter's storage
- **API layer**: Next.js Route Handlers (`app/api/.../route.ts`) — no separate Express server; all backend logic lives inside the Next.js app
- **ML/forecasting service**: Python + FastAPI microservice, called from Next.js Route Handlers via internal HTTP calls (kept separate from the main app since Node isn't ideal for time-series/ML work)
- **Notifications**: Email via a transactional email provider (e.g. Resend/Nodemailer) triggered from Route Handlers
- **Hosting**: Vercel (Next.js app) + MongoDB Atlas + a small separate host (e.g. Render/Fly.io) for the Python ML microservice
- **Geography/compliance target**: India-first (FSSAI-aligned food safety norms, Indian NGO ecosystem), architected for easy international expansion later

---

## 7. User Roles & Permissions

| Role | Description | Key Permissions |
|---|---|---|
| **Institution Admin** | Manages a kitchen or processing unit account | CRUD inventory/production data, view forecasts, list surplus, view own analytics dashboard |
| **NGO/Recipient** | Verified organization receiving surplus food | Browse/claim available surplus listings, manage org profile, confirm receipt |
| **Delivery Partner** | Person assigned to pick up/deliver surplus | View assigned pickups, update delivery status (assigned → picked up → delivered) |
| **Platform Admin** | Super-admin | Verify/approve NGO KYC, configure safety-threshold rules, view platform-wide analytics, manage all users |

**Auth implementation notes:**
- `role` is stored as a custom field on the better-auth user record (extend the user schema with `role: "institution_admin" | "ngo" | "delivery_partner" | "platform_admin"`).
- Google OAuth sign-up defaults new users to an incomplete profile; redirect to a "complete your profile" page to pick role + fill role-specific fields (Google alone can't tell us if someone is an NGO or institution).
- Email/password sign-up should include a role selector in the registration form itself.
- All Route Handlers must validate the session (via better-auth's server-side session helper) and check `role` before performing role-restricted actions — never trust a client-sent role.

---

## 8. Complete User Workflow (End-to-End)

1. **Planning**: Kitchen/unit logs planned production/menu; forecasting model predicts expected demand and likely surplus.
2. **Preparation & Tracking**: Inventory logged (manual → later CV/IoT); consumption tracked in real time.
3. **Surplus Detection**: System flags surplus/nearing-expiry items via manual entry + safety-threshold rules (+ CV in later phase).
4. **Safety Gating**: Automated rules check time-since-cooked/temperature/expiry; unsafe items auto-blocked from listing.
5. **Redistribution Matching**: Surplus matched to nearest eligible verified NGO/recipient by the matching engine.
6. **Logistics**: Platform assigns nearest available delivery partner (own lightweight module); status tracked through pickup/drop.
7. **Confirmation & Feedback**: Recipient confirms receipt; kitchen/unit gets confirmation and impact credit.
8. **Analytics & Reporting**: Waste prevented, food redistributed, cost savings, carbon footprint rolled into dashboards/ESG reports.

## 9. Core User Stories

### Institution Admin
- As an Institution Admin, I can register (email/password or Google) and complete my institution profile (type: college/hospital/hotel/corporate-cafeteria/processing-unit).
- As an Institution Admin, I can log daily inventory items (name, category, quantity, unit, prepared/received date, expiry or best-before estimate).
- As an Institution Admin, I can view an AI-generated demand forecast for the next 1–7 days based on my historical logs.
- As an Institution Admin, I can mark an inventory item as surplus (manually, or system auto-flags items nearing expiry based on safety-threshold rules).
- As an Institution Admin, I can list a surplus item for redistribution (quantity, pickup window, pickup location, safety status).
- As an Institution Admin, I can view real-time status of my active surplus listings (pending, matched, picked up, delivered).
- As an Institution Admin, I can view a dashboard: total waste prevented, meals redistributed, cost savings estimate, CO2e avoided.
- As an Institution Admin, I can export a sustainability/ESG summary report (PDF or CSV) — premium feature.

### NGO/Recipient
- As an NGO, I can register (email/password or Google) and submit KYC details (org name, registration number, contact, service area, capacity).
- As an NGO, my account must be approved by a Platform Admin before I can claim listings.
- As an NGO, I can browse/search available surplus listings near my location.
- As an NGO, I can claim a listing (which triggers matching + delivery assignment).
- As an NGO, I can confirm receipt of a delivered item (closes the loop, updates impact metrics).

### Delivery Partner
- As a Delivery Partner, I can view assignments (pickup location, drop location, time window).
- As a Delivery Partner, I can accept an assignment and update its status through pickup → delivered.

### Platform Admin
- As a Platform Admin, I can review and approve/reject NGO KYC submissions.
- As a Platform Admin, I can configure food-safety thresholds (e.g. max hours since cooked, category-based shelf-life defaults).
- As a Platform Admin, I can view platform-wide analytics across all institutions.

---

## 10. Key Features Overview

**Shared Core (both verticals)**: smart inventory & expiry tracking, AI demand/consumption forecasting, surplus detection & classification, redistribution matching engine, recipient/organization management (KYC-verified), pickup & delivery coordination, real-time notifications/alerts, food safety & eligibility gating, waste analytics dashboards, sustainability/ESG reporting, role-based access control.

**Kitchen-specific**: meal-level plate waste tracking, dietary/safety rule configuration (hospitals), occupancy-based forecasting (hotels), academic-calendar-aware forecasting (colleges).

**Processing-unit-specific**: batch/production-run tracking, raw material yield & loss monitoring, machine downtime & energy usage detection (future phase), secondary-buyer marketplace for surplus/by-products (future phase).

## 11. AI/ML Features & Approach

| Function | Approach | Justification |
|---|---|---|
| Demand/surplus forecasting | Time-series model (Prophet/ARIMA for MVP, LSTM/Transformer as it matures) | Captures seasonality, calendar effects, trend shifts; cold-start fallback to rule-based average with a "low confidence" flag |
| Food quality/freshness detection | CNN-based computer vision (Phase 2) | Genuinely needs deep learning; classical methods can't do image classification well |
| Redistribution matching | Weighted scoring function (distance + capacity fit + reliability), computed server-side | Classical scoring is the right tool here — matching is a constrained optimization problem, not one that benefits from deep learning complexity |
| Route optimization | Classical (nearest-available assignment for MVP; VRP/OR-Tools-style optimization later) | Routing is a solved optimization problem |
| Anomaly detection (overproduction, downtime) | Statistical/ML anomaly detection (future phase) | Lean ML is sufficient and more explainable for operational alerts |

---

## 12. Functional Requirements by Module

### 12.1 Auth Module (better-auth)
- Email/password registration + login.
- Google OAuth registration + login.
- Post-signup role selection + profile completion flow.
- Session-protected routes using better-auth middleware in `middleware.ts` — redirect unauthenticated users to `/login`, redirect users without a completed role/profile to `/onboarding`.
- Role-based access checks in every Route Handler (never rely on frontend route protection alone).

### 12.2 Inventory & Forecasting Module
- CRUD for inventory items, scoped per institution (Institution Admin only).
- Historical inventory/consumption data feeds the forecasting service.
- Forecast output surfaced on the Institution dashboard with a confidence indicator, fetched from the Python microservice via a Next.js Route Handler that proxies the request.

### 12.3 Surplus Detection & Safety Gating Module
- Any inventory item can be manually flagged "surplus" by the Institution Admin.
- System auto-flags items as "nearing expiry" when current time is within X hours of the item's expiry/best-before estimate (X configurable per food category by Platform Admin).
- **Safety gating logic (must run server-side, before a listing is allowed to go live):**
  - Reject listing if item is past its safety threshold (e.g. cooked food older than configured max hours).
  - Reject listing if required fields (quantity, pickup window, category) are missing.
  - Otherwise, allow listing with a "Verified Safe to List" status.
  - **Fail closed**: if a rule check errors, default to blocking the listing, never allowing it.
- All gating decisions are logged (audit trail) in a MongoDB `auditLogs` collection with timestamp and rule applied — required for liability traceability.
- **Liability framing**: the platform positions itself as a facilitator, not a guarantor, of food safety — combined with verified-recipient-only access (see 12.8) and automated gating, this is the dual-layer safety approach.

### 12.4 Redistribution Matching Module
- When a surplus listing goes live, the matching engine ranks eligible, KYC-approved NGOs by: proximity, capacity fit, and NGO reliability score (based on completed pickups vs. no-shows).
- NGOs can also browse/search listings directly (pull model) in addition to receiving notifications (push model).
- Once an NGO claims a listing, it's locked via an atomic MongoDB update (e.g. `findOneAndUpdate` with a status-check filter) to prevent double-claiming race conditions.

### 12.5 Logistics / Delivery Module
- Own lightweight delivery-partner workforce (volunteers/NGO drivers), not a third-party courier marketplace — Swiggy-style assignment UX without the full gig-economy overhead.
- Simple assignment: nearest available delivery partner to the pickup location is offered the assignment first.
- Delivery status lifecycle: `assigned → accepted → picked_up → delivered → confirmed`.
- No live GPS tracking for MVP — status updates are manually triggered by the delivery partner via button taps, shown as a step-tracker UI (shadcn `Stepper`/`Progress` component) to Institution and NGO.
- NGO must explicitly confirm receipt to close the loop and count toward impact metrics.

### 12.6 Notifications Module
- Trigger email notifications for: new matching listing available (NGOs), listing claimed (Institution), delivery status changes (relevant parties), KYC approval/rejection (NGOs).
- In-app notification bell (shadcn `Popover` + list) backed by a `notifications` MongoDB collection.

### 12.7 Analytics & Sustainability Dashboard Module
- Per-institution dashboard: total surplus listed, total redistributed (kg/meals), waste prevented estimate, cost savings estimate, CO2e avoided (documented conversion factor, e.g. kg food waste → kg CO2e per FAO/standard reference).
- Platform-admin dashboard: aggregate metrics across all institutions.
- Exportable report (PDF/CSV) — premium feature; UI shows an upsell state if not entitled.
- Charts via a shadcn-compatible charting library (e.g. Recharts).

### 12.8 User & Role Management Module
- NGO registration starts in `kycStatus: pending`; cannot claim listings until `approved` by Platform Admin — this is the verified-recipient-only layer of the food safety approach.
- Institution Admin and Delivery Partner accounts are active immediately upon email verification/Google sign-in (no KYC gate needed for MVP, since food-safety risk sits primarily on the listing/recipient side).
- Platform Admin accounts are seeded manually (not self-registrable) for MVP.

---

## 13. Data Model (MongoDB Collections)

Using the native MongoDB driver — define TypeScript interfaces per collection and access via a shared `getDb()` helper. No schema enforcement at the driver level, so validate all writes at the Route Handler level (e.g. with `zod`).

```ts
// users (managed primarily by better-auth, extended with custom fields)
User {
  _id: ObjectId
  email: string
  name: string
  role: "institution_admin" | "ngo" | "delivery_partner" | "platform_admin"
  profileCompleted: boolean
  createdAt: Date
}

Institution {
  _id: ObjectId
  userId: ObjectId          // ref users._id
  name: string
  type: "college" | "hospital" | "hotel" | "corporate_cafeteria" | "processing_unit"
  address: string
  location: { lat: number; lng: number }
  plan: "free" | "premium"
  createdAt: Date
}

InventoryItem {
  _id: ObjectId
  institutionId: ObjectId
  name: string
  category: string
  quantity: number
  unit: string
  preparedOrReceivedAt: Date
  expiryEstimateAt: Date
  status: "in_stock" | "surplus" | "listed" | "expired"
  createdAt: Date
}

SurplusListing {
  _id: ObjectId
  inventoryItemId: ObjectId
  institutionId: ObjectId
  quantity: number
  pickupWindow: { start: Date; end: Date }
  pickupLocation: { lat: number; lng: number; address: string }
  safetyStatus: "verified_safe" | "rejected"
  status: "pending" | "matched" | "claimed" | "delivered" | "expired"
  createdAt: Date
}

NGO {
  _id: ObjectId
  userId: ObjectId
  orgName: string
  registrationNumber: string
  contactPhone: string
  serviceArea: string
  capacityPerWeek: number
  kycStatus: "pending" | "approved" | "rejected"
  reliabilityScore: number
  location: { lat: number; lng: number }
  createdAt: Date
}

Match {
  _id: ObjectId
  surplusListingId: ObjectId
  ngoId: ObjectId
  score: number
  status: "proposed" | "claimed" | "rejected"
  createdAt: Date
}

DeliveryAssignment {
  _id: ObjectId
  matchId: ObjectId
  deliveryPartnerId: ObjectId
  status: "assigned" | "accepted" | "picked_up" | "delivered" | "confirmed"
  assignedAt: Date
  deliveredAt?: Date
}

Notification {
  _id: ObjectId
  userId: ObjectId
  type: string
  message: string
  readStatus: boolean
  createdAt: Date
}

AuditLog {
  _id: ObjectId
  entityType: string
  entityId: ObjectId
  action: string
  ruleApplied: string
  performedBy: ObjectId
  createdAt: Date
}
```

Recommended indexes: `Institution.userId`, `InventoryItem.institutionId`, `SurplusListing.status`, `SurplusListing.pickupLocation` (2dsphere geo index for proximity queries), `NGO.userId`, `NGO.location` (2dsphere), `Match.surplusListingId`.

---

## 14. API Requirements (Next.js Route Handlers)

Base pattern: `app/api/v1/{resource}/route.ts` and `app/api/v1/{resource}/[id]/route.ts`. Every handler must call better-auth's server-side session getter first and reject with 401/403 as appropriate.

- `app/api/auth/[...all]/route.ts` — better-auth's catch-all handler (handles login/register/OAuth callbacks/session)
- `GET/POST /api/v1/inventory` — list/create inventory items (institution-scoped)
- `PATCH /api/v1/inventory/:id` — update item (e.g. mark surplus)
- `GET /api/v1/forecast/:institutionId` — proxies to Python ML microservice
- `POST /api/v1/surplus-listings` — create a listing (runs safety gating server-side)
- `GET /api/v1/surplus-listings` — browse listings (NGO view, filterable by location/category)
- `POST /api/v1/surplus-listings/:id/claim` — NGO claims a listing (atomic update, triggers match + delivery assignment)
- `GET/PATCH /api/v1/delivery-assignments/:id` — view/update delivery status
- `POST /api/v1/ngo/:id/approve` — Platform Admin approves NGO KYC
- `GET /api/v1/analytics/institution/:id` — dashboard data
- `GET /api/v1/analytics/institution/:id/export` — ESG report export (premium)
- `GET /api/v1/notifications` — user's notifications

---

## 15. Key Pages / UI (App Router structure)

```
app/
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  onboarding/page.tsx                 // role selection + profile completion
  dashboard/
    institution/page.tsx              // Institution Admin dashboard
    ngo/page.tsx                      // NGO browse/claim dashboard
    delivery/page.tsx                 // Delivery Partner assignments
    admin/page.tsx                    // Platform Admin panel
  inventory/page.tsx                  // Inventory CRUD (institution)
  surplus-listings/page.tsx           // Create/manage listings (institution) + browse (NGO)
  api/
    auth/[...all]/route.ts
    v1/...                            // as listed in Section 14
```

UI built with shadcn components: `Card`, `Table`, `DataTable`, `Dialog` (create/edit forms), `Form` (with `react-hook-form` + `zod`), `Badge` (status indicators), `Stepper`/`Progress` (delivery status), `Tabs` (role dashboards), `Chart` components (Recharts-based) for analytics.

---

## 16. MVP Scope & Build Priority

**MVP includes** (in build order):
1. Set up Next.js app, MongoDB driver connection singleton, better-auth config (email/password + Google), `middleware.ts` route protection.
2. Onboarding flow: role selection + profile completion for all 4 roles.
3. Institution: inventory CRUD (Route Handlers + shadcn `DataTable`/`Form`).
4. Surplus flagging (manual + basic rule-based auto-flagging) + safety gating logic.
5. Surplus listing creation + NGO browse/claim flow (with atomic claim update).
6. Basic matching (weighted scoring function).
7. Delivery assignment + status tracking (step-tracker UI, no live map).
8. NGO KYC approval flow (Platform Admin panel).
9. Institution dashboard (basic metrics + charts).
10. Demand forecasting (Python microservice + proxy Route Handler).
11. ESG export (simple formatted PDF/CSV) with premium gating.

## 17. Future Enhancements (Post-MVP)

- Computer-vision-based freshness/quality grading
- IoT sensors for storage condition monitoring
- Live GPS tracking for delivery partners
- Processing-unit machine downtime/energy anomaly detection
- Secondary-buyer marketplace
- POS/ERP integration for automatic data ingestion
- Predictive procurement recommendations 
- Multi-language support, international expansion

---

## 18. Required Data & Seed/Demo Data

**Required data types**: historical meal/production counts, menu data, attendance/occupancy data; inventory logs; expiry/shelf-life reference data per food category; NGO/recipient capacity, dietary restrictions, location data; delivery partner location/availability.

**Data sources**: FAO/FSSAI food-waste statistics, Kaggle consumption/restaurant datasets, Food-101 (for future CV pretraining), blended with synthetically generated data (realistic seasonal/calendar-driven demand patterns) — architected so real institutional data can flow in later via the same ingestion layer without re-architecture.

**Seed the MongoDB database with:**
- 2–3 sample institutions (one college, one hospital) with 30+ days of historical inventory logs (synthetically generated — weekday vs weekend variation, exam-week spikes for the college).
- 3–5 sample NGOs with varied location/capacity, at least one in `kycStatus: approved`.
- A few sample delivery partners.
- One seeded Platform Admin account (not self-registrable).
- Enough historical data volume for the forecasting model to produce a non-trivial output.

---

## 19. Security & Privacy Considerations

- better-auth handles password hashing and session security; all Route Handlers validate session + role server-side; input validation via `zod` on every write endpoint.
- Role-based access control across all four roles.
- KYC verification for NGOs/recipients to prevent misuse.
- Audit logs for all surplus listings and safety-gate decisions (liability traceability).
- Data minimization: NGO/recipient data limited to what's needed for verification and delivery — no unnecessary PII stored.
- Rate-limited APIs; paginate all list endpoints (cursor or skip/limit).

## 20. Food Safety Considerations

Dual-layer approach:
1. **Automated safety gating** — rule-based thresholds (time-since-cooked, temperature, expiry window) block unsafe listings by default, category-specific shelf-life rules (cooked food vs. packaged vs. raw), fail-closed on rule-check errors.
2. **Verified-recipient-only network** — NGOs/recipients must pass KYC approval before they can claim listings.

Combined with clear liability disclaimers positioning the platform as a facilitator, not a guarantor, and mandatory recipient confirmation to close the loop and maintain an audit trail.

## 21. Scalability Strategy

- Shared core engine with vertical-specific configuration layers (kitchens vs. processing units) avoids duplicate builds.
- Microservice-based ML layer (Python/FastAPI) scales independently of the Next.js core.
- Phased hardware rollout (manual → CV → IoT) avoids upfront infrastructure cost.
- Multi-tenant data model supports onboarding new institutions without re-architecture.
- India-first design with modular compliance rules for future international expansion.

## 22. Sustainability Metrics

Meals/kg of food redistributed, waste prevented (kg, ₹ value), carbon footprint reduction (CO2e avoided from decomposition/production), water/land resource savings estimate, ESG compliance report generation, cost savings per institution.

## 23. Monetization (Freemium)

- **Free tier**: inventory tracking, basic forecasting, surplus listing, matching, delivery coordination, basic dashboard.
- **Paid tier**: advanced AI analytics, ESG/compliance report export, priority matching, logistics at scale.
- MVP does not need real payment integration — represent tier via a `plan: "free" | "premium"` field on `Institution` (already in the data model), and gate the export endpoint/UI accordingly (with an upsell state) so the business model is visible in the demo.

---

## 24. Non-Functional Requirements

- **Performance**: dashboard queries return in <2s for MVP data volumes.
- **Reliability**: safety-gating logic fails closed.
- **Auditability**: every safety-gating decision and KYC approval/rejection logged in `AuditLog`.
- **Usability**: mobile-responsive, simple enough for non-technical NGO staff to use (clear buttons, minimal jargon).

## 25. Key Success Metrics (Product & Demo)

- % reduction in food waste per institution (before/after)
- Meals recovered and redistributed
- NGO/recipient satisfaction and repeat engagement
- Forecast accuracy (MAPE on demand predictions)
- Delivery success rate / time-to-pickup
- Cost savings reported by institutions
- Number of institutions/processing units onboarded
- **Demo-specific**: end-to-end flow works (list → claim → deliver → confirm → dashboard updates); Google OAuth and email/password both work across roles; safety gating correctly blocks an expired/unsafe test listing; dashboard numbers are computed, not hardcoded.

## 26. Potential Challenges & Solutions

| Challenge | Solution |
|---|---|
| Staff non-compliance with manual logging | Simple UX, incentives, gradual CV automation |
| NGO/recipient no-shows or fraud | KYC verification, rating system, audit trail |
| Food safety liability | Automated gating + verified network + legal disclaimers |
| Cold-start ML (no historical data) | Public + synthetic data, rule-based fallback until enough real data accumulates |
| Delivery coordination at scale | Own lightweight assignment algorithm, phased from NGO self-pickup to full logistics |
| Institutional adoption resistance | Freemium model lowers entry barrier; ESG reporting appeals to compliance-driven institutions |
| Claim race conditions (two NGOs claiming the same listing) | Atomic MongoDB `findOneAndUpdate` with status-check filter |
| Google OAuth users lacking a role | Mandatory post-signup onboarding step to select role + complete profile |
