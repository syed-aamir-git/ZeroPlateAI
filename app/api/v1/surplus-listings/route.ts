import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { evaluateSafetyGating } from "@/lib/safety-gating";
import { rankAndCreateMatches } from "@/lib/matching";
import { createNotification } from "@/lib/notifications";
import { geocodeAddress } from "@/lib/geocoding";

async function getAuthContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }

  const db = await getDb();
  const userId = session.user.id;
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
  const role = (session.user as { role?: string }).role;

  return { session, db, userId: userObjectId, role };
}

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { db, userId, role } = ctx;
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  try {
    let query: Record<string, any> = {};

    if (role === "institution_admin" && view !== "available") {
      const institution = await db
        .collection("institutions")
        .findOne({ userId: userId as any });

      if (!institution) {
        return NextResponse.json(
          { error: "Institution profile not found." },
          { status: 404 }
        );
      }
      query = {
        institutionId: institution._id,
        itemName: { $not: /raj\s*bhai|aadi\s*bhai|^aamir$/i },
      };
    } else {
      // NGO or Available view: only verified_safe listings
      query = {
        safetyStatus: "verified_safe",
        status: { $in: ["pending", "matched"] },
        "pickupWindow.end": { $gt: new Date() },
        itemName: { $not: /raj\s*bhai|aadi\s*bhai|^aamir$/i },
      };
    }

    const listings = await db
      .collection("surplusListings")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      listings,
      count: listings.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching surplus listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch surplus listings." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { db, userId, role } = ctx;
  if (role !== "institution_admin" && role !== "platform_admin") {
    return NextResponse.json(
      { error: "Only Institution Admins can list surplus food." },
      { status: 403 }
    );
  }

  try {
    const institution = await db
      .collection("institutions")
      .findOne({ userId: userId as any });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution profile not found. Please complete onboarding." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { inventoryItemId, quantity, pickupWindow, pickupLocation, storageCondition = "ambient" } = body;

    if (!inventoryItemId || !ObjectId.isValid(inventoryItemId)) {
      return NextResponse.json(
        { error: "A valid inventory item must be selected." },
        { status: 400 }
      );
    }

    const itemObjectId = new ObjectId(inventoryItemId);
    const item = await db.collection("inventoryItems").findOne({
      _id: itemObjectId,
      institutionId: institution._id,
    });

    if (!item) {
      return NextResponse.json(
        { error: "Inventory item not found or does not belong to this institution." },
        { status: 404 }
      );
    }

    const listingQty = Number(quantity);
    const startWindow = pickupWindow?.start
      ? new Date(pickupWindow.start)
      : new Date();
    const endWindow = pickupWindow?.end
      ? new Date(pickupWindow.end)
      : new Date(Date.now() + 3 * 60 * 60 * 1000); // 3h default

    const pickupAddr = pickupLocation?.address || institution.address || "Main Dispatch Gate";
    let pLat = Number(pickupLocation?.lat) || institution.location?.lat;
    let pLng = Number(pickupLocation?.lng) || institution.location?.lng;

    if (!pLat || !pLng || isNaN(pLat) || isNaN(pLng)) {
      const geo = await geocodeAddress(pickupAddr);
      if (geo) {
        pLat = geo.lat;
        pLng = geo.lng;
      }
    }

    const locationData = {
      address: pickupAddr,
      lat: pLat ?? 12.9716,
      lng: pLng ?? 77.5946,
    };

    // Run Server-Side Safety Gating Engine (Functional PRD Section 12.3)
    const gatingVerdict = await evaluateSafetyGating(db, {
      inventoryItem: item as any,
      quantity: listingQty,
      pickupWindow: {
        start: startWindow,
        end: endWindow,
      },
      pickupLocation: locationData,
      institutionId: institution._id,
      userId: userId,
    });

    // If Safety Gating Fails, reject listing and fail closed
    if (!gatingVerdict.safe) {
      const rejectedRecord = {
        inventoryItemId: item._id,
        institutionId: institution._id,
        institutionName: institution.name,
        itemName: item.name,
        category: item.category,
        quantity: listingQty,
        unit: item.unit,
        pickupWindow: { start: startWindow, end: endWindow },
        pickupLocation: locationData,
        storageCondition,
        safetyStatus: "rejected",
        status: "expired",
        rejectionReason: gatingVerdict.rejectionMessage || gatingVerdict.reason,
        ruleApplied: gatingVerdict.ruleApplied,
        createdAt: new Date(),
      };

      await db.collection("surplusListings").insertOne(rejectedRecord);

      return NextResponse.json(
        {
          success: false,
          safetyStatus: "rejected",
          ruleApplied: gatingVerdict.ruleApplied,
          reason: gatingVerdict.rejectionMessage || gatingVerdict.reason,
        },
        { status: 422 }
      );
    }

    // Safety Gating Passed: Create Verified Safe Listing
    const newListing = {
      inventoryItemId: item._id,
      institutionId: institution._id,
      institutionName: institution.name,
      itemName: item.name,
      category: item.category,
      quantity: listingQty,
      unit: item.unit,
      storageCondition,
      pickupWindow: {
        start: startWindow,
        end: endWindow,
      },
      pickupLocation: locationData,
      safetyStatus: "verified_safe",
      status: "pending",
      createdAt: new Date(),
    };

    const insertResult = await db.collection("surplusListings").insertOne(newListing);
    const listingId = insertResult.insertedId;

    // Update inventory item status to "listed"
    await db.collection("inventoryItems").updateOne(
      { _id: item._id },
      { $set: { status: "listed", updatedAt: new Date() } }
    );

    // Run Server-Side Weighted Matching Algorithm (Functional PRD Sections 11 & 12.4)
    let listingStatus = "pending";
    let rankedMatches: any[] = [];
    try {
      rankedMatches = await rankAndCreateMatches(db, {
        _id: listingId,
        quantity: listingQty,
        itemName: item.name,
        category: item.category,
        pickupLocation: locationData,
        institutionId: institution._id,
        institutionName: institution.name,
      });

      if (rankedMatches.length > 0) {
        listingStatus = "matched";
        await db.collection("surplusListings").updateOne(
          { _id: listingId },
          {
            $set: {
              status: "matched",
              matchesCount: rankedMatches.length,
              topMatchScore: rankedMatches[0].score,
            },
          }
        );

        // Notify top-ranked eligible approved NGOs (PRD Section 12.6)
        const topNgosToNotify = rankedMatches.slice(0, 3);
        for (const match of topNgosToNotify) {
          if (match.ngoUserId) {
            await createNotification(db, {
              userId: match.ngoUserId,
              role: "ngo",
              type: "new_matching_listing",
              title: "New Surplus Match Available",
              message: `${listingQty} ${item.unit} of ${item.name} from ${institution.name} is available for pickup. Compatibility score: ${match.score}%.`,
              link: "/app/ngo/browse",
              metadata: {
                listingId: listingId,
                score: match.score,
                itemName: item.name,
                quantity: listingQty,
              },
            });
          }
        }
      }
    } catch (matchErr) {
      console.error("Error running matching algorithm:", matchErr);
    }

    // Automatically allot open delivery dispatch for all registered delivery partners
    try {
      const topNgoId = rankedMatches.length > 0 ? rankedMatches[0].ngoId : undefined;
      const deliveryAssignmentDoc = {
        surplusListingId: listingId,
        institutionId: institution._id,
        claimedByNgoId: topNgoId,
        assignedToDeliveryPartnerId: null, // Broadcast to all registered partners
        status: "assigned",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection("deliveryAssignments").insertOne(deliveryAssignmentDoc);

      // Broadcast notification to all active delivery partners
      const allDeliveryPartners = await db
        .collection("deliveryPartners")
        .find({ active: { $ne: false } })
        .toArray();

      for (const partner of allDeliveryPartners) {
        if (partner.userId) {
          await createNotification(db, {
            userId: partner.userId,
            role: "delivery_partner",
            type: "delivery_assigned",
            title: "New Delivery Allotted — Available for Acceptance",
            message: `New dispatch available: Pickup ${listingQty} ${item.unit} of ${item.name} from ${institution.name}. Tap to accept.`,
            link: "/app/delivery/assignments",
            metadata: {
              listingId: listingId,
              pickupAddress: locationData.address,
            },
          });
        }
      }
    } catch (dispatchErr) {
      console.error("Error allotting broadcast delivery assignment:", dispatchErr);
    }

    return NextResponse.json(
      {
        success: true,
        safetyStatus: "verified_safe",
        status: listingStatus,
        matchesCount: rankedMatches.length,
        topMatchScore: rankedMatches[0]?.score || null,
        listing: {
          ...newListing,
          _id: listingId,
          status: listingStatus,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating surplus listing:", error);
    return NextResponse.json(
      { error: "Server error occurred while creating surplus listing." },
      { status: 500 }
    );
  }
}
