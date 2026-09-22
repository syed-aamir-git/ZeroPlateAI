import { getDb } from "@/lib/mongodb";

export interface PlatformStats {
  institutionCount: number;
  ngoCount: number;
  deliveryPartnerCount: number;
  totalListingsCount: number;
  deliveredListingsCount: number;
  wastePreventedKg: number;
  wastePreventedByUnit: {
    kg: number;
    pieces: number;
    litres: number;
  };
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

    let wastePreventedKg = 0;
    const wastePreventedByUnit = {
      kg: 0,
      pieces: 0,
      litres: 0,
    };

    for (const curr of deliveredListings) {
      const qty = Number(curr.quantity) || 0;
      wastePreventedKg += qty;
      const rawUnit = (curr.unit || "kg").toLowerCase().trim();
      if (rawUnit === "kg" || rawUnit === "kgs" || rawUnit === "kilogram" || rawUnit === "kilograms") {
        wastePreventedByUnit.kg += qty;
      } else if (rawUnit === "l" || rawUnit === "liter" || rawUnit === "litres" || rawUnit === "liters" || rawUnit === "litre") {
        wastePreventedByUnit.litres += qty;
      } else if (rawUnit === "pcs" || rawUnit === "pc" || rawUnit === "piece" || rawUnit === "pieces" || rawUnit === "portions" || rawUnit === "portion") {
        wastePreventedByUnit.pieces += qty;
      } else {
        wastePreventedByUnit.kg += qty;
      }
    }

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
      wastePreventedByUnit,
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
      wastePreventedByUnit: {
        kg: 0,
        pieces: 0,
        litres: 0,
      },
      mealsRedistributed: 0,
      co2eAvoidedKg: 0,
      hasActivity: false,
    };
  }
}

export interface LiveRedistributionTicket {
  id: string;
  item: string;
  institutionType: string;
  quantity: string;
  meals: string;
  status: "verified_safe" | "confirmed" | "delivered" | "pending" | "nearing_expiry" | "expired" | "in_transit";
  statusLabel?: string;
  isClaimed?: boolean;
}

export async function getLiveRedistributionTickets(): Promise<LiveRedistributionTicket[]> {
  try {
    const db = await getDb();

    const rawListings = await db
      .collection("surplusListings")
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    if (!rawListings || rawListings.length === 0) {
      return [];
    }

    const instIds = rawListings.map((l) => l.institutionId).filter(Boolean);
    const insts = await db
      .collection("institutions")
      .find({ _id: { $in: instIds } })
      .project({ name: 1, type: 1 })
      .toArray();

    const instMap = new Map(insts.map((i) => [i._id.toString(), i]));

    const formatType = (type?: string) => {
      if (!type) return "";
      const map: Record<string, string> = {
        college: "College Mess",
        hospital: "Hospital Dietary",
        hotel: "Hotel Banquet",
        corporate_cafeteria: "Corporate Cafeteria",
        caterer: "Caterer Banquet",
        commercial_kitchen: "Commercial Kitchen",
        processing_unit: "Processing Unit",
      };
      return map[type] || type.replace(/_/g, " ");
    };

    return rawListings.map((l) => {
      const inst = l.institutionId ? instMap.get(l.institutionId.toString()) : null;
      const instTypeName = inst?.type ? formatType(inst.type) : "";
      const institutionType = l.institutionName
        ? (instTypeName ? `${l.institutionName} • ${instTypeName}` : l.institutionName)
        : (instTypeName || "Institutional Kitchen");

      const qty = Number(l.quantity) || 0;
      const rawUnit = (l.unit || "kg").toLowerCase().trim();
      let displayUnit = l.unit || "kg";
      let mealsCount = 0;

      if (
        rawUnit === "pcs" ||
        rawUnit === "pc" ||
        rawUnit === "pieces" ||
        rawUnit === "piece" ||
        rawUnit === "portions"
      ) {
        displayUnit = "pcs";
        mealsCount = Math.max(1, Math.round(qty * 0.5));
      } else if (
        rawUnit === "l" ||
        rawUnit === "liter" ||
        rawUnit === "litres" ||
        rawUnit === "liters" ||
        rawUnit === "litre"
      ) {
        displayUnit = "L";
        mealsCount = Math.max(1, Math.round(qty * 2.5));
      } else {
        displayUnit = "kg";
        mealsCount = Math.max(1, Math.round(qty * 2.5));
      }

      let status: LiveRedistributionTicket["status"] = "verified_safe";
      let isClaimed = false;
      let statusLabel = "Verified Safe";

      if (l.status === "delivered") {
        status = "delivered";
        statusLabel = "Delivered";
      } else if (l.status === "claimed" || l.claimedAt || l.claimedByNgoId) {
        status = "confirmed";
        isClaimed = true;
        statusLabel = "Claimed";
      } else if (l.status === "expired" || l.safetyStatus === "rejected") {
        status = "expired";
        statusLabel = "Expired";
      } else if (l.status === "in_transit") {
        status = "in_transit";
        statusLabel = "In Transit";
      } else if (l.status === "matched") {
        status = "confirmed";
        statusLabel = "Matched";
      } else if (l.safetyStatus === "verified_safe") {
        status = "verified_safe";
        statusLabel = "Verified Safe";
      }

      const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(1);

      return {
        id: l._id.toString(),
        item: l.itemName || "Surplus Redistribution Batch",
        institutionType,
        quantity: `${formattedQty} ${displayUnit}`,
        meals: `~${mealsCount} meals`,
        status,
        statusLabel,
        isClaimed,
      };
    });
  } catch (err) {
    console.error("Error reading live redistribution tickets from MongoDB:", err);
    return [];
  }
}

export interface PublicNetworkNode {
  id: string;
  name: string;
  type: "kitchen" | "ngo";
  category?: string;
  address?: string;
  location: { lat: number; lng: number };
}

export interface PublicNetworkRoute {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  status: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
}

export async function getPublicNetworkData(): Promise<{
  nodes: PublicNetworkNode[];
  routes: PublicNetworkRoute[];
}> {
  try {
    const db = await getDb();

    const [institutions, ngos, assignments] = await Promise.all([
      db.collection("institutions").find({ "location.lat": { $exists: true } }).toArray(),
      db.collection("ngos").find({ kycStatus: "approved", "location.lat": { $exists: true } }).toArray(),
      db.collection("deliveryAssignments").find({}).sort({ createdAt: -1 }).limit(25).toArray(),
    ]);

    const seenNodes = new Set<string>();
    const dbNodes: PublicNetworkNode[] = [];

    // Deduplicate and populate active institutions
    institutions.forEach((inst) => {
      if (inst.location?.lat && inst.location?.lng) {
        const key = `${inst.name.trim().toLowerCase()}-${inst.location.lat.toFixed(3)}`;
        if (!seenNodes.has(key)) {
          seenNodes.add(key);
          dbNodes.push({
            id: String(inst._id),
            name: inst.name,
            type: "kitchen",
            category: inst.type || "commercial_kitchen",
            address: inst.address || "Metropolitan Kitchen Hub",
            location: { lat: inst.location.lat, lng: inst.location.lng },
          });
        }
      }
    });

    // Deduplicate and populate approved NGOs
    ngos.forEach((ngo) => {
      if (ngo.location?.lat && ngo.location?.lng) {
        const key = `${ngo.orgName.trim().toLowerCase()}-${ngo.location.lat.toFixed(3)}`;
        if (!seenNodes.has(key)) {
          seenNodes.add(key);
          dbNodes.push({
            id: String(ngo._id),
            name: ngo.orgName,
            type: "ngo",
            category: "verified_ngo",
            address: ngo.serviceArea || ngo.address || "Community Redistribution Center",
            location: { lat: ngo.location.lat, lng: ngo.location.lng },
          });
        }
      }
    });

    // Build real routes from delivery assignments
    const routes: PublicNetworkRoute[] = [];

    if (assignments.length > 0) {
      const listingIds = assignments.map((a) => a.surplusListingId || a.listingId).filter(Boolean);
      const ngoIds = assignments.map((a) => a.claimedByNgoId).filter(Boolean);

      const [listings, matchNgos] = await Promise.all([
        db.collection("surplusListings").find({ _id: { $in: listingIds } }).toArray(),
        db.collection("ngos").find({ _id: { $in: ngoIds } }).toArray(),
      ]);

      const lMap = new Map(listings.map((l) => [String(l._id), l]));
      const nMap = new Map(matchNgos.map((n) => [String(n._id), n]));

      assignments.forEach((a) => {
        const l = lMap.get(String(a.surplusListingId || a.listingId));
        const n = nMap.get(String(a.claimedByNgoId));
        if (l && n && l.pickupLocation?.lat && n.location?.lat) {
          routes.push({
            id: String(a._id),
            itemName: l.itemName || "Surplus Batch",
            quantity: l.quantity || 0,
            unit: l.unit || "kg",
            status: a.status || "in_transit",
            origin: {
              name: l.institutionName || "Donor Kitchen",
              lat: l.pickupLocation.lat,
              lng: l.pickupLocation.lng,
            },
            destination: {
              name: n.orgName || "Verified NGO",
              lat: n.location.lat,
              lng: n.location.lng,
            },
          });
        }
      });
    }

    return {
      nodes: dbNodes,
      routes,
    };
  } catch (err) {
    console.error("Error generating public network map data:", err);
    return {
      nodes: [],
      routes: [],
    };
  }
}

