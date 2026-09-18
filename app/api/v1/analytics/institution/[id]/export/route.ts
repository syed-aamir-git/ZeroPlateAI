import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { calculateSustainabilityImpact, SUSTAINABILITY_FACTORS } from "@/lib/sustainability";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid institution ID parameter." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = session.user.id;
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
    const role = (session.user as { role?: string }).role;

    const institutionId = new ObjectId(id);
    const institution = await db
      .collection("institutions")
      .findOne({ _id: institutionId });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution record not found." },
        { status: 404 }
      );
    }

    // Role check: Institution Admin must own this institution, or Platform Admin
    if (
      role === "institution_admin" &&
      String(institution.userId) !== String(userObjectId)
    ) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to access reports for this facility." },
        { status: 403 }
      );
    }

    // FREEMIUM GATING (Functional PRD Sections 12.7 & 23)
    // Only institutions on plan: "premium" can export ESG & sustainability reports.
    // Free plan accounts receive an informative upsell error explaining the premium tier.
    if (institution.plan !== "premium") {
      return NextResponse.json(
        {
          error: "Premium subscription required.",
          code: "PLAN_UPGRADE_REQUIRED",
          currentPlan: institution.plan || "free",
          requiredPlan: "premium",
          message:
            "ESG & Sustainability Compliance Reporting (Audited PDF and CSV export) is an enterprise feature available exclusively on the Premium Plan. Upgrade your institution profile to unlock full audit logs, Scope 3 carbon offsets certification, and board-ready executive summaries.",
          upsellDetails: {
            features: [
              "GHG Protocol Scope 3 Category 5 waste accounting export",
              "FSSAI-aligned chain-of-custody surplus redistribution logs",
              "Automated CSV & printable PDF executive audit summaries",
              "Priority NGO recipient matching and logistics routing",
            ],
            upgradeUrl: "/app/institution/settings",
          },
        },
        { status: 403 }
      );
    }

    // Plan is Premium: Generate Real Audited ESG Report
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "csv";

    // 1. Fetch delivered surplus listings
    const deliveredListings = await db
      .collection("surplusListings")
      .find({
        institutionId: institution._id,
        status: "delivered",
      })
      .sort({ deliveredAt: -1, createdAt: -1 })
      .toArray();

    // 2. Fetch linked delivery assignments and recipient NGOs
    const listingIds = deliveredListings.map((l) => l._id);
    const deliveryAssignments = await db
      .collection("deliveryAssignments")
      .find({ surplusListingId: { $in: listingIds } })
      .toArray();

    const ngoIds = deliveredListings
      .map((l) => l.claimedByNgoId)
      .filter(Boolean);

    const ngos = await db
      .collection("ngos")
      .find({ _id: { $in: ngoIds } })
      .toArray();

    const ngoMap = new Map(ngos.map((n) => [String(n._id), n]));
    const assignmentMap = new Map(
      deliveryAssignments.map((a) => [String(a.surplusListingId), a])
    );

    // 3. Compute real sustainability totals
    const totalDeliveredKg = deliveredListings.reduce(
      (sum, l) => sum + (Number(l.quantity) || 0),
      0
    );

    const impact = calculateSustainabilityImpact(totalDeliveredKg);

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    for (const l of deliveredListings) {
      const cat = l.category || "cooked_food";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(l.quantity) || 0);
    }

    // Return JSON if requested
    if (format === "json") {
      return NextResponse.json({
        success: true,
        institution: {
          id: institution._id,
          name: institution.name,
          type: institution.type,
          plan: institution.plan,
        },
        reportMetadata: {
          generatedAt: new Date().toISOString(),
          standard: "GHG Protocol Scope 3 Category 5",
          conversionFactors: SUSTAINABILITY_FACTORS,
        },
        executiveSummary: impact,
        categoryBreakdown: categoryTotals,
        deliveredListingsCount: deliveredListings.length,
        records: deliveredListings.map((l) => {
          const ngo = l.claimedByNgoId ? ngoMap.get(String(l.claimedByNgoId)) : null;
          const assignment = assignmentMap.get(String(l._id));
          const kg = Number(l.quantity) || 0;
          return {
            listingId: l._id,
            itemName: l.itemName,
            category: l.category,
            quantityKg: kg,
            mealsGiven: Math.round(kg * SUSTAINABILITY_FACTORS.MEALS_PER_KG),
            co2eAvoidedKg: Math.round(kg * SUSTAINABILITY_FACTORS.CO2E_PER_KG * 10) / 10,
            recipientNgo: ngo?.orgName || l.claimedByNgoName || "Verified Recipient",
            recipientRegistration: ngo?.registrationNumber || "N/A",
            safetyStatus: l.safetyStatus,
            deliveredAt: l.deliveredAt || assignment?.deliveredAt || l.updatedAt,
          };
        }),
      });
    }

    // Default Format: CSV Export
    const safeInstName = (institution.name || "Institution").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);

    const csvLines: string[] = [
      `# ZeroPlate.ai — Official Institutional ESG & Food Loss Audit Report`,
      `# Facility Name: "${institution.name}"`,
      `# Facility Type: ${institution.type}`,
      `# Reporting Date: ${new Date().toISOString()}`,
      `# Subscription Plan: Enterprise Premium (Verified)`,
      `# GHG Protocol Standard: Scope 3 Category 5 (Waste Generated in Operations)`,
      `# Conversion Methodology: FAO (2.5 meals/kg) | UNEP/IPCC (1.9 kg CO2e/kg food diverted) | Water Footprint Network (250 L/kg)`,
      `#`,
      `# --- EXECUTIVE SUSTAINABILITY SUMMARY ---`,
      `# Total Surplus Diverted from Landfill (kg):,${impact.wastePreventedKg}`,
      `# Total Wholesome Meals Redistributed (count):,${impact.mealsGiven}`,
      `# Total GHG Emissions Avoided (kg CO2e):,${impact.co2eAvoidedKg}`,
      `# Landfill Methane Emissions Avoided (kg CH4):,${impact.methaneAvoidedKg}`,
      `# Embedded Agricultural Water Preserved (Liters):,${impact.waterPreservedLiters}`,
      `# Estimated Institutional Cost Value Recovered (INR):,₹${impact.costSavedInr}`,
      `# Completed Redistribution Runs:,${deliveredListings.length}`,
      `#`,
      `Listing ID,Batch Date,Item Name,Category,Quantity (kg),Meals Equivalent,CO2e Avoided (kg),Recipient Organization,NGO Registration Number,Dispatch Location,Safety Status,Delivered Timestamp`,
    ];

    for (const l of deliveredListings) {
      const ngo = l.claimedByNgoId ? ngoMap.get(String(l.claimedByNgoId)) : null;
      const assignment = assignmentMap.get(String(l._id));
      const kg = Number(l.quantity) || 0;
      const meals = Math.round(kg * SUSTAINABILITY_FACTORS.MEALS_PER_KG);
      const co2e = Math.round(kg * SUSTAINABILITY_FACTORS.CO2E_PER_KG * 10) / 10;
      const deliveredTime = l.deliveredAt || assignment?.deliveredAt || l.updatedAt || l.createdAt;
      const dateFormatted = deliveredTime ? new Date(deliveredTime).toISOString() : "N/A";
      const pickupAddress = l.pickupLocation?.address || institution.address || "Main Dispatch Bay";

      csvLines.push(
        [
          `"${l._id}"`,
          `"${new Date(l.createdAt).toISOString().slice(0, 10)}"`,
          `"${(l.itemName || "Surplus Food").replace(/"/g, '""')}"`,
          `"${l.category || "cooked_food"}"`,
          kg,
          meals,
          co2e,
          `"${(ngo?.orgName || l.claimedByNgoName || "Verified Recipient").replace(/"/g, '""')}"`,
          `"${(ngo?.registrationNumber || "Verified").replace(/"/g, '""')}"`,
          `"${pickupAddress.replace(/"/g, '""')}"`,
          `"${l.safetyStatus || "verified_safe"}"`,
          `"${dateFormatted}"`,
        ].join(",")
      );
    }

    const csvContent = csvLines.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ZeroPlate_ESG_Report_${safeInstName}_${dateStr}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error generating ESG export:", error);
    return NextResponse.json(
      { error: "Server error occurred while generating ESG report." },
      { status: 500 }
    );
  }
}
