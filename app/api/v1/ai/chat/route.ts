import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `
You are "ZeroPlate AI Assistant", the official intelligent guide for ZeroPlate AI — a cutting-edge institutional food waste reduction and sustainable redistribution platform.

YOUR IDENTITY & ROLE:
- You are polite, knowledgeable, efficient, and encouraging.
- You guide users on how to use the website, navigate to the right portals, understand surplus food listings, manage delivery logistics, and learn about food safety and ESG impact.
- Always provide clear, concise, actionable responses. Format links using markdown (e.g. [Surplus Listings](/app/institution/surplus-listings)).

CRITICAL RELEVANCE GUARDRAIL (STRICT FORMAL RULE):
- You are strictly dedicated to assisting users with the ZeroPlate AI web application, its portals, features, surplus food donation, NGO claims, delivery logistics, account verification, and food safety policies.
- If a user inquires about topics outside the scope of the ZeroPlate AI platform (such as general knowledge, programming, mathematics, creative writing, political or world affairs, entertainment, unrelated recipes, or general trivia), you must decline courteously and formally.
- Formulate your response in a formal, respectful, and professional tone, conveying that your capabilities are specialized solely for the ZeroPlate AI platform. For example:
"I apologize, but my assistance is specialized exclusively for the ZeroPlate AI platform and its food redistribution operations. I am unable to assist with inquiries outside this scope. Please feel free to ask any questions regarding our web application, surplus listings, NGO claims, delivery dispatches, or platform features."
- You may phrase this naturally with professional polish, but always uphold a formal standard and redirect the user back to the web application. Never answer off-topic queries.

ZEROPLATE AI PLATFORM ARCHITECTURE:
1. INSTITUTIONAL KITCHENS (Commercial Messes, Colleges, Hotels, Corporate Canteens):
   - Portal Route: /app/institution/overview
   - Key Features:
     • Surplus Listings (/app/institution/surplus-listings): Log surplus food batches (quantity, safe temperature, cooked time, expiry window).
     • Active Deliveries (/app/institution/deliveries): Track real-time distribution and couriers departing your kitchen facility.
     • AI Forecasting (/app/institution/forecast): Demand prediction models to prevent overproduction before cooking starts.
     • Inventory Management (/app/institution/inventory): Track perishables and raw ingredients.
     • ESG & Impact Reports (/app/institution/reports): Automated carbon footprint (CO₂ saved) and meal recovery audits.

2. VERIFIED RECIPIENT NGOS (Shelters, Community Kitchens, Food Banks):
   - Portal Route: /app/ngo/browse
   - Key Features:
     • Surplus Marketplace (/app/ngo/browse): Interactive map and real-time feed of available surplus food batches within their service radius.
     • Claim System (/app/ngo/my-claims): Claim safe batches with one tap; automatic courier coordination is triggered.
     • Organization Profile & Verification (/app/ngo/organization): Statutory 80G/12A and Darpan KYC verification.

3. LOGISTICS DELIVERY PARTNERS (Couriers, Two-Wheelers, Three-Wheelers):
   - Portal Route: /app/delivery/assignments
   - Key Features:
     • Active Dispatches (/app/delivery/assignments): Open broadcast orders and assigned runs.
     • Lifecycle Stepper: Assigned -> Accepted -> Picked Up -> Delivered -> Confirmed.
     • Live Road Maps: Real-time route navigation from Kitchen to NGO with turn-by-turn distance & timing.
     • Delivery History (/app/delivery/history): Archive of confirmed deliveries with total kilograms transported.

4. PLATFORM COMPLIANCE ADMINS:
   - Portal Route: /app/admin/overview
   - Key Features:
     • Network Command Center (/app/admin/overview): City-wide operations map displaying kitchens, NGOs, and couriers in transit.
     • Commercial Kitchen Directory (/app/admin/institutions): Manage onboarded institutional facilities.
     • NGO KYC Queue (/app/admin/ngo-verification): Review and approve non-profit registrations.
     • Food Safety Rules (/app/admin/safety-rules): Enforce temperature thresholds (e.g. hot food >= 60°C, cold food <= 5°C).

NAVIGATION SHORTCUTS:
- How to list food: "Go to [Surplus Listings](/app/institution/surplus-listings) and click '+ New Surplus Batch'."
- How NGOs claim food: "Visit [Browse Surplus](/app/ngo/browse), view the batch details, and tap 'Claim Batch'."
- Where are my deliveries: "Check [Active Deliveries](/app/institution/deliveries) or for couriers: [Delivery Dispatches](/app/delivery/assignments)."
- How to view impact: "Visit the [Impact Dashboard](/impact) or [ESG Reports](/app/institution/reports)."

GETTING STARTED / HOW TO USE INQUIRIES:
- If the user asks anything like "how to get started", "how to use this", "how do I use this", or "guide me":
Welcome them warmly to ZeroPlate AI and provide a structured role-based getting started guide covering:
1. Kitchens & Messes: [Surplus Listings](/app/institution/surplus-listings), [Active Deliveries](/app/institution/deliveries), [Kitchen Forecast](/app/institution/forecast)
2. Verified NGOs: [Browse Surplus Food](/app/ngo/browse), [My Claims](/app/ngo/my-claims)
3. Delivery Couriers: [Delivery Dispatches](/app/delivery/assignments)
4. Next Steps: [Sign Up / Register](/register), [Onboarding](/onboarding), and [How It Works](/how-it-works).
`;

async function callNvidia(messages: ChatMessage[]): Promise<string | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === "string") {
        return content.trim();
      }
    } else {
      console.warn("NVIDIA NIM API non-200 status:", res.status);
    }
  } catch (err) {
    console.warn("NVIDIA NIM API call failed:", err);
  }
  return null;
}

async function callGemini(messages: ChatMessage[]): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    // Format conversation for Google Generative Language API
    const contents = [
      {
        role: "user",
        parts: [{ text: `System Instruction: ${SYSTEM_PROMPT}\n\nPlease respond to the user based on the system instruction above.` }],
      },
      {
        role: "model",
        parts: [{ text: "Understood! I am the ZeroPlate AI Assistant, ready to help users with the platform." }],
      },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 600,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === "string") {
        return text.trim();
      }
    } else {
      console.warn("Gemini API non-200 status:", res.status);
    }
  } catch (err) {
    console.warn("Gemini API call failed:", err);
  }
  return null;
}

// Detects questions asking how to get started or how to use the platform
export function isIntroductoryQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  const clean = q.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");

  const triggers = [
    "how to get started",
    "how do i get started",
    "how can i get started",
    "how to use this",
    "how do i use this",
    "how can i use this",
    "how to use",
    "how do i use",
    "how to start",
    "how do i start",
    "how does this work",
    "how does it work",
    "how it works",
    "getting started",
    "get started",
    "start here",
    "where do i start",
    "where to start",
    "what to do first",
    "guide me",
    "tell me how to use",
    "explain how to use",
    "walk me through",
    "introduction",
    "intro to zeroplate",
    "help me get started",
    "how can i start",
    "what is this platform",
  ];

  return triggers.some((t) => clean.includes(t));
}

export function getIntroductoryReply(): string {
  return `Welcome to **ZeroPlate AI** — the intelligent food surplus redistribution network connecting dining halls, commercial kitchens, verified NGOs, and delivery partners to eliminate food waste! 🍱✨

Here is a quick guide on **how to get started** based on your role:

### 1️⃣ Institutional Kitchens & Dining Messes
* **Post Surplus Batches:** Log excess cooked food or raw items at **[Surplus Listings](/app/institution/surplus-listings)** with pickup windows and food safety temperatures.
* **Track Dispatches:** Follow real-time couriers transporting your donations in **[Active Deliveries](/app/institution/deliveries)**.
* **Prevent Overproduction:** Review AI demand predictions in **[Kitchen Forecast](/app/institution/forecast)**.

### 2️⃣ Verified NGOs & Community Food Banks
* **Discover Food Batches:** Find available fresh meals nearby in **[Browse Surplus Food](/app/ngo/browse)**.
* **Claim & Receive:** Tap *Claim Batch* to dispatch a delivery partner; verify receipt in **[My Claims](/app/ngo/my-claims)**.

### 3️⃣ Logistics Delivery Partners
* **Pick Up Dispatches:** Claim open broadcast delivery runs in **[Delivery Dispatches](/app/delivery/assignments)**.
* **Live Road Navigation:** Follow turn-by-turn route coordinates and update status from pickup to NGO handoff.

### 4️⃣ Platform Compliance Admins
* **City Command:** Monitor regional live operations and verify organizations on the **[Admin Overview](/app/admin/overview)**.

---
🚀 **Next Steps to Begin:**
- Create an account or log in at **[Login / Sign Up](/login)**.
- Complete your organization setup on **[Onboarding](/onboarding)**.
- Explore our platform architecture and FAQs on **[How It Works](/how-it-works)**!`;
}

// Smart rule-based fallback if external APIs ever timeout or fail
function getFallbackResponse(query: string): string {
  const q = query.toLowerCase().trim();

  // Check introductory query first
  if (isIntroductoryQuery(query)) {
    return getIntroductoryReply();
  }

  // Explicit off-topic check
  const isOffTopic =
    q.includes("python") ||
    q.includes("javascript") ||
    q.includes("code") ||
    q.includes("math") ||
    q.includes("capital of") ||
    q.includes("who is") ||
    q.includes("weather") ||
    q.includes("recipe") ||
    q.includes("joke") ||
    q.includes("poem") ||
    q.includes("movie") ||
    q.includes("song") ||
    q.includes("write an essay") ||
    q.includes("president") ||
    q.includes("capital");

  const formalDeflection =
    "I apologize, but my assistance is specialized exclusively for the ZeroPlate AI platform and its food redistribution operations. I am unable to assist with inquiries outside this scope. Please feel free to ask any questions regarding our web application, surplus listings, NGO claims, delivery dispatches, or platform features.";

  if (isOffTopic) {
    return formalDeflection;
  }

  if (q.includes("list") || q.includes("surplus") || q.includes("post food") || q.includes("donate") || q.includes("food batch")) {
    return "To list surplus food from your institutional kitchen, head over to **[Surplus Listings](/app/institution/surplus-listings)**. Tap **'+ New Surplus Batch'**, specify the item category, quantity, safe preparation temperature, and pickup time window. Once logged, matching recipient NGOs will be notified immediately!";
  }
  if (q.includes("claim") || q.includes("ngo") || q.includes("receive") || q.includes("browse") || q.includes("donation")) {
    return "NGOs can browse available surplus batches within their local radius at **[Browse Surplus Food](/app/ngo/browse)**. When you find a suitable batch, tap **'Claim Batch'** to immediately coordinate pickup and dispatch with registered delivery partners.";
  }
  if (q.includes("delivery") || q.includes("courier") || q.includes("driver") || q.includes("dispatch") || q.includes("logistics")) {
    return "Delivery partners can view open broadcast dispatches at **[Delivery Dispatches](/app/delivery/assignments)**. Once an order is accepted, you can track live route coordinates from the kitchen to the recipient NGO with interactive real-road maps and stamp confirmation steps.";
  }
  if (q.includes("esg") || q.includes("report") || q.includes("carbon") || q.includes("metric") || q.includes("impact")) {
    return "You can view your real-time environmental metrics and automated food rescue audits in the **[ESG Reports](/app/institution/reports)** section or check platform-wide metrics on our **[Public Impact Page](/impact)**.";
  }
  if (q.includes("forecast") || q.includes("predict") || /\bai\b/.test(q) || q.includes("artificial intelligence")) {
    return "ZeroPlate AI incorporates predictive demand forecasting models in **[Kitchen Forecast](/app/institution/forecast)**. It analyzes past meal consumption and headcount to calculate optimal preparation quantities, preventing surplus before cooking begins.";
  }
  if (q.includes("admin") || q.includes("verify") || q.includes("kyc")) {
    return "Platform administrators can monitor all regional dispatches on the live command map at **[Admin Overview](/app/admin/overview)** and review pending non-profit registrations in the **[NGO Verification Queue](/app/admin/ngo-verification)**.";
  }
  if (q.includes("help") || q.includes("zeroplate") || q.includes("web app") || q.includes("website") || q.includes("portal") || q.includes("features")) {
    return "I'm here to help you navigate ZeroPlate AI! You can ask me how to list surplus batches, claim meals as an NGO, coordinate delivery dispatches, view ESG carbon savings, or navigate any portal on the platform.";
  }

  return formalDeflection;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // 0. Dedicated check for introductory / getting started inquiries
    if (isIntroductoryQuery(message)) {
      return NextResponse.json({
        success: true,
        reply: getIntroductoryReply(),
      });
    }

    const cleanHistory: ChatMessage[] = Array.isArray(history)
      ? history.slice(-6).map((h: any) => ({
          role: h.role === "assistant" ? "assistant" : "user",
          content: String(h.content || ""),
        }))
      : [];

    const messagesToSend: ChatMessage[] = [
      ...cleanHistory,
      { role: "user", content: message },
    ];

    // 1. Try NVIDIA NIM API (Primary)
    let reply = await callNvidia(messagesToSend);

    // 2. Try Google Gemini API (Secondary Fallback)
    if (!reply) {
      reply = await callGemini(messagesToSend);
    }

    // 3. Built-in contextual fallback if both fail
    if (!reply) {
      reply = getFallbackResponse(message);
    }

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: unknown) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      {
        success: true,
        reply: "I am ready to help you navigate ZeroPlate AI! Try asking how to list surplus food, claim batches as an NGO, or track active deliveries.",
      },
      { status: 200 }
    );
  }
}
