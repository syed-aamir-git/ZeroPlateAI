import { Db, ObjectId } from "mongodb";

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface MatchEvaluationResult {
  ngoId: ObjectId;
  ngoUserId: ObjectId;
  orgName: string;
  contactPhone?: string;
  serviceArea?: string;
  score: number;
  distanceKm: number;
  breakdown: {
    proximityScore: number;
    capacityScore: number;
    reliabilityScore: number;
  };
}

/**
 * Calculates Haversine distance in kilometers between two coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number" ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 15.0; // Sensible default within metro zone if coordinates are missing
  }

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Server-side weighted matching algorithm (Functional PRD Sections 11 & 12.4).
 * Weights:
 * - Proximity: 45%
 * - Capacity Fit: 35%
 * - NGO Reliability: 20%
 */
export function calculateMatchingScore(
  listing: {
    quantity: number;
    pickupLocation?: { lat: number; lng: number };
  },
  ngo: {
    location?: { lat: number; lng: number };
    capacityPerWeek?: number;
    reliabilityScore?: number;
  }
): {
  score: number;
  distanceKm: number;
  breakdown: {
    proximityScore: number;
    capacityScore: number;
    reliabilityScore: number;
  };
} {
  const listingLat = listing.pickupLocation?.lat ?? 28.6139;
  const listingLng = listing.pickupLocation?.lng ?? 77.209;
  const ngoLat = ngo.location?.lat ?? 28.6139;
  const ngoLng = ngo.location?.lng ?? 77.209;

  const distanceKm = calculateDistanceKm(listingLat, listingLng, ngoLat, ngoLng);

  // 1. Proximity Score (45% weight): 100 at 0km, linearly decreasing to 0 at 40km
  const proximityScore = Math.max(
    0,
    Math.min(100, Math.round(100 - (distanceKm / 40) * 100))
  );

  // 2. Capacity Fit Score (35% weight)
  // Daily recipient capacity estimate = capacityPerWeek / 7
  const dailyCapacity = Math.max(1, (ngo.capacityPerWeek || 70) / 7);
  const qty = Math.max(1, listing.quantity || 1);

  let capacityScore = 70;
  if (dailyCapacity >= qty) {
    // NGO can easily absorb the surplus
    const ratio = qty / dailyCapacity;
    capacityScore = Math.min(100, Math.round(75 + ratio * 25));
  } else {
    // Surplus exceeds single-day capacity; partial score
    const coverage = dailyCapacity / qty;
    capacityScore = Math.max(25, Math.min(75, Math.round(coverage * 75)));
  }

  // 3. Reliability Score (20% weight): 0 - 100
  const reliabilityScore = Math.max(
    10,
    Math.min(100, Math.round(ngo.reliabilityScore ?? 88))
  );

  // Weighted combination
  const finalScore = Math.round(
    0.45 * proximityScore + 0.35 * capacityScore + 0.2 * reliabilityScore
  );

  return {
    score: Math.max(1, Math.min(100, finalScore)),
    distanceKm,
    breakdown: {
      proximityScore,
      capacityScore,
      reliabilityScore,
    },
  };
}

/**
 * Evaluates all eligible KYC-approved NGOs for a new surplus listing,
 * ranks them descending by match score, and persists records in the `matches` collection.
 */
export async function rankAndCreateMatches(
  db: Db,
  listing: {
    _id: ObjectId;
    quantity: number;
    itemName: string;
    category: string;
    pickupLocation?: { lat: number; lng: number; address?: string };
    institutionId: ObjectId;
    institutionName?: string;
  }
): Promise<MatchEvaluationResult[]> {
  // Only KYC-approved NGOs are eligible (Functional PRD Section 12.8 & 12.4)
  const approvedNgos = await db
    .collection("ngos")
    .find({ kycStatus: "approved" })
    .toArray();

  if (!approvedNgos.length) {
    return [];
  }

  const results: MatchEvaluationResult[] = [];

  for (const ngo of approvedNgos) {
    const { score, distanceKm, breakdown } = calculateMatchingScore(
      listing,
      ngo as any
    );

    results.push({
      ngoId: ngo._id,
      ngoUserId: ngo.userId,
      orgName: ngo.orgName,
      contactPhone: ngo.contactPhone,
      serviceArea: ngo.serviceArea,
      score,
      distanceKm,
      breakdown,
    });
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  // Persist top matches in `matches` collection
  const now = new Date();
  const matchDocs = results.map((m) => ({
    surplusListingId: listing._id,
    ngoId: m.ngoId,
    ngoUserId: m.ngoUserId,
    score: m.score,
    distanceKm: m.distanceKm,
    breakdown: m.breakdown,
    status: "proposed", // "proposed" | "claimed" | "rejected"
    createdAt: now,
  }));

  if (matchDocs.length > 0) {
    await db.collection("matches").insertMany(matchDocs);
  }

  return results;
}
