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
