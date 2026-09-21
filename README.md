# 🍽️ ZeroPlate AI

### Intelligent Food Waste Reduction & Sustainable Redistribution Ecosystem

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20%2B%20TypeScript-blue?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![UN SDGs](https://img.shields.io/badge/UN%20SDGs-2%20%7C%2012%20%7C%2013-brightgreen)](https://sdgs.un.org/)

> **ZeroPlate AI** is an AI-powered, closed-loop food waste management and safe redistribution platform designed for institutional kitchens (universities, colleges, hospitals, and corporate dining halls) and verified community NGOs.
>
> Unlike simple waste trackers, ZeroPlate AI operates a self-calibrating closed loop: **Predict Demand → Produce Optimally → Monitor Inventory → Audit Residuals → Match with Verified Shelters → Optimize Safe Transit → Measure ESG Impact → Feed Outcomes Back into Tomorrow's Forecast.**

---

## 📌 The Problem
* **Chronic Over-Preparation**: Institutional kitchens routinely over-cook by **15–25% daily** due to fluctuating attendance, weather shifts, exam seasons, and hostel leaves.
* **Cold-Chain & Food Safety Risks**: Leftover food is often discarded because kitchens lack rapid, food-safety compliant channels to dispatch warm, edible food before it spoils.
* **Coordination Gaps**: Local night shelters, orphanages, and community fridges experience severe meal shortages just kilometers away from dining halls discarding hundreds of fresh portions.
* **Absence of a Learning Loop**: Kitchens repeat identical batch sizing errors because yesterday's wasted trays are never fed back into tomorrow's raw ration purchase ledger.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- Python 3.10+ (for forecasting microservice)
- MongoDB Atlas cluster URI or local MongoDB instance

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/syed-aamir-git/ZeroPlateAI.git
cd ZeroPlateAI

# Install Node dependencies
npm install
```

### 2. Environment Setup
Copy the example environment file and configure your credentials:
```bash
cp .env.example .env.local
```
Add your `MONGODB_URI`, `BETTER_AUTH_SECRET`, and optional `GOOGLE_CLIENT_ID` in `.env.local`.

### 3. Run Development Servers
Start the Next.js application:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Python Forecasting Microservice (Optional but Recommended)
The ML demand forecasting service runs on FastAPI and provides time-series predictions for meal preparation:
```bash
cd forecast_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
The microservice will be available at `http://localhost:8000` (`/health` and `/forecast`).

### 5. Initialize Database & Create Platform Admin
To set up MongoDB indexes and create your initial platform super-admin account:
```bash
# Set up collections & 2dsphere geo indexes
node scripts/setup-atlas-db.mjs

# Bootstrap the platform super-admin account
node scripts/create-platform-admin.mjs
```
> **Default Admin Credentials**:
> - Email: `platform_admin@zeroplate.ai`
> - Password: `ZeroPlateAdmin2026!Secure`

*(Optional)* If you want a local self-contained MongoDB instance without Atlas, run:
```bash
node scripts/local-mongo.mjs
```

---

## ✨ Key Platform Features

### 1. 🧠 AI Demand & Surplus Forecasting
- **Time-Series ML Engine**: FastAPI microservice utilizing ARIMA models and adaptive moving-average baselines.
- **Granular Recommendations**: Generates 1–7 day meal prep estimates across cooked foods, dairy, bakery, and produce.
- **Overproduction Prevention**: Identifies risk spikes before cooking begins to adjust raw material requisition.

### 2. 🛡️ Automated Multi-Criteria Food Safety Gating
- **Fail-Closed Architecture**: Any missing safety parameter or evaluation timeout automatically blocks the listing.
- **FSSAI Norm Alignment**: Strict limits on elapsed hours since cooking, category shelf-life, and pickup time windows.
- **Tamper-Proof Audit Logging**: Every gating decision is immutably recorded in the MongoDB `auditLogs` collection.

### 3. 🎯 Weighted Algorithmic Redistribution Matching
- **Multi-Factor Ranking Engine**: Pairs surplus with verified recipients using a balanced scoring formula:
  $$\text{Score} = (0.45 \times \text{Proximity}) + (0.35 \times \text{Capacity Fit}) + (0.20 \times \text{Reliability Score})$$
- **Geospatial Queries**: Uses spherical Haversine calculations and MongoDB `2dsphere` indexes.
- **Atomic Locking**: Eliminates double-claiming race conditions using atomic MongoDB transactions.

### 4. 🚚 Lightweight Logistics & Safe Transit Tracking
- **Zero-Overhead Coordination**: Mobilizes in-house drivers and volunteer networks without third-party gig marketplace overhead.
- **Step-by-Step Status Flow**: `assigned` ➔ `accepted` ➔ `picked_up` ➔ `delivered` ➔ `confirmed`.
- **Recipient Confirmation**: Deliveries require explicit receipt confirmation by the NGO to close the loop.

### 5. 📊 ESG & Sustainability Impact Engine
- **Carbon Avoidance**: Converts rescued food mass into GHG emissions prevented ($2.5\text{ kg CO}_2\text{e}$ per kg food waste avoided, FAO standard).
- **Social Impact Metrics**: Automatically calculates meals provided and virtual water conserved.
- **Audit-Ready Exports**: Generates sustainability reports for CSR reporting and compliance.

---

## 👥 User Roles & Portals

| Portal | Role | Key Capabilities |
| :--- | :--- | :--- |
| **Institution** | `institution_admin` | Log daily raw/cooked inventory, view 7-day AI forecasts, list surplus items, track dispatch status, and monitor ESG impact dashboards. |
| **NGO / Shelter** | `ngo` | Submit KYC details for verification, browse nearby safe surplus listings, claim batches, and confirm food receipt. |
| **Delivery Fleet** | `delivery_partner` | View assigned pickups, navigate to locations, and update transit statuses (`accepted`, `picked_up`, `delivered`). |
| **Platform Admin** | `platform_admin` | Approve/reject NGO KYC submissions, configure category food-safety thresholds, inspect audit logs, and view platform-wide analytics. |

---

## ⚙️ Environment Variables

Create a `.env.local` file with the following keys:

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas connection string or local MongoDB URI |
| `MONGODB_DB_NAME` | **Yes** | `ZeroPlate_ai_MVP` | Primary database name |
| `BETTER_AUTH_SECRET` | **Yes** | — | 32+ character random secret for signing auth tokens |
| `BETTER_AUTH_URL` | **Yes** | `http://localhost:3000` | Application base URL |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID for social sign-in |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `FASTAPI_FORECAST_URL` | No | `http://localhost:8000` | Python forecasting microservice endpoint |
| `RESEND_API_KEY` | No | — | Resend API key for transactional email alerts |
| `EMAIL_FROM` | No | `ZeroPlate <notifications@...>` | Sender email address header |

---

## 🧪 Verification & Automated Test Suites

ZeroPlate AI includes integration and verification scripts in the `scripts/` directory:

```bash
# Verify authentication and role-based access control
node scripts/test-auth-flow.mjs

# Verify multi-criteria food safety gating and fail-closed rules
node scripts/test-safety-gating.mjs

# Verify weighted matching algorithm and forecasting integration
node scripts/test-matching-logistics-forecast.mjs

# Verify NGO discovery, atomic claim, and delivery confirmation
node scripts/test-ngo-experience.mjs

# Verify delivery partner assignment and status lifecycle
node scripts/test-delivery-experience.mjs

# Verify admin KYC verification and safety rule controls
node scripts/test-admin-experience.mjs

# Run full platform end-to-end stage verification
node scripts/test-final-verification.mjs
```

---

## 📜 Regulatory Alignment & UN SDGs

- **FSSAI Guidelines**: Designed around Food Safety and Standards Authority of India (FSSAI) norms for surplus food redistribution and Good Samaritan food donor protections.
- **UN Sustainable Development Goals**:
  - **SDG 2 (Zero Hunger)**: Channeling edible institutional surplus to food-insecure communities.
  - **SDG 12 (Responsible Consumption & Production)**: Preventing institutional food over-preparation through predictive intelligence.
  - **SDG 13 (Climate Action)**: Reducing methane emissions from organic waste entering landfills.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
