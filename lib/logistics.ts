import { Db, ObjectId } from "mongodb";
import { calculateDistanceKm } from "./matching";

export interface DeliveryPartnerCandidate {
  _id: ObjectId;
  userId: ObjectId;
  phone: string;
  vehicleType: string;
  serviceArea: string;
  location?: { lat: number; lng: number };
  active: boolean;
}

export interface AssignmentResult {
  partner: DeliveryPartnerCandidate | null;
  distanceKm?: number;
  reason?: string;
}

/**
 * Assigns the nearest available delivery partner to a surplus pickup location
 * strictly per Functional PRD Section 12.5.
 */
export async function assignNearestDeliveryPartner(
  db: Db,
  pickupLocation: { lat: number; lng: number; address?: string }
): Promise<AssignmentResult> {
  const activePartners = (await db
    .collection("deliveryPartners")
    .find({ active: true })
    .toArray()) as unknown as DeliveryPartnerCandidate[];

  if (!activePartners.length) {
    return {
      partner: null,
      reason: "No active delivery partners currently registered in the network.",
    };
  }

  // Check busy delivery partners who are currently on an active run (accepted or picked_up)
  const busyAssignments = await db
    .collection("deliveryAssignments")
    .find({
      status: { $in: ["accepted", "picked_up"] },
      assignedToDeliveryPartnerId: { $exists: true },
    })
    .toArray();

  const busyPartnerIdStrings = new Set(
    busyAssignments.map((a) => String(a.assignedToDeliveryPartnerId))
  );

  // Filter for available (unoccupied) partners first
  let candidates = activePartners.filter(
    (p) => !busyPartnerIdStrings.has(String(p._id))
  );

  // If all are busy, fall back to all active partners
  if (!candidates.length) {
    candidates = activePartners;
  }

  const pLat = pickupLocation.lat ?? 28.6139;
  const pLng = pickupLocation.lng ?? 77.209;

  // Rank by proximity to pickup point
  let bestPartner: DeliveryPartnerCandidate | null = null;
  let minDistance = Infinity;

  for (const partner of candidates) {
    const lat = partner.location?.lat ?? 28.6139;
    const lng = partner.location?.lng ?? 77.209;
    const dist = calculateDistanceKm(pLat, pLng, lat, lng);

    if (dist < minDistance) {
      minDistance = dist;
      bestPartner = partner;
    }
  }

  return {
    partner: bestPartner,
    distanceKm: minDistance === Infinity ? 0 : minDistance,
  };
}
