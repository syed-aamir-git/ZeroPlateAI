"use client";

import React, { useRef, useEffect, useCallback } from "react";
import type * as LeafletType from "leaflet";
import LeafletMapBase, { createCustomMarkerIcon, MapTheme } from "./leaflet-map-base";

export interface DirectoryEntity {
  _id: string;
  name: string;
  subtitle?: string;
  type?: string;
  address?: string;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  badgeText?: string;
  badgeColor?: string;
  details?: Record<string, string | number>;
}

interface NetworkDirectoryMapProps {
  entities: DirectoryEntity[];
  entityType?: "ngo" | "kitchen";
  theme?: MapTheme;
  selectedId?: string | null;
  onSelect?: (entity: DirectoryEntity) => void;
  className?: string;
}

export default function NetworkDirectoryMap({
  entities,
  entityType = "ngo",
  theme = "light",
  selectedId,
  onSelect,
  className = "w-full h-[400px]",
}: NetworkDirectoryMapProps) {
  const mapRef = useRef<LeafletType.Map | null>(null);
  const LRef = useRef<typeof LeafletType | null>(null);
  const markersRef = useRef<Map<string, LeafletType.Marker>>(new Map());

  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    if (entities.length === 0) return;

    const bounds = L.latLngBounds([]);

    entities.forEach((entity, index) => {
      // Base location spread if coordinates are missing or clustered
      const baseLat = 28.6139;
      const baseLng = 77.209;
      const angle = (index * 2 * Math.PI) / Math.max(entities.length, 1);
      const radius = 0.04 + (index % 4) * 0.015;

      const lat = entity.location?.lat && !isNaN(entity.location.lat)
        ? entity.location.lat
        : baseLat + Math.sin(angle) * radius;

      const lng = entity.location?.lng && !isNaN(entity.location.lng)
        ? entity.location.lng
        : baseLng + Math.cos(angle) * radius;

      const coord: [number, number] = [lat, lng];
      bounds.extend(coord);

      const isSelected = selectedId === entity._id;
      const markerColor = entityType === "ngo" ? "#2F4B3A" : "#D9A441";

      const icon = createCustomMarkerIcon(L, {
        type: entityType === "ngo" ? "ngo" : "kitchen",
        label: entity.name.slice(0, 14),
        color: markerColor,
        pulsing: isSelected,
      });

      const detailsHtml = entity.details
        ? Object.entries(entity.details)
            .map(
              ([k, v]) => `
                <div class="flex justify-between text-[10px] border-b border-[#DCD3BE]/50 py-0.5">
                  <span class="text-[#5A5548] uppercase font-mono-numeral">${k}:</span>
                  <span class="font-semibold text-[#24211C]">${v}</span>
                </div>
              `
            )
            .join("")
        : "";

      const popupHtml = `
        <div class="p-3 space-y-1.5 text-left" style="min-width: 200px;">
          <div class="flex items-center justify-between">
            <span class="text-[9px] uppercase font-mono-numeral px-1.5 py-0.5 rounded font-bold text-white" style="background-color: ${markerColor};">
              ${entity.badgeText || (entityType === "ngo" ? "Verified NGO" : "Commercial Kitchen")}
            </span>
          </div>

          <div class="font-display text-sm font-bold text-[#24211C] leading-snug">${entity.name}</div>
          ${entity.subtitle ? `<div class="text-[11px] text-[#5A5548]">${entity.subtitle}</div>` : ""}

          ${
            entity.address || entity.location?.address
              ? `<div class="text-[10px] text-[#5A5548] leading-tight pt-1">
                  📍 ${entity.address || entity.location?.address}
                </div>`
              : ""
          }

          ${detailsHtml ? `<div class="pt-1.5 space-y-0.5">${detailsHtml}</div>` : ""}
        </div>
      `;

      const marker = L.marker(coord, { icon }).bindPopup(popupHtml);

      marker.on("click", () => {
        if (onSelect) onSelect(entity);
      });

      marker.addTo(map);
      markersRef.current.set(entity._id, marker);
    });

    if (entities.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
    }
  }, [entities, entityType, selectedId, onSelect]);

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

  useEffect(() => {
    if (!selectedId || !markersRef.current.has(selectedId) || !mapRef.current) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) {
      marker.openPopup();
      mapRef.current.panTo(marker.getLatLng(), { animate: true });
    }
  }, [selectedId]);

  return (
    <div className="relative border border-line rounded-[6px] overflow-hidden shadow-sm">
      <LeafletMapBase
        center={[28.6139, 77.209]}
        zoom={12}
        theme={theme}
        className={className}
        onMapReady={handleMapReady}
      />

      <div className="absolute bottom-2 left-2 z-[400] bg-[#FAF6EE]/90 backdrop-blur-sm border border-line px-2.5 py-1 rounded-[4px] text-[11px] font-mono-numeral text-ink-soft flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: entityType === "ngo" ? "#2F4B3A" : "#D9A441" }}
        />
        <span>
          {entities.length} {entityType === "ngo" ? "Verified NGOs" : "Facilities"} Mapped
        </span>
      </div>
    </div>
  );
}
