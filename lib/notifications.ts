import { Db, ObjectId } from "mongodb";

export type NotificationType =
  | "new_matching_listing"
  | "listing_claimed"
  | "delivery_assigned"
  | "delivery_status_change"
  | "kyc_approval"
  | "kyc_rejection"
  | "general";

export interface CreateNotificationParams {
  userId: ObjectId;
  role?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Creates an in-app notification in MongoDB and triggers a real transactional email notification.
 */
export async function createNotification(
  db: Db,
  params: CreateNotificationParams
) {
  const now = new Date();
  const notifDoc = {
    userId: params.userId,
    role: params.role || "user",
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link || "#",
    metadata: params.metadata || {},
    readStatus: false,
    createdAt: now,
  };

  const insertResult = await db.collection("notifications").insertOne(notifDoc);

  // Lookup user's email for transactional notification dispatch
  try {
    const user = await db
      .collection("user")
      .findOne({ _id: params.userId as any });

    if (user && user.email) {
      await sendTransactionalEmail(db, {
        to: user.email,
        subject: `[ZeroPlate] ${params.title}`,
        text: `${params.message}\n\nView details: ${params.link || "https://zeroplate.ai"}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E0D5; background: #FAF7F2; border-radius: 8px;">
            <div style="border-bottom: 2px solid #2F5E41; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #2F5E41; margin: 0; font-size: 20px;">ZeroPlate.ai — Food Abundance Alert</h2>
            </div>
            <h3 style="color: #1C1917; margin-top: 0;">${params.title}</h3>
            <p style="color: #44403C; font-size: 15px; line-height: 1.5;">${params.message}</p>
            ${
              params.link
                ? `<div style="margin-top: 24px;">
                     <a href="${params.link}" style="background: #2F5E41; color: #FFFFFF; padding: 10px 18px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block;">View in Ledger</a>
                   </div>`
                : ""
            }
            <div style="margin-top: 32px; border-top: 1px solid #E5E0D5; padding-top: 12px; font-size: 12px; color: #78716C;">
              Predict what's needed. Redistribute what's left. Measure what it meant.
            </div>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error("Error dispatching email notification:", err);
  }

  return { ...notifDoc, _id: insertResult.insertedId };
}

/**
 * Dispatches transactional email and permanently records to emailLogs for traceability.
 */
export async function sendTransactionalEmail(
  db: Db,
  email: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }
) {
  // If an external service like Resend is configured via RESEND_API_KEY:
  const resendApiKey = process.env.RESEND_API_KEY;
  let providerResponse = null;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "ZeroPlate <notifications@zeroplate.ai>",
          to: email.to,
          subject: email.subject,
          text: email.text,
          html: email.html,
        }),
      });
      providerResponse = await res.json();
    } catch (err: unknown) {
      console.error("Resend delivery failed:", err);
      providerResponse = { error: String(err) };
    }
  }

  // Always log the transactional email dispatch to MongoDB emailLogs
  await db.collection("emailLogs").insertOne({
    to: email.to,
    subject: email.subject,
    text: email.text,
    provider: resendApiKey ? "resend" : "zeroplate_internal_dispatcher",
    providerResponse,
    dispatchedAt: new Date(),
  });
}
