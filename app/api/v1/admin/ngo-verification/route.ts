import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "platform_admin") {
      return NextResponse.json(
        { error: "Forbidden. Platform Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";

    const db = await getDb();
    const query: Record<string, any> = {};
    if (statusFilter !== "all") {
      query.kycStatus = statusFilter;
    }

    const ngos = await db
      .collection("ngos")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      ngos,
      count: ngos.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching NGO verification queue:", error);
    return NextResponse.json(
      { error: "Failed to load NGO verification queue." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "platform_admin") {
      return NextResponse.json(
        { error: "Forbidden. Platform Admin access required." },
        { status: 403 }
      );
    }

    const db = await getDb();
    const userId = session.user.id;
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    const body = await request.json();
    const { ngoId, action, reason } = body;

    if (!ngoId || !ObjectId.isValid(ngoId)) {
      return NextResponse.json(
        { error: "Valid NGO ID is required." },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Action must be either 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    const targetNgoId = new ObjectId(ngoId);
    const ngo = await db.collection("ngos").findOne({ _id: targetNgoId });

    if (!ngo) {
      return NextResponse.json(
        { error: "NGO record not found." },
        { status: 404 }
      );
    }

    const newKycStatus = action === "approve" ? "approved" : "rejected";
    const now = new Date();

    await db.collection("ngos").updateOne(
      { _id: targetNgoId },
      {
        $set: {
          kycStatus: newKycStatus,
          kycReviewedAt: now,
          kycReviewedBy: userObjectId,
          kycRejectionReason: action === "reject" ? reason || "Non-compliant KYC documents" : null,
          updatedAt: now,
        },
      }
    );

    // Dispatch Real Notification to NGO user (Functional PRD Section 12.6)
    if (ngo.userId) {
      const isApproved = action === "approve";
      await createNotification(db, {
        userId: ngo.userId,
        role: "ngo",
        type: isApproved ? "kyc_approval" : "kyc_rejection",
        title: isApproved ? "KYC Registration Approved" : "KYC Registration Update",
        message: isApproved
          ? `Congratulations! Your organization (${ngo.orgName}) has been approved by Platform Operations. You now have full access to claim verified surplus food.`
          : `Your NGO registration could not be approved at this time: ${reason || "Non-compliant KYC documents"}. Please update your organization details.`,
        link: isApproved ? "/app/ngo/browse" : "/app/ngo/organization",
        metadata: {
          ngoId: targetNgoId,
          kycStatus: newKycStatus,
          reason,
        },
      });
    }

    // Record decision to immutable audit trail (Functional PRD Section 12.8)
    await db.collection("auditLogs").insertOne({
      entityType: "NGO",
      entityId: targetNgoId,
      action: action === "approve" ? "ngo_kyc_approval" : "ngo_kyc_rejection",
      ruleApplied: "platform_admin_kyc_review",
      status: newKycStatus,
      performedBy: userObjectId,
      details: {
        orgName: ngo.orgName,
        registrationNumber: ngo.registrationNumber,
        reason: reason || (action === "approve" ? "Verified against statutory records" : "Rejected"),
      },
      createdAt: now,
    });

    const updated = await db.collection("ngos").findOne({ _id: targetNgoId });

    return NextResponse.json({
      success: true,
      message: `NGO KYC ${action}d successfully.`,
      ngo: updated,
    });
  } catch (error: unknown) {
    console.error("Error executing NGO KYC action:", error);
    return NextResponse.json(
      { error: "Failed to process KYC verification action." },
      { status: 500 }
    );
  }
}
