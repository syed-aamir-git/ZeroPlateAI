"use client";

import React, { useRef, useEffect, useCallback } from "react";
import type * as LeafletType from "leaflet";
import LeafletMapBase, { createCustomMarkerIcon } from "./leaflet-map-base";
import { evaluateSurplusUrgency } from "@/lib/surplus-engine";

export interface MarketplaceListingItem {
  _id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  institutionName: string;
  pickupWindow?: {
    start: string;
    end: string;
  };
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  safetyStatus: string;
  status: string;
  createdAt?: string;
}

interface MarketplaceMapProps {
  listings: MarketplaceListingItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onClaim?: (id: string) => void;
  isKycApproved?: boolean;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  cooked_food: "#D9A441", // Saffron
  bakery: "#C86D51", // Clay Rust
  raw_produce: "#2F4B3A", // Basil
  dairy: "#3B6978", // Cool slate
  packaged_goods: "#6B5B95", // Indigo
};

export default function MarketplaceMap({
  listings,
  selectedId,
  onSelect,
  onClaim,
  isKycApproved = true,
  className = "w-full h-[450px]",
}: MarketplaceMapProps) {
  const mapRef = useRef<LeafletType.Map | null>(null);
  const LRef = useRef<typeof LeafletType | null>(null);
  const markersRef = useRef<Map<string, LeafletType.Marker>>(new Map());

  // Set up markers when map is ready or listings change
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    if (listings.length === 0) return;

    const bounds = L.latLngBounds([]);

    listings.forEach((item) => {
      if (!item.pickupLocation?.lat || !item.pickupLocation?.lng) return;

      const coord: [number, number] = [item.pickupLocation.lat, item.pickupLocation.lng];
      bounds.extend(coord);

      const urgency = evaluateSurplusUrgency({
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        expiryDeadline: item.pickupWindow?.end || new Date(),
      });
      const isRed = urgency.urgencyTier === "critical_red";
      const color = isRed ? "#DC2626" : CATEGORY_COLORS[item.category] || "#D9A441";
      const icon = createCustomMarkerIcon(L, {
        type: "surplus",
        label: `${item.quantity} ${item.unit}`,
        color,
        pulsing: isRed || selectedId === item._id,
      });

      const start = item.pickupWindow?.start ? new Date(item.pickupWindow.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Immediate";
      const end = item.pickupWindow?.end ? new Date(item.pickupWindow.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Tonight";

      const popupHtml = `
        <div class="p-3.5 space-y-2 text-left" style="min-width: 220px;">
          <div class="flex items-center justify-between border-b border-[#DCD3BE] pb-1.5">
            <span class="text-[9px] uppercase font-mono-numeral font-bold px-1.5 py-0.5 rounded text-white" style="background-color: ${color};">
              ${isRed ? "🔴 CRITICAL RESCUE" : item.category.replace("_", " ")}
            </span>
            <span class="text-xs font-mono-numeral font-bold text-[#2F4B3A]">
              ${item.quantity} ${item.unit}
            </span>
          </div>

          <div>
            <div class="font-display text-sm font-bold text-[#24211C] leading-snug">${item.itemName}</div>
            <div class="text-[11px] text-[#5A5548] font-medium">${item.institutionName}</div>
          </div>

          <div class="bg-[#EDE6D6] p-2 rounded text-[11px] space-y-0.5 text-[#24211C]">
            <div class="font-mono-numeral text-[10px] text-[#5A5548] uppercase">Pickup Bay</div>
            <div class="truncate text-[11px]">${item.pickupLocation?.address || "Main Dispatch Gate"}</div>
            <div class="text-[10px] ${isRed ? "text-[#DC2626] font-bold" : "text-[#2F4B3A]"} font-mono-numeral">
              ${isRed ? `⚠️ Window Closes in ${urgency.timeRemainingHours.toFixed(1)}h!` : `Window: ${start} - ${end}`}
            </div>
          </div>

          ${
            isKycApproved
              ? `<button id="claim-btn-${item._id}" class="w-full mt-2 py-2 px-3 rounded-[4px] ${isRed ? "bg-[#DC2626] hover:bg-[#b91c1c]" : "bg-[#2F4B3A] hover:bg-[#23382c]"} text-white font-semibold text-xs transition-colors cursor-pointer text-center block">
                  ${isRed ? "🚨 Urgent Claim" : "✓ Claim This Listing"}
                </button>`
              : `<div class="text-[10px] text-[#B85C38] text-center pt-1 font-mono-numeral">KYC approval required to claim</div>`
          }
        </div>
      `;

      const marker = L.marker(coord, { icon }).bindPopup(popupHtml, { maxWidth: 260 });

      marker.on("click", () => {
        if (onSelect) onSelect(item._id);
      });

      marker.on("popupopen", () => {
        const claimBtn = document.getElementById(`claim-btn-${item._id}`);
        if (claimBtn && onClaim) {
          claimBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClaim(item._id);
          };
        }
      });

      marker.addTo(map);
      markersRef.current.set(item._id, marker);
    });

    if (listings.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [listings, selectedId, isKycApproved, onSelect, onClaim]);

  const handleMapReady = (map: LeafletType.Map, L: typeof LeafletType) => {
    mapRef.current = map;
    LRef.current = L;
    renderMarkers();
  };

  useEffect(() => {
    if (mapRef.current && LRef.current) {
      renderMarkers();
    }
  }, [renderMarkers]);

  // Highlight and pan to selected marker if selectedId changes
  useEffect(() => {
    if (!selectedId || !markersRef.current.has(selectedId) || !mapRef.current) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) {
      marker.openPopup();
      mapRef.current.panTo(marker.getLatLng(), { animate: true });
    }
  }, [selectedId]);

  const pLat = listings[0]?.pickupLocation?.lat;
  const pLng = listings[0]?.pickupLocation?.lng;
  const initialCenter: [number, number] =
    typeof pLat === "number" && typeof pLng === "number"
      ? [pLat, pLng]
      : [12.9716, 77.5946];

  return (
    <div className="relative border border-line rounded-[6px] overflow-hidden shadow-sm">
      <LeafletMapBase
        center={initialCenter}
        zoom={listings.length > 0 ? 12 : 5}
        theme="light"
        className={className}
        onMapReady={handleMapReady}
      />

      {/* Legend & Stats Overlay */}
      <div className="absolute top-3 left-3 z-[400] bg-[#FAF6EE]/95 backdrop-blur-sm border border-line p-2.5 rounded-[6px] shadow-sm max-w-xs text-xs space-y-1.5 hidden sm:block">
        <div className="font-mono-numeral text-[10px] uppercase tracking-wider text-ink-soft font-semibold flex items-center justify-between">
          <span>Surplus Map View</span>
          <span className="text-basil font-bold">{listings.length} Available</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9A441]" /> Cooked Food
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C86D51]" /> Bakery
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F4B3A]" /> Produce
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B6978]" /> Dairy
          </span>
        </div>
      </div>
    </div>
  );
}
