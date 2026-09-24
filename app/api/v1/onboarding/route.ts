import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { getRoleDashboardPath } from "@/lib/auth-helpers";
import { geocodeAddress } from "@/lib/geocoding";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { role, details } = body;

    if (!role) {
      return NextResponse.json(
        { error: "Role is required." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = session.user.id;
    // Better auth user ID might be a string or ObjectId representation
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    if (role === "institution_admin") {
      const { name, type, address, lat, lng, plan } = details || {};
      if (!name || !type || !address) {
        return NextResponse.json(
          { error: "Missing required institution fields (name, type, address)." },
          { status: 400 }
        );
      }

      let resolvedLat = Number(lat);
      let resolvedLng = Number(lng);

      if (!resolvedLat || !resolvedLng || isNaN(resolvedLat) || isNaN(resolvedLng)) {
        const geo = await geocodeAddress(address);
        if (geo) {
          resolvedLat = geo.lat;
          resolvedLng = geo.lng;
        } else {
          resolvedLat = 12.9716;
          resolvedLng = 77.5946;
        }
      }

      await db.collection("institutions").insertOne({
        userId: userObjectId,
        name,
        type: type || "college",
        address,
        location: {
          lat: resolvedLat,
          lng: resolvedLng,
        },
        plan: plan === "premium" ? "premium" : "free",
        createdAt: new Date(),
      });
    } else if (role === "ngo") {
      const { orgName, registrationNumber, contactPhone, serviceArea, capacityPerWeek, lat, lng } = details || {};
      if (!orgName || !registrationNumber || !contactPhone) {
        return NextResponse.json(
          { error: "Missing required NGO KYC fields (orgName, registrationNumber, contactPhone)." },
          { status: 400 }
        );
      }

      let resolvedLat = Number(lat);
      let resolvedLng = Number(lng);

      if (!resolvedLat || !resolvedLng || isNaN(resolvedLat) || isNaN(resolvedLng)) {
        const geo = await geocodeAddress(serviceArea || orgName);
        if (geo) {
          resolvedLat = geo.lat;
          resolvedLng = geo.lng;
        } else {
          resolvedLat = 12.9716;
          resolvedLng = 77.5946;
        }
      }

      await db.collection("ngos").insertOne({
        userId: userObjectId,
        orgName,
        registrationNumber,
        contactPhone,
        serviceArea: serviceArea || "City Center",
        capacityPerWeek: Number(capacityPerWeek) || 500,
        kycStatus: "pending", // PRD Section 12.8: starts pending until platform admin approval
        reliabilityScore: 100,
        location: {
          lat: resolvedLat,
          lng: resolvedLng,
        },
        createdAt: new Date(),
      });
    } else if (role === "delivery_partner") {
      const { vehicleType, vehicleNumber, phone, serviceArea } = details || {};
      if (!phone) {
        return NextResponse.json(
          { error: "Phone number is required for delivery partners." },
          { status: 400 }
        );
      }

      await db.collection("deliveryPartners").insertOne({
        userId: userObjectId,
        vehicleType: vehicleType || "two_wheeler",
        vehicleNumber: vehicleNumber ? String(vehicleNumber).trim().toUpperCase() : "DL-PENDING",
        phone,
        serviceArea: serviceArea || "Metropolitan Zone",
        active: true,
        createdAt: new Date(),
      });
    } else if (role === "platform_admin") {
      const { department, accessKey } = details || {};
      await db.collection("adminProfiles").insertOne({
        userId: userObjectId,
        department: department || "Operations & Food Safety",
        accessKeyProvided: Boolean(accessKey),
        createdAt: new Date(),
      });
    }

    // Update user record with role and profileCompleted = true
    await db.collection("user").updateOne(
      { _id: userObjectId as any },
      {
        $set: {
          role,
          profileCompleted: true,
          updatedAt: new Date(),
        },
      }
    );

    const redirectPath = getRoleDashboardPath(role);

    return NextResponse.json({
      success: true,
      role,
      redirect: redirectPath,
    });
  } catch (error: unknown) {
    console.error("Onboarding error:", error);
    const message = error instanceof Error ? error.message : "Failed to complete onboarding profile";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
