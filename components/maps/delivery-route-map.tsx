"use client";

import React, { useRef, useCallback } from "react";
import type * as LeafletType from "leaflet";
import LeafletMapBase, { createCustomMarkerIcon, MapTheme } from "./leaflet-map-base";

interface DeliveryRouteMapProps {
  pickup: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  drop: {
    name: string;
    address: string;
    contactPhone?: string;
    lat?: number;
    lng?: number;
  };
  status?: "assigned" | "accepted" | "picked_up" | "delivered" | "confirmed";
  theme?: MapTheme;
  className?: string;
}

export default function DeliveryRouteMap({
  pickup,
  drop,
  status = "assigned",
  theme = "dark",
  className = "w-full h-72 sm:h-80",
}: DeliveryRouteMapProps) {
  const mapRef = useRef<LeafletType.Map | null>(null);
  const LRef = useRef<typeof LeafletType | null>(null);
  const boundsRef = useRef<LeafletType.LatLngBounds | null>(null);
  const polylineRef = useRef<LeafletType.Polyline | null>(null);
  const [routeInfo, setRouteInfo] = React.useState<{ distanceKm: number; durationMins: number } | null>(null);

  const handleMapReady = useCallback(
    async (map: LeafletType.Map, L: typeof LeafletType) => {
      mapRef.current = map;
      LRef.current = L;

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      // Resolve real pickup coordinates
      let pLat = pickup.lat && !isNaN(pickup.lat) ? pickup.lat : null;
      let pLng = pickup.lng && !isNaN(pickup.lng) ? pickup.lng : null;

      if ((!pLat || !pLng) && pickup.address) {
        try {
          if (mapboxToken) {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(pickup.address)}.json?access_token=${mapboxToken}&country=in&limit=1`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.features && data.features.length > 0) {
                [pLng, pLat] = data.features[0].center;
              }
            }
          } else {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup.address)}&limit=1`,
              { headers: { "Accept-Language": "en" } }
            );
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                pLat = parseFloat(data[0].lat);
                pLng = parseFloat(data[0].lon);
              }
            }
          }
        } catch (e) {
          console.warn("Could not geocode pickup address:", e);
        }
      }

      // Resolve real drop coordinates
      let dLat = drop.lat && !isNaN(drop.lat) ? drop.lat : null;
      let dLng = drop.lng && !isNaN(drop.lng) ? drop.lng : null;

      if ((!dLat || !dLng) && drop.address) {
        try {
          if (mapboxToken) {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(drop.address)}.json?access_token=${mapboxToken}&country=in&limit=1`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.features && data.features.length > 0) {
                [dLng, dLat] = data.features[0].center;
              }
            }
          } else {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(drop.address)}&limit=1`,
              { headers: { "Accept-Language": "en" } }
            );
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                dLat = parseFloat(data[0].lat);
                dLng = parseFloat(data[0].lon);
              }
            }
          }
        } catch (e) {
          console.warn("Could not geocode drop address:", e);
        }
      }

      // Fallbacks only if geocoding completely fails
      const finalPickupLat = pLat ?? 12.9716;
      const finalPickupLng = pLng ?? 77.5946;
      const finalDropLat = dLat ?? (finalPickupLat + 0.015);
      const finalDropLng = dLng ?? (finalPickupLng + 0.018);

      const pickupCoord: [number, number] = [finalPickupLat, finalPickupLng];
      const dropCoord: [number, number] = [finalDropLat, finalDropLng];

      // 1. Pickup Marker (Kitchen - Saffron)
      const pickupIcon = createCustomMarkerIcon(L, {
        type: "kitchen",
        label: "PICKUP",
        color: "#D9A441",
      });

      const pickupPopupContent = `
        <div class="p-3 text-xs space-y-1">
          <div class="font-mono-numeral text-[10px] uppercase tracking-wider text-[#D9A441] font-bold">1. Origin — Donor Kitchen</div>
          <div class="font-semibold text-sm">${pickup.name}</div>
          <div class="text-[#5A5548] leading-tight">${pickup.address}</div>
        </div>
      `;

      const pickupMarker = L.marker(pickupCoord, { icon: pickupIcon }).bindPopup(pickupPopupContent);
      pickupMarker.addTo(map);

      // 2. Drop Marker (NGO Recipient - Basil)
      const dropIcon = createCustomMarkerIcon(L, {
        type: "ngo",
        label: "DROP",
        color: "#2F4B3A",
      });

      const dropPopupContent = `
        <div class="p-3 text-xs space-y-1">
          <div class="font-mono-numeral text-[10px] uppercase tracking-wider text-[#2F4B3A] font-bold">2. Destination — Recipient NGO</div>
          <div class="font-semibold text-sm">${drop.name}</div>
          <div class="text-[#5A5548] leading-tight">${drop.address}</div>
          ${drop.contactPhone ? `<div class="pt-1"><a href="tel:${drop.contactPhone}" class="text-[#D9A441] font-mono-numeral underline">📞 ${drop.contactPhone}</a></div>` : ""}
        </div>
      `;

      const dropMarker = L.marker(dropCoord, { icon: dropIcon }).bindPopup(dropPopupContent);
      dropMarker.addTo(map);

      // 3. Real Road Routing via Mapbox Directions API
      let routePoints: [number, number][] = [];
      let roadDistanceKm = 0;
      let roadDurationMins = 0;

      if (mapboxToken) {
        try {
          const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${finalPickupLng},${finalPickupLat};${finalDropLng},${finalDropLat}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
          const res = await fetch(directionsUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const coords: [number, number][] = route.geometry.coordinates.map(
                (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
              );
              routePoints = coords;
              roadDistanceKm = Number((route.distance / 1000).toFixed(1));
              roadDurationMins = Math.max(1, Math.round(route.duration / 60));
              setRouteInfo({ distanceKm: roadDistanceKm, durationMins: roadDurationMins });
            }
          }
        } catch (e) {
          console.warn("Mapbox Directions API fallback:", e);
        }
      }

      // Direct corridor if Directions API unavailable
      if (routePoints.length === 0) {
        routePoints = [pickupCoord, dropCoord];
      }

      if (polylineRef.current) {
        polylineRef.current.remove();
      }

      const polyline = L.polyline(routePoints, {
        color: status === "confirmed" || status === "delivered" ? "#2F4B3A" : "#D9A441",
        weight: 4,
        opacity: 0.9,
        dashArray: status === "confirmed" ? undefined : "6, 6",
        lineCap: "round",
      }).addTo(map);
      polylineRef.current = polyline;

      // 4. In-Transit Courier Marker if active
      if (status === "accepted" || status === "picked_up") {
        const midIdx = Math.floor(routePoints.length * (status === "picked_up" ? 0.6 : 0.3));
        const courierPos = routePoints[midIdx] || routePoints[0];

        const courierIcon = createCustomMarkerIcon(L, {
          type: "courier",
          label: "EN ROUTE",
          pulsing: true,
          color: "#86C29B",
        });

        L.marker(courierPos, { icon: courierIcon })
          .bindPopup(
            `<div class="p-2 text-xs font-mono-numeral font-bold">Logistics Courier in Transit</div>`
          )
          .addTo(map);
      }

      // 5. Fit bounds to contain both points
      const bounds = L.latLngBounds([pickupCoord, dropCoord]);
      boundsRef.current = bounds;
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    },
    [pickup.lat, pickup.lng, pickup.name, pickup.address, drop.lat, drop.lng, drop.name, drop.address, drop.contactPhone, status]
  );

  const handleRecenter = () => {
    if (mapRef.current && boundsRef.current) {
      mapRef.current.fitBounds(boundsRef.current, { padding: [45, 45] });
    }
  };

  const initialLat = pickup.lat && !isNaN(pickup.lat) ? pickup.lat : 12.9716;
  const initialLng = pickup.lng && !isNaN(pickup.lng) ? pickup.lng : 77.5946;

  const gmapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    pickup.address || `${initialLat},${initialLng}`
  )}&destination=${encodeURIComponent(
    drop.address || `${initialLat},${initialLng}`
  )}&travelmode=driving`;

  return (
    <div className="relative border border-[#3B362E] rounded-[6px] overflow-hidden group">
      <LeafletMapBase
        center={[initialLat, initialLng]}
        zoom={13}
        theme={theme}
        className={className}
        onMapReady={handleMapReady}
      />

      {/* Floating Map Action Controls */}
      <div className="absolute top-2 right-2 z-[400] flex items-center gap-1.5 bg-[#1D1B17]/90 backdrop-blur-sm border border-[#3B362E] p-1 rounded-[6px] text-xs">
        <button
          type="button"
          onClick={handleRecenter}
          className="px-2 py-1 text-[11px] font-mono-numeral text-[#F3EEE2] hover:text-[#D9A441] transition-colors cursor-pointer"
          title="Recenter route view"
        >
          ⤢ Recenter
        </button>
        <span className="text-[#3B362E]">|</span>
        <a
          href={gmapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-1 text-[11px] font-mono-numeral text-[#D9A441] hover:underline flex items-center gap-1"
        >
          <span>↗ Open Directions</span>
        </a>
      </div>

      {/* Route Distance & Timing Indicator powered by Mapbox */}
      <div className="absolute bottom-2 left-2 z-[400] bg-[#1D1B17]/90 backdrop-blur-sm border border-[#3B362E] px-2.5 py-1 rounded-[4px] text-[11px] font-mono-numeral text-[#9E9587] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#86C29B] animate-pulse" />
        <span className="text-[#F3EEE2] font-semibold">Real-Road Corridor</span>
        <span>•</span>
        <span>{routeInfo ? `${routeInfo.distanceKm} km (~${routeInfo.durationMins} mins)` : "Active Logistics Line"}</span>
      </div>
    </div>
  );
}
