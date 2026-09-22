"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import type * as LeafletType from "leaflet";
import LeafletMapBase, { createCustomMarkerIcon } from "./leaflet-map-base";

export interface AdminMapDispatch {
  _id: string;
  itemName: string;
  quantity: number;
  unit: string;
  status: string;
  institutionName: string;
  ngoName: string;
  pickupLocation?: { lat?: number; lng?: number; address?: string };
  dropLocation?: { lat?: number; lng?: number; address?: string };
  courier?: { name: string; vehicleType?: string } | null;
}

export interface AdminMapFacility {
  _id: string;
  name: string;
  type: "kitchen" | "ngo";
  address?: string;
  location?: { lat?: number; lng?: number };
}

interface AdminCommandMapProps {
  dispatches: AdminMapDispatch[];
  facilities?: AdminMapFacility[];
  className?: string;
}

export default function AdminCommandMap({
  dispatches,
  facilities = [],
  className = "w-full h-80 sm:h-96",
}: AdminCommandMapProps) {
  const mapRef = useRef<LeafletType.Map | null>(null);
  const LRef = useRef<typeof LeafletType | null>(null);
  const layerGroupRef = useRef<LeafletType.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<"all" | "dispatches" | "kitchens" | "ngos">("all");

  const renderLayers = useCallback(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      layerGroupRef.current.clearLayers();
    }

    const group = layerGroupRef.current;
    const bounds = L.latLngBounds([]);

    // 1. Plot Dispatches & Logistics Routes
    if (activeFilter === "all" || activeFilter === "dispatches") {
      dispatches.forEach((d) => {
        if (!d.pickupLocation?.lat || !d.pickupLocation?.lng || !d.dropLocation?.lat || !d.dropLocation?.lng) {
          return;
        }

        const pLat = d.pickupLocation.lat;
        const pLng = d.pickupLocation.lng;
        const dLat = d.dropLocation.lat;
        const dLng = d.dropLocation.lng;

        const pCoord: [number, number] = [pLat, pLng];
        const dCoord: [number, number] = [dLat, dLng];
        bounds.extend(pCoord);
        bounds.extend(dCoord);

        // Origin Marker
        const pIcon = createCustomMarkerIcon(L, {
          type: "kitchen",
          label: d.institutionName.slice(0, 12),
          color: "#D9A441",
        });
        const pMarker = L.marker(pCoord, { icon: pIcon }).bindPopup(`
          <div class="p-2.5 text-xs text-left text-[#F3EEE2] space-y-1">
            <div class="text-[10px] text-[#D9A441] font-mono-numeral uppercase font-bold">Dispatch Origin</div>
            <div class="font-bold text-sm text-[#F3EEE2]">${d.institutionName}</div>
            <div class="text-[#C9B9C7] text-[11px]">${d.itemName} (${d.quantity} ${d.unit})</div>
          </div>
        `);
        group.addLayer(pMarker);

        // Destination Marker
        const dIcon = createCustomMarkerIcon(L, {
          type: "ngo",
          label: d.ngoName.slice(0, 12),
          color: "#86C29B",
        });
        const dMarker = L.marker(dCoord, { icon: dIcon }).bindPopup(`
          <div class="p-2.5 text-xs text-left text-[#F3EEE2] space-y-1">
            <div class="text-[10px] text-[#86C29B] font-mono-numeral uppercase font-bold">Dispatch Destination</div>
            <div class="font-bold text-sm text-[#F3EEE2]">${d.ngoName}</div>
            <div class="text-[#C9B9C7] text-[11px]">Status: ${d.status.replace("_", " ").toUpperCase()}</div>
          </div>
        `);
        group.addLayer(dMarker);

        // Curved Route Polyline
        const midLat = (pLat + dLat) / 2 + 0.004;
        const midLng = (pLng + dLng) / 2 - 0.004;
        const line = L.polyline([pCoord, [midLat, midLng], dCoord], {
          color: d.status === "confirmed" ? "#2F4B3A" : "#D9A441",
          weight: 3,
          dashArray: d.status === "confirmed" ? undefined : "6, 6",
          opacity: 0.8,
        });
        group.addLayer(line);

        // Courier Marker in Transit
        if (d.status === "accepted" || d.status === "picked_up") {
          const courierIcon = createCustomMarkerIcon(L, {
            type: "courier",
            label: d.courier?.name ? d.courier.name.slice(0, 10) : "IN TRANSIT",
            pulsing: true,
            color: "#D9A441",
          });
          const cMarker = L.marker([midLat, midLng], { icon: courierIcon }).bindPopup(`
            <div class="p-2 text-xs text-[#F3EEE2] font-mono-numeral">
              Courier: ${d.courier?.name || "Active Courier"} (${d.courier?.vehicleType || "two_wheeler"})
            </div>
          `);
          group.addLayer(cMarker);
        }
      });
    }

    // 2. Plot Registered Facilities
    if (activeFilter === "all" || activeFilter === "kitchens" || activeFilter === "ngos") {
      facilities.forEach((f) => {
        if (activeFilter === "kitchens" && f.type !== "kitchen") return;
        if (activeFilter === "ngos" && f.type !== "ngo") return;
        if (!f.location?.lat || !f.location?.lng) return;

        const coord: [number, number] = [f.location.lat, f.location.lng];
        bounds.extend(coord);

        const icon = createCustomMarkerIcon(L, {
          type: f.type,
          label: f.name.slice(0, 12),
          color: f.type === "kitchen" ? "#D9A441" : "#86C29B",
        });

        const marker = L.marker(coord, { icon }).bindPopup(`
          <div class="p-2.5 text-xs text-left text-[#F3EEE2] space-y-1">
            <div class="text-[10px] font-mono-numeral uppercase font-bold text-[#D9A441]">
              ${f.type === "kitchen" ? "Commercial Kitchen" : "Verified NGO"}
            </div>
            <div class="font-bold text-sm text-[#F3EEE2]">${f.name}</div>
            ${f.address ? `<div class="text-[#C9B9C7] text-[11px]">${f.address}</div>` : ""}
          </div>
        `);
        group.addLayer(marker);
      });
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [dispatches, facilities, activeFilter]);

  const handleMapReady = (map: LeafletType.Map, L: typeof LeafletType) => {
    mapRef.current = map;
    LRef.current = L;
    renderLayers();
  };

  useEffect(() => {
    if (mapRef.current && LRef.current) {
      renderLayers();
    }
  }, [renderLayers]);

  const fLat = facilities[0]?.location?.lat;
  const fLng = facilities[0]?.location?.lng;
  const dLat = dispatches[0]?.pickupLocation?.lat;
  const dLng = dispatches[0]?.pickupLocation?.lng;

  const initialCenter: [number, number] =
    typeof fLat === "number" && typeof fLng === "number"
      ? [fLat, fLng]
      : typeof dLat === "number" && typeof dLng === "number"
      ? [dLat, dLng]
      : [12.9716, 77.5946];

  return (
    <div className="relative border border-[#5A3653] rounded-[6px] overflow-hidden bg-[#1D1B17]">
      <LeafletMapBase
        center={initialCenter}
        zoom={facilities.length > 0 || dispatches.length > 0 ? 12 : 5}
        theme="dark"
        className={className}
        onMapReady={handleMapReady}
      />

      {/* Layer Filters & Operations Header */}
      <div className="absolute top-3 left-3 z-[400] bg-[#3D2538]/90 backdrop-blur-sm border border-[#5A3653] p-2 rounded-[6px] flex flex-wrap items-center gap-1.5 shadow-md">
        <span className="text-[10px] uppercase font-mono-numeral text-[#D9A441] font-bold px-1.5">
          Layers:
        </span>
        {(
          [
            { id: "all", label: "All Network" },
            { id: "dispatches", label: `Dispatches (${dispatches.length})` },
            { id: "kitchens", label: "Kitchens" },
            { id: "ngos", label: "NGOs" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`px-2 py-1 rounded text-[10px] font-mono-numeral transition-colors cursor-pointer ${
              activeFilter === f.id
                ? "bg-[#D9A441] text-[#24211C] font-bold"
                : "bg-[#4A2E44] text-[#C9B9C7] hover:text-[#F3EEE2]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Live Coordination Indicator */}
      <div className="absolute bottom-3 left-3 z-[400] bg-[#3D2538]/90 backdrop-blur-sm border border-[#5A3653] px-3 py-1.5 rounded-[4px] text-[11px] font-mono-numeral text-[#C9B9C7] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#86C29B] animate-pulse" />
        <span className="text-[#F3EEE2] font-semibold">City Operations Command</span>
        <span>•</span>
        <span>{dispatches.length} Active Logistics Runs</span>
      </div>
    </div>
  );
}
