import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Initial baseline helpful & unhelpful counts for each FAQ
const DEFAULT_FEEDBACK: Record<string, { helpful: number; unhelpful: number }> = {
  "safety-4-hour": { helpful: 48, unhelpful: 2 },
  "safety-fail-closed": { helpful: 34, unhelpful: 1 },
  "safety-legal-protection": { helpful: 41, unhelpful: 0 },
  "kyc-free-meals": { helpful: 56, unhelpful: 1 },
  "kyc-approval-process": { helpful: 39, unhelpful: 2 },
  "kyc-unapproved-claim": { helpful: 27, unhelpful: 1 },
  "claims-race-condition": { helpful: 45, unhelpful: 1 },
  "claims-smart-matching": { helpful: 32, unhelpful: 0 },
  "logistics-courier-pickup": { helpful: 38, unhelpful: 2 },
  "logistics-recipient-confirm": { helpful: 29, unhelpful: 1 },
  "reports-co2-formula": { helpful: 43, unhelpful: 2 },
  "reports-free-export": { helpful: 37, unhelpful: 0 },
};

// In-memory persistent cache for server runtime
const memoryFeedbackStore = new Map<string, { helpful: number; unhelpful: number }>();

// Initialize memory store with default counts
Object.entries(DEFAULT_FEEDBACK).forEach(([id, counts]) => {
  memoryFeedbackStore.set(id, { ...counts });
});

function withTimeout<T>(promise: Promise<T>, timeoutMs = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout of ${timeoutMs}ms exceeded`)), timeoutMs)
    ),
  ]);
}

export async function GET() {
  try {
    const db = await withTimeout(getDb(), 1500);
    const records = await withTimeout(db.collection("faq_feedback").find({}).toArray(), 1500);

    const counts: Record<string, { helpful: number; unhelpful: number }> = {};

    // Start with default/in-memory counts
    memoryFeedbackStore.forEach((val, key) => {
      counts[key] = { ...val };
    });

    // Merge database stored overrides
    records.forEach((doc: any) => {
      if (doc.faqId) {
        counts[doc.faqId] = {
          helpful: Math.max(0, doc.helpful ?? memoryFeedbackStore.get(doc.faqId)?.helpful ?? 0),
          unhelpful: Math.max(0, doc.unhelpful ?? memoryFeedbackStore.get(doc.faqId)?.unhelpful ?? 0),
        };
        memoryFeedbackStore.set(doc.faqId, counts[doc.faqId]);
      }
    });

    return NextResponse.json({ success: true, counts });
  } catch (error) {
    // If DB is offline or times out, serve in-memory counts gracefully and instantly
    const counts: Record<string, { helpful: number; unhelpful: number }> = {};
    memoryFeedbackStore.forEach((val, key) => {
      counts[key] = { ...val };
    });
    return NextResponse.json({ success: true, counts, fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { faqId, vote, previousVote } = body;

    if (!faqId || !vote || !["yes", "no", "clear"].includes(vote)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const current = memoryFeedbackStore.get(faqId) || {
      helpful: DEFAULT_FEEDBACK[faqId]?.helpful || 10,
      unhelpful: DEFAULT_FEEDBACK[faqId]?.unhelpful || 0,
    };

    let helpfulDelta = 0;
    let unhelpfulDelta = 0;

    // Handle vote transition
    if (vote === "yes") {
      if (previousVote === "no") {
        unhelpfulDelta = -1;
      }
      helpfulDelta = 1;
    } else if (vote === "no") {
      if (previousVote === "yes") {
        helpfulDelta = -1;
      }
      unhelpfulDelta = 1;
    } else if (vote === "clear") {
      if (previousVote === "yes") {
        helpfulDelta = -1;
      } else if (previousVote === "no") {
        unhelpfulDelta = -1;
      }
    }

    current.helpful = Math.max(0, current.helpful + helpfulDelta);
    current.unhelpful = Math.max(0, current.unhelpful + unhelpfulDelta);
    memoryFeedbackStore.set(faqId, current);

    try {
      const db = await withTimeout(getDb(), 1500);
      await withTimeout(
        db.collection("faq_feedback").updateOne(
          { faqId },
          {
            $inc: {
              helpful: helpfulDelta,
              unhelpful: unhelpfulDelta,
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
            $set: {
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        ),
        1500
      );
    } catch (dbErr) {
      // In-memory already updated, log and proceed
      console.warn("MongoDB write fallback (using in-memory):", dbErr);
    }

    return NextResponse.json({
      success: true,
      faqId,
      counts: current,
    });
  } catch (error) {
    console.error("Feedback post error:", error);
    return NextResponse.json({ error: "Failed to record response" }, { status: 500 });
  }
}
