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

    const db = await getDb();
    const users = await db.collection("user").find({}).sort({ createdAt: -1 }).toArray();

    const userIds = users.map((u) => u._id);

    // Fetch related role profiles
    const [institutions, ngos, deliveryPartners] = await Promise.all([
      db.collection("institutions").find({ userId: { $in: userIds } }).toArray(),
      db.collection("ngos").find({ userId: { $in: userIds } }).toArray(),
      db.collection("deliveryPartners").find({ userId: { $in: userIds } }).toArray(),
    ]);

    const instMap = new Map(institutions.map((i) => [String(i.userId), i]));
    const ngoMap = new Map(ngos.map((n) => [String(n.userId), n]));
    const driverMap = new Map(deliveryPartners.map((d) => [String(d.userId), d]));

    const enriched = users.map((u) => {
      const uId = String(u._id);
      const inst = instMap.get(uId);
      const ngo = ngoMap.get(uId);
      const driver = driverMap.get(uId);

      let profileDetails: any = null;
      if (inst) {
        profileDetails = {
          name: inst.name,
          type: inst.type,
          plan: inst.plan,
          address: inst.address,
        };
      } else if (ngo) {
        profileDetails = {
          name: ngo.orgName,
          registrationNumber: ngo.registrationNumber,
          kycStatus: ngo.kycStatus,
          serviceArea: ngo.serviceArea,
        };
      } else if (driver) {
        profileDetails = {
          vehicleType: driver.vehicleType,
          phone: driver.phone,
          serviceArea: driver.serviceArea,
          active: driver.active,
        };
      }

      return {
        _id: u._id,
        email: u.email,
        name: u.name,
        role: u.role || "unassigned",
        profileCompleted: Boolean(u.profileCompleted),
        createdAt: u.createdAt,
        profileDetails,
      };
    });

    return NextResponse.json({
      success: true,
      users: enriched,
      count: enriched.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching users list for admin:", error);
    return NextResponse.json(
      { error: "Failed to load users list." },
      { status: 500 }
    );
  }
}
