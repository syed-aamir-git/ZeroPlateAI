import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

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

    const db = await getDb();
    const userId = session.user.id;
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    const [notifications, unreadCount] = await Promise.all([
      db
        .collection("notifications")
        .find({ userId: userObjectId as any })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray(),
      db.collection("notifications").countDocuments({
        userId: userObjectId as any,
        readStatus: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications." },
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
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const db = await getDb();
    const userId = session.user.id;
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await db.collection("notifications").updateMany(
        { userId: userObjectId as any, readStatus: false },
        { $set: { readStatus: true, readAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    if (notificationId && ObjectId.isValid(notificationId)) {
      await db.collection("notifications").updateOne(
        { _id: new ObjectId(notificationId), userId: userObjectId as any },
        { $set: { readStatus: true, readAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        message: "Notification marked as read.",
      });
    }

    return NextResponse.json(
      { error: "Either notificationId or markAll must be provided." },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification." },
      { status: 500 }
    );
  }
}
