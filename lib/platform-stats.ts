import { getDb } from "@/lib/mongodb";

export interface PlatformStats {
  institutionCount: number;
  ngoCount: number;
  deliveryPartnerCount: number;
  totalListingsCount: number;
  deliveredListingsCount: number;
  wastePreventedKg: number;
  mealsRedistributed: number;
  co2eAvoidedKg: number;
  hasActivity: boolean;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const db = await getDb();

    const [
      institutionCount,
      ngoCount,
      deliveryPartnerCount,
      totalListingsCount,
      deliveredListings,
    ] = await Promise.all([
      db.collection("institutions").countDocuments(),
      db.collection("ngos").countDocuments(),
      db.collection("deliveryPartners").countDocuments(),
      db.collection("surplusListings").countDocuments(),
      db.collection("surplusListings").find({ status: "delivered" }).toArray(),
    ]);

    const wastePreventedKg = deliveredListings.reduce(
      (acc, curr) => acc + (Number(curr.quantity) || 0),
      0
    );

    // Standard conversions (PRD Section 12.7 & 22: kg -> meals * 2.5, kg -> CO2e * 1.8 FAO factor)
    const mealsRedistributed = Math.round(wastePreventedKg * 2.5);
    const co2eAvoidedKg = Math.round(wastePreventedKg * 1.8 * 10) / 10;

    return {
      institutionCount,
      ngoCount,
      deliveryPartnerCount,
      totalListingsCount,
      deliveredListingsCount: deliveredListings.length,
      wastePreventedKg,
      mealsRedistributed,
      co2eAvoidedKg,
      hasActivity: wastePreventedKg > 0 || totalListingsCount > 0,
    };
  } catch (err) {
    console.error("Error reading real platform stats from MongoDB:", err);
    return {
      institutionCount: 0,
      ngoCount: 0,
      deliveryPartnerCount: 0,
      totalListingsCount: 0,
      deliveredListingsCount: 0,
      wastePreventedKg: 0,
      mealsRedistributed: 0,
      co2eAvoidedKg: 0,
      hasActivity: false,
    };
  }
}
