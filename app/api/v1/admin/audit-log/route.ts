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
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 20));
    const actionFilter = searchParams.get("action");
    const entityFilter = searchParams.get("entityType");

    const query: Record<string, any> = {};
    if (actionFilter) query.action = actionFilter;
    if (entityFilter) query.entityType = entityFilter;

    const db = await getDb();
    const total = await db.collection("auditLogs").countDocuments(query);

    const logs = await db
      .collection("auditLogs")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    console.error("Error fetching audit logs for admin:", error);
    return NextResponse.json(
      { error: "Failed to load audit logs." },
      { status: 500 }
    );
  }
}
