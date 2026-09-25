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
     • Platform Audit Log (/app/admin/audit-log): Immutable regulatory trail recording all food safety evaluations, dispatch actions, and NGO KYC approvals.

5. AUDIT REPORTS, ESG COMPLIANCE & METRICS:
   - Portal Route: /app/institution/reports
   - Key Features:
     • Export CSV Audit Report: Institutional kitchens can export certified, timestamped CSV audit reports detailing kilograms diverted, meals rescued, CO₂e avoided, methane prevented, water preserved, and recipient NGO verification IDs (Darpan & 80G numbers).
     • Meal Conversion Formula: 1 Meal Rescued = 0.35 kg (350 grams) of surplus food redistributed.
     • Carbon Avoided Formula: 2.5 kg CO₂e saved per 1 kg of food diverted from landfills.
     • Water Preserved Formula: ~143 litres of agricultural water saved per 1 kg of food rescued.
     • Public Impact Page: /impact displays aggregate platform milestones.

NAVIGATION SHORTCUTS:
- How to export an audit report: "Navigate to [ESG & Impact Reports](/app/institution/reports) and click 'Export CSV Audit Report' at the top right. This downloads a certified CSV containing food rescue data, carbon avoidance, water preserved, and verified NGO credentials. Compliance admins can also inspect logs at [Admin Audit Log](/app/admin/audit-log)."
- How meals rescued are calculated: "ZeroPlate AI calculates 1 meal rescued for every 0.35 kg (350 grams) of cooked food surplus redistributed."
- How carbon savings are calculated: "For every 1 kg of food diverted from landfills, 2.5 kg of CO₂ equivalent emissions are avoided and ~143 litres of agricultural water are preserved."
- Where to enter vehicle number plate: "Drivers enter their vehicle number plate and vehicle type in their [Delivery Profile](/app/delivery/profile) or during registration. The plate is displayed on the order dispatch screen for transparent kitchen and NGO handoffs."
- How to list food: "Go to [Surplus Listings](/app/institution/surplus-listings) and click '+ New Surplus Batch'."
- How NGOs claim food: "Visit [Browse Surplus](/app/ngo/browse), view the batch details, and tap 'Claim Batch'."
- Where are my deliveries: "Check [Active Deliveries](/app/institution/deliveries) or for couriers: [Delivery Dispatches](/app/delivery/assignments)."
- How to view impact: "Visit the [Impact Dashboard](/impact) or [ESG Reports](/app/institution/reports)."

CRITICAL RELEVANCE GUARDRAIL (STRICT FORMAL RULE):
- You are strictly dedicated to assisting users with the ZeroPlate AI web application, its portals, features, surplus food donation, NGO claims, delivery logistics, account verification, food safety policies, ESG reporting, and audit capabilities.
- IMPORTANT SCOPE DEFINITION: Inquiries regarding audit reports, CSV exports, carbon calculations, meal conversions, vehicle number plates, driver details, food safety temperatures, NGO verification, route maps, delivery receipts, and all suggested prompts are CORE IN-SCOPE PLATFORM FEATURES. You must NEVER decline or refuse these questions!
- If a user inquires about topics genuinely outside the scope of the ZeroPlate AI platform (such as programming, mathematics, creative writing, political or world affairs, entertainment, unrelated recipes, or general trivia), you must decline courteously and formally.
- Formulate your refusal in a formal, respectful tone:
"I apologize, but my assistance is specialized exclusively for the ZeroPlate AI platform and its food redistribution operations. I am unable to assist with inquiries outside this scope. Please feel free to ask any questions regarding our web application, surplus listings, NGO claims, delivery dispatches, or platform features."

GETTING STARTED / HOW TO USE INQUIRIES:
- If the user asks anything like "how to get started", "how to use this", "how do I use this", or "guide me":
Welcome them warmly to ZeroPlate AI and provide a structured role-based getting started guide covering:
1. Kitchens & Messes: [Surplus Listings](/app/institution/surplus-listings), [Active Deliveries](/app/institution/deliveries), [Kitchen Forecast](/app/institution/forecast)
2. Verified NGOs: [Browse Surplus Food](/app/ngo/browse), [My Claims](/app/ngo/my-claims)
3. Delivery Couriers: [Delivery Dispatches](/app/delivery/assignments)
4. Next Steps: [Sign Up / Register](/register), [Onboarding](/onboarding), and [How It Works](/how-it-works).

STRICT CLEAN FORMATTING RULE:
- NEVER output stars or asterisks (do not use * or ** for bolding or bullet lists).
- NEVER output hashes (do not use #, ##, or ### for headings).
- For bullet items, use bullet dots (•) or numbers (1., 2.).
- For headers, use plain text or emojis with clear line breaks.
- Format all links as [Link Label](/path).
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

// Cleans any markdown stars or hashes from response text
export function cleanStarsAndHashes(text: string): string {
  if (!text) return "";
  return text
    // Remove markdown heading hashes at the start of lines (e.g. ### Header -> Header)
    .replace(/^#{1,6}\s+/gm, "")
    // Replace bullet asterisk * Item with • Item
    .replace(/^\s*\*\s+/gm, "• ")
    // Remove bold/italic stars **text** or *text*
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    // Remove any remaining stray asterisks or hashes
    .replace(/[*#]/g, "")
    .trim();
}

export function getIntroductoryReply(): string {
  return `Welcome to ZeroPlate AI — the intelligent food surplus redistribution network connecting dining halls, commercial kitchens, verified NGOs, and delivery partners to eliminate food waste! 🍱✨

Here is a quick guide on how to get started based on your role:

1️⃣ Institutional Kitchens & Dining Messes
• Post Surplus Batches: Log excess cooked food or raw items at [Surplus Listings](/app/institution/surplus-listings) with pickup windows and food safety temperatures.
• Track Dispatches: Follow real-time couriers transporting your donations in [Active Deliveries](/app/institution/deliveries).
• Prevent Overproduction: Review AI demand predictions in [Kitchen Forecast](/app/institution/forecast).

2️⃣ Verified NGOs & Community Food Banks
• Discover Food Batches: Find available fresh meals nearby in [Browse Surplus Food](/app/ngo/browse).
• Claim & Receive: Tap Claim Batch to dispatch a delivery partner; verify receipt in [My Claims](/app/ngo/my-claims).

3️⃣ Logistics Delivery Partners
• Pick Up Dispatches: Claim open broadcast delivery runs in [Delivery Dispatches](/app/delivery/assignments).
• Live Road Navigation: Follow turn-by-turn route coordinates and update status from pickup to NGO handoff.

4️⃣ Platform Compliance Admins
• City Command: Monitor regional live operations and verify organizations on the [Admin Overview](/app/admin/overview).

🚀 Next Steps to Begin:
- Create an account or log in at [Login / Sign Up](/login).
- Complete your organization setup on [Onboarding](/onboarding).
- Explore our platform architecture and FAQs on [How It Works](/how-it-works)!`;
}

// Core platform responses for ZeroPlate AI features and recommendation prompts
export function getCorePlatformReply(query: string): string | null {
  const q = query.toLowerCase().trim();
  const clean = q.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");

  // 1. Audit Report & Export inquiries
  if (
    (clean.includes("export") && (clean.includes("audit") || clean.includes("report") || clean.includes("csv") || clean.includes("esg"))) ||
    clean.includes("audit report") ||
    clean.includes("download report") ||
    clean.includes("export an audit") ||
    clean.includes("export audit")
  ) {
    return `To export an audit report on ZeroPlate AI, follow these steps:

1️⃣ Institutional Kitchens (ESG & Food Rescue Audit):
• Go to the [ESG & Impact Reports](/app/institution/reports) dashboard.
• Click the "Export CSV Audit Report" button at the top right of the page.
• Your browser will download a certified, timestamped CSV containing:
  • Total kilograms of surplus food diverted from landfills
  • Number of meals rescued and distributed
  • Carbon emissions avoided (kg CO₂e), methane prevented, and water preserved (litres)
  • Verified recipient NGO credentials (Darpan and 80G registration numbers)
  • Temperature compliance logs and delivery timestamps

2️⃣ Platform Compliance Administrators (System Audit Trail):
• Go to the [Admin Audit Log](/app/admin/audit-log) to inspect the immutable ledger of all food safety evaluations, NGO KYC approvals, and courier dispatches.

You can also explore public platform-wide milestones on the [Public Impact Page](/impact)!`;
  }

  // 2. Meal conversion calculation
  if (
    (clean.includes("meals rescued") || clean.includes("meal")) &&
    (clean.includes("converted") || clean.includes("kg") || clean.includes("calculate") || clean.includes("conversion") || clean.includes("from kg"))
  ) {
    return `ZeroPlate AI converts kilograms of rescued food into meals using verified international food recovery standards:

• 1 Meal Rescued = 0.35 kg (350 grams) of cooked food surplus redistributed.
• For instance, a batch of 35 kg of surplus rice and curry provides 100 wholesome, nutritious meals delivered to recipient NGOs.
• Every rescued kilogram additionally avoids 2.5 kg of CO₂ equivalent emissions and preserves approximately 143 litres of agricultural water.

Track your facility's real-time meal counts on [ESG Reports](/app/institution/reports) or view global milestones on the [Public Impact Page](/impact).`;
  }

  // 3. Carbon savings / ESG calculation
  if (
    (clean.includes("carbon") || clean.includes("emission") || clean.includes("co2") || clean.includes("methane") || clean.includes("esg")) &&
    (clean.includes("calculat") || clean.includes("how are") || clean.includes("saved") || clean.includes("formula") || clean.includes("metric"))
  ) {
    return `ZeroPlate AI calculates environmental impact using validated EPA and WRAP life-cycle methodologies:

• CO₂e Avoided: 2.5 kg of greenhouse gas emissions (CO₂ equivalent) prevented per 1 kg of food diverted from landfills.
• Methane Mitigation: Organic waste decomposition in landfills generates potent methane gas (CH₄); rescuing food prevents this organic breakdown.
• Water Preserved: Approximately 143 litres of embedded agricultural water is saved per kilogram of food saved.
• Financial Value: Automated calculation of food procurement capital preserved.

View interactive charts and export certified CSV summaries in [ESG Reports](/app/institution/reports).`;
  }

  // 4. Vehicle number plate & driver inquiries
  if (
    clean.includes("number plate") || clean.includes("vehicle plate") || clean.includes("plate") ||
    (clean.includes("vehicle") && (clean.includes("enter") || clean.includes("driver") || clean.includes("car") || clean.includes("bike")))
  ) {
    return `For delivery couriers on ZeroPlate AI, vehicle details ensure safe, transparent handoffs:

• Entering Vehicle Details: Drivers enter their vehicle type (Bike, Scooter, 3-Wheeler, Van) and vehicle number plate in their [Delivery Profile](/app/delivery/profile) or during registration.
• Order Visibility: The vehicle number plate is displayed alongside the driver's name and contact number on the dispatch tracking screen so both the institutional kitchen and receiving NGO can easily recognize your vehicle upon arrival.
• Open Dispatches: Check for available pickup assignments on the [Delivery Dispatches](/app/delivery/assignments) portal.`;
  }

  // 5. Food safety temperature rules
  if (
    clean.includes("temperature") || clean.includes("food safety") || clean.includes("safe temperature") || clean.includes("threshold")
  ) {
    return `ZeroPlate AI enforces automated food safety gating per FSSAI and HACCP standards:

• Hot Cooked Food: Must be kept at or above 60°C (140°F) from cooking through dispatch.
• Cold / Chilled Perishables: Must be stored at or below 5°C (41°F).
• Preparation Window: Hot meals must be consumed or refrigerated within safe consumption windows (typically 3 to 4 hours from cooking).
• Automated Gating: When logging batches on [Surplus Listings](/app/institution/surplus-listings), entering temperatures outside safe zones triggers automated quarantine alerts. Admins can view safety rules at [Safety Rules](/app/admin/safety-rules).`;
  }

  // 6. Radius distance matching
  if (clean.includes("radius") || clean.includes("distance") || (clean.includes("matching") && clean.includes("work"))) {
    return `ZeroPlate AI matches surplus food with verified recipient NGOs using geospatial proximity:

• Geo-Distance Calculation: When an institutional kitchen posts a batch, the system calculates driving distances to all registered NGOs within the active service radius (typically 5 to 10 km).
• First-Expired-First-Out (FEFO): Urgently expiring batches prioritize the closest NGOs to ensure rapid consumption before safe windows close.
• One-Tap Claiming: Eligible NGOs receive immediate broadcast notifications and can claim the batch with one tap in [Browse Surplus Food](/app/ngo/browse).`;
  }

  // 7. Delivery confirmations / receipt
  if (clean.includes("confirm") && (clean.includes("receipt") || clean.includes("delivery") || clean.includes("received"))) {
    return `Confirming delivery receipt on ZeroPlate AI is simple:

• NGOs: When the delivery partner arrives with the food batch, go to [My Claims](/app/ngo/my-claims), locate the active delivery, and tap 'Confirm Receipt'. This verifies safe temperature, condition, and quantity.
• Couriers: Drivers update their progress on [Delivery Dispatches](/app/delivery/assignments) through the lifecycle stepper (Assigned → Accepted → Picked Up → Delivered).
• Once confirmed, the batch is archived in your history and impact metrics are automatically credited to both the donor kitchen and the NGO!`;
  }

  // 8. Public impact dashboard
  if (clean.includes("public impact") || (clean.includes("impact") && clean.includes("dashboard"))) {
    return `You can explore ZeroPlate AI's public platform metrics at any time:

• Visit the [Public Impact Page](/impact) to view live counters for total kilograms diverted, meals rescued, CO₂ equivalent emissions avoided, and water preserved across all participating dining halls and verified NGOs.
• Institutional kitchens can also view their dedicated facility audits under [ESG & Impact Reports](/app/institution/reports).`;
  }

  // 9. NGO KYC verification
  if (clean.includes("kyc") || (clean.includes("ngo") && clean.includes("verification"))) {
    return `Verified recipient NGOs on ZeroPlate AI complete compliance onboarding:

• Required Documents: NGOs provide their NGO Darpan ID, 80G/12A registration certificate, and authorized representative details on [Organization Profile](/app/ngo/organization).
• Verification Queue: Platform compliance administrators review and approve pending registrations in the [NGO Verification Queue](/app/admin/ngo-verification).
• Active Status: Once approved, the NGO gains access to the live [Browse Surplus Food](/app/ngo/browse) marketplace.`;
  }

  // 10. Route map and live navigation
  if (clean.includes("route map") || (clean.includes("map") && clean.includes("work"))) {
    return `ZeroPlate AI features interactive live road maps for delivery partners:

• Couriers can view turn-by-turn route coordinates from the kitchen pickup point to the recipient NGO shelter directly inside [Delivery Dispatches](/app/delivery/assignments).
• The route displays driving distance in kilometers, estimated transit time, and contact shortcuts for both parties.`;
  }

  // 11. Advance status to Picked Up
  if (clean.includes("picked up") || clean.includes("advance status")) {
    return `To advance a delivery status:

• Couriers navigate to [Delivery Dispatches](/app/delivery/assignments).
• Tap into your active assignment to view the lifecycle stepper: Assigned → Accepted → Picked Up → Delivered.
• When at the kitchen, verify temperature and batch count, then tap 'Mark as Picked Up'.
• Once delivered to the NGO shelter, tap 'Mark as Delivered' so the NGO can confirm receipt.`;
  }

  // 12. Delivery history
  if (clean.includes("delivery history")) {
    return `Delivery couriers can view past completed deliveries and total kilograms transported at [Delivery History](/app/delivery/history). Each completed order includes pickup and dropoff locations, timestamped confirmations, and total meals transported.`;
  }

  return null;
}

// Helper to detect if an LLM returned a refusal message
function isRefusalOutput(reply: string): boolean {
  if (!reply) return true;
  const lower = reply.toLowerCase();
  return (
    lower.includes("falls outside the scope") ||
    lower.includes("outside the scope") ||
    lower.includes("outside this scope") ||
    lower.includes("specialized exclusively") ||
    lower.includes("unable to assist with that request") ||
    lower.includes("assistance is specialized solely") ||
    lower.includes("inquiries outside this scope")
  );
}

// Helper to detect if query is an in-scope platform topic
function isPlatformQuery(query: string): boolean {
  const clean = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const keywords = [
    "audit", "report", "export", "csv", "meal", "kg", "carbon", "co2", "methane",
    "water", "metric", "esg", "impact", "plate", "vehicle", "driver", "courier",
    "ngo", "claim", "surplus", "kitchen", "mess", "batch", "forecast", "predict",
    "temperature", "safety", "admin", "kyc", "darpan", "route", "map", "dispatch",
    "delivery", "picked up", "receipt", "confirm", "onboarding", "register", "food"
  ];
  return keywords.some((kw) => clean.includes(kw));
}

// Smart rule-based fallback if external APIs ever timeout or fail
function getFallbackResponse(query: string): string {
  const q = query.toLowerCase().trim();

  // Check introductory query first
  if (isIntroductoryQuery(query)) {
    return getIntroductoryReply();
  }

  // Check core platform reply
  const coreReply = getCorePlatformReply(query);
  if (coreReply) {
    return coreReply;
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
    return "To list surplus food from your institutional kitchen, head over to [Surplus Listings](/app/institution/surplus-listings). Tap '+ New Surplus Batch', specify the item category, quantity, safe preparation temperature, and pickup time window. Once logged, matching recipient NGOs will be notified immediately!";
  }
  if (q.includes("claim") || q.includes("ngo") || q.includes("receive") || q.includes("browse") || q.includes("donation")) {
    return "NGOs can browse available surplus batches within their local radius at [Browse Surplus Food](/app/ngo/browse). When you find a suitable batch, tap 'Claim Batch' to immediately coordinate pickup and dispatch with registered delivery partners.";
  }
  if (q.includes("delivery") || q.includes("courier") || q.includes("driver") || q.includes("dispatch") || q.includes("logistics")) {
    return "Delivery partners can view open broadcast dispatches at [Delivery Dispatches](/app/delivery/assignments). Once an order is accepted, you can track live route coordinates from the kitchen to the recipient NGO with interactive real-road maps and stamp confirmation steps.";
  }
  if (q.includes("esg") || q.includes("report") || q.includes("carbon") || q.includes("metric") || q.includes("impact")) {
    return "You can view your real-time environmental metrics and automated food rescue audits in the [ESG Reports](/app/institution/reports) section or check platform-wide metrics on our [Public Impact Page](/impact).";
  }
  if (q.includes("forecast") || q.includes("predict") || /\bai\b/.test(q) || q.includes("artificial intelligence")) {
    return "ZeroPlate AI incorporates predictive demand forecasting models in [Kitchen Forecast](/app/institution/forecast). It analyzes past meal consumption and headcount to calculate optimal preparation quantities, preventing surplus before cooking begins.";
  }
  if (q.includes("admin") || q.includes("verify") || q.includes("kyc")) {
    return "Platform administrators can monitor all regional dispatches on the live command map at [Admin Overview](/app/admin/overview) and review pending non-profit registrations in the [NGO Verification Queue](/app/admin/ngo-verification).";
  }
  if (q.includes("help") || q.includes("zeroplate") || q.includes("web app") || q.includes("website") || q.includes("portal") || q.includes("features")) {
    return "I am here to help you navigate ZeroPlate AI! You can ask me how to list surplus batches, claim meals as an NGO, coordinate delivery dispatches, view ESG carbon savings, or navigate any portal on the platform.";
  }

  return formalDeflection;
}

// Contextual recommendation suggestions for the chat interface based on query
export function getSuggestionsForQuery(query: string): string[] {
  const q = query.toLowerCase().trim();

  if (isIntroductoryQuery(q) || q.includes("start") || q.includes("guide")) {
    return [
      "🍱 How do I list surplus food?",
      "🤝 How does NGO matching work?",
      "🚚 How do delivery dispatches work?",
      "🔐 Where do I complete onboarding?",
      "📊 Where can I see ESG reports?",
    ];
  }

  if (q.includes("list") || q.includes("surplus") || q.includes("kitchen") || q.includes("post food") || q.includes("donate")) {
    return [
      "🌡️ What are the food safety temperature rules?",
      "📈 How does Kitchen Forecast prevent waste?",
      "🚚 Who picks up and delivers the surplus?",
      "📊 Where can I see our ESG impact reports?",
    ];
  }

  if (q.includes("claim") || q.includes("ngo") || q.includes("receive") || q.includes("browse") || q.includes("charity")) {
    return [
      "📍 How does radius distance matching work?",
      "✅ How do I confirm delivery receipt?",
      "📋 What KYC verification is needed for NGOs?",
      "🍱 How do I browse surplus batches?",
    ];
  }

  if (q.includes("delivery") || q.includes("courier") || q.includes("driver") || q.includes("dispatch") || q.includes("logistics") || q.includes("plate") || q.includes("vehicle")) {
    return [
      "🚗 Where do I enter vehicle number plate?",
      "🗺️ How does the live route map work?",
      "📦 How do I advance status to Picked Up?",
      "📋 Where do I view delivery history?",
    ];
  }

  if (q.includes("forecast") || q.includes("predict") || q.includes("inventory") || q.includes("waste")) {
    return [
      "🍱 How do I list excess cooked food?",
      "📊 How are carbon savings calculated?",
      "📦 How does inventory tracking work?",
      "🚀 How to get started / use this?",
    ];
  }

  if (q.includes("esg") || q.includes("report") || q.includes("carbon") || q.includes("metric") || q.includes("impact") || q.includes("audit")) {
    return [
      "🌍 Where is the public impact dashboard?",
      "📄 How do I export an audit report?",
      "🍲 How are meals rescued converted from kg?",
      "🍱 How do I list surplus food?",
    ];
  }

  if (q.includes("admin") || q.includes("verify") || q.includes("kyc") || q.includes("compliance") || q.includes("safety")) {
    return [
      "🛡️ How does NGO verification work?",
      "🌡️ What are the temperature thresholds?",
      "🗺️ How does the live command map work?",
      "🚀 How to get started / use this?",
    ];
  }

  // Default suggestions
  return [
    "🚀 How to get started / use this?",
    "🍱 How do I list surplus food?",
    "🤝 How does NGO matching work?",
    "🚚 How do delivery dispatches work?",
    "📊 Where can I see ESG reports?",
  ];
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
        reply: cleanStarsAndHashes(getIntroductoryReply()),
        suggestions: getSuggestionsForQuery(message),
      });
    }

    // 0b. Dedicated instant check for core platform questions & recommendation prompts
    const corePlatformReply = getCorePlatformReply(message);
    if (corePlatformReply) {
      return NextResponse.json({
        success: true,
        reply: cleanStarsAndHashes(corePlatformReply),
        suggestions: getSuggestionsForQuery(message),
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

    // 3. Safeguard: if LLM output is a false refusal on an in-scope platform query, override it!
    if (reply && isRefusalOutput(reply) && isPlatformQuery(message)) {
      reply = getCorePlatformReply(message) || getFallbackResponse(message);
    }

    // 4. Built-in contextual fallback if both fail
    if (!reply) {
      reply = getFallbackResponse(message);
    }

    return NextResponse.json({
      success: true,
      reply: cleanStarsAndHashes(reply || ""),
      suggestions: getSuggestionsForQuery(message),
    });
  } catch (error: unknown) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      {
        success: true,
        reply: "I am ready to help you navigate ZeroPlate AI! Try asking how to list surplus food, claim batches as an NGO, or track active deliveries.",
        suggestions: getSuggestionsForQuery("general"),
      },
      { status: 200 }
    );
  }
}
