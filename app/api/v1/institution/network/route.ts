import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "institution_admin" && role !== "platform_admin") {
      return NextResponse.json(
        { error: "Access denied. Only Institution Admins can view the partner network." },
        { status: 403 }
      );
    }

    const db = await getDb();

    // Design PRD 12.3: Organization directory lets an Institution Admin see
    // (not contact directly) which verified NGOs are active in their area.
    const ngos = await db
      .collection("ngos")
      .find({ kycStatus: "approved" })
      .project({
        orgName: 1,
        registrationNumber: 1,
        serviceArea: 1,
        capacityPerWeek: 1,
        location: 1,
        kycStatus: 1,
        updatedAt: 1,
      })
      .sort({ orgName: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      network: ngos,
      count: ngos.length,
    });
  } catch (error: unknown) {
    console.error("Error loading NGO network:", error);
    return NextResponse.json(
      { error: "Internal server error fetching verified network." },
      { status: 500 }
    );
  }
}
