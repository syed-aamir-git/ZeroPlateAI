import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ institutionId: string }> }
) {
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

    const { institutionId } = await params;
    if (!institutionId || !ObjectId.isValid(institutionId)) {
      return NextResponse.json(
        { error: "Invalid institution ID." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = session.user.id;
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
    const userRole = (session.user as { role?: string }).role;

    const instObjectId = new ObjectId(institutionId);
    const institution = await db
      .collection("institutions")
      .findOne({ _id: instObjectId });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found." },
        { status: 404 }
      );
    }

    // Authorization check: Institution Admin must own this institution, or Platform Admin
    if (
      userRole === "institution_admin" &&
      String(institution.userId) !== String(userObjectId)
    ) {
      return NextResponse.json(
        { error: "Forbidden. You do not manage this institution." },
        { status: 403 }
      );
    }

    // 1. Fetch real historical inventory items logged for this institution
    const inventoryItems = await db
      .collection("inventoryItems")
      .find({ institutionId: instObjectId })
      .sort({ preparedOrReceivedAt: 1 })
      .toArray();

    // 2. Fetch real surplus listings logged for this institution
    const surplusListings = await db
      .collection("surplusListings")
      .find({ institutionId: instObjectId })
      .sort({ createdAt: 1 })
      .toArray();

    // Transform into time-series points for the forecasting model
    const historyPoints: Array<{ date: string; quantity: number; category: string }> = [];

    for (const item of inventoryItems) {
      const dateVal = item.preparedOrReceivedAt || item.createdAt || new Date();
      const dateStr = new Date(dateVal).toISOString().slice(0, 10);
      historyPoints.push({
        date: dateStr,
        quantity: Number(item.quantity) || 0,
        category: item.category || "cooked_food",
      });
    }

    // 3. Proxy to Python FastAPI Microservice (PRD Sections 6 & 12.2)
    const forecastServiceUrl =
      process.env.FORECAST_SERVICE_URL || "http://127.0.0.1:8000";

    try {
      const response = await fetch(`${forecastServiceUrl}/forecast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_id: institutionId,
          history: historyPoints,
          forecast_days: 7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Forecasting service responded with error:", errText);
        return NextResponse.json(
          { error: "Forecasting microservice error.", details: errText },
          { status: 502 }
        );
      }

      const forecastData = await response.json();

      return NextResponse.json({
        success: true,
        institution: {
          _id: institution._id,
          name: institution.name,
          type: institution.type,
          plan: institution.plan,
        },
        inventoryItemsLogged: inventoryItems.length,
        surplusListingsLogged: surplusListings.length,
        forecast: forecastData,
      });
    } catch (serviceErr) {
      console.error("Failed to connect to forecasting microservice:", serviceErr);
      return NextResponse.json(
        {
          error:
            "Forecasting microservice is temporarily unreachable. Please ensure the Python service is active.",
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    console.error("Error generating institution forecast:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
