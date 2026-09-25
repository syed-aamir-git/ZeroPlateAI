"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import type * as LeafletType from "leaflet";
import LeafletMapBase, { createCustomMarkerIcon, MapTheme } from "./leaflet-map-base";

export interface CourierLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  name?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  phone?: string;
  updatedAt?: string | Date;
}

export interface DeliveryRouteMapProps {
  pickup: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
    contactPhone?: string;
  };
  drop: {
    name: string;
    address: string;
    contactPhone?: string;
    lat?: number;
    lng?: number;
  };
  status?: "assigned" | "accepted" | "picked_up" | "delivered" | "confirmed";
  courierLocation?: CourierLocation | null;
  courierInfo?: {
    name?: string;
    phone?: string;
    vehicleType?: string;
    vehicleNumber?: string;
  } | null;
  role?: "driver" | "institution" | "ngo";
  urgencyTier?: "critical_red" | "urgent_yellow" | "safe_green";
  theme?: MapTheme;
  className?: string;
  onLocationUpdate?: (location: { lat: number; lng: number; heading?: number; speed?: number }) => void;
}

export interface VehicleConfig {
  typeKey: string;
  label: string;
  modelDesc: string;
  emoji: string;
  svg: string;
}

export function getVehicleConfig(type?: string): VehicleConfig {
  const norm = (type || "").toLowerCase().trim();

  if (norm === "four_wheeler" || norm === "car") {
    return {
      typeKey: "four_wheeler",
      label: "Four-Wheeler (Car)",
      modelDesc: "Compact Delivery Car / Hatchback",
      emoji: "🚗",
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM7.5 15c-.83 0-1.5-.67-1.5-1.5S6.67 12 7.5 12s1.5.67 1.5 1.5S8.33 15 7.5 15zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>`,
    };
  }

  if (norm === "van") {
    return {
      typeKey: "van",
      label: "Delivery Cargo Van",
      modelDesc: "High-Capacity Cargo Van",
      emoji: "🚐",
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 8h-3V4H1v13h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>`,
    };
  }

  if (norm === "electric_cargo" || norm === "ev") {
    return {
      typeKey: "electric_cargo",
      label: "Electric Cargo EV",
      modelDesc: "Zero-Emission Electric Scooter / EV Loader",
      emoji: "⚡🛵",
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm10 4.5c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-4.5c-.83 0-1.5-.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-5-3.5 2-4h-3V4l-4 6h3l-2 5h4z"/>
      </svg>`,
    };
  }

  if (norm === "three_wheeler" || norm === "auto") {
    return {
      typeKey: "three_wheeler",
      label: "Three-Wheeler / Auto",
      modelDesc: "Commercial Cargo Three-Wheeler",
      emoji: "🛺",
      svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 12h-2V7.5c0-.83-.67-1.5-1.5-1.5H7.5C6.67 6 6 6.67 6 7.5V12H4c-1.1 0-2 .9-2 2v2h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-2c0-1.1-.9-2-2-2zm-12 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM7.5 8h8v3h-8V8z"/>
      </svg>`,
    };
  }

  // Default: Two-Wheeler (Motorcycle / Scooter)
  return {
    typeKey: "two_wheeler",
    label: "Two-Wheeler (Scooter/Bike)",
    modelDesc: "High-Agility Logistics Scooter / Motorcycle",
    emoji: "🛵",
    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h3.5l4-5.5H19V7zm-12 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
    </svg>`,
  };
}

export function calculateDeliveryEtas(
  status: string,
  totalDurationMins: number = 18
) {
  const now = new Date();

  const formatClock = (d: Date) =>
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (status === "accepted") {
    // Partner is on the way to pick up from donor kitchen
    const pickupMins = Math.max(3, Math.round(totalDurationMins * 0.4));
    const pickupDate = new Date(now.getTime() + pickupMins * 60000);

    const dropMins = pickupMins + totalDurationMins;
    const dropDate = new Date(now.getTime() + dropMins * 60000);

    return {
      isPickupDone: false,
      isDropDone: false,
      pickupMins,
      pickupClockTime: formatClock(pickupDate),
      dropMins,
      dropClockTime: formatClock(dropDate),
    };
  }

  if (status === "picked_up") {
    // Food has already been picked up; courier is en route to NGO
    const dropMins = Math.max(2, Math.round(totalDurationMins * 0.65));
    const dropDate = new Date(now.getTime() + dropMins * 60000);

    return {
      isPickupDone: true,
      isDropDone: false,
      pickupMins: 0,
      pickupClockTime: "Collected ✓",
      dropMins,
      dropClockTime: formatClock(dropDate),
    };
  }

  if (status === "delivered" || status === "confirmed") {
    return {
      isPickupDone: true,
      isDropDone: true,
      pickupMins: 0,
      pickupClockTime: "Completed ✓",
      dropMins: 0,
      dropClockTime: "Delivered ✓",
    };
  }

  // Assigned / default
  const pMins = Math.max(4, Math.round(totalDurationMins * 0.4));
  const pDate = new Date(now.getTime() + pMins * 60000);
  const dDate = new Date(now.getTime() + (pMins + totalDurationMins) * 60000);

  return {
    isPickupDone: false,
    isDropDone: false,
    pickupMins: pMins,
    pickupClockTime: formatClock(pDate),
    dropMins: pMins + totalDurationMins,
    dropClockTime: formatClock(dDate),
  };
}

function createFoodDeliveryCourierIcon(
  L: typeof LeafletType,
  options: {
    name?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    heading?: number;
    role?: string;
  }
) {
  const vehicleConfig = getVehicleConfig(options.vehicleType);
  const label = options.name || (options.role === "driver" ? "You (Driver)" : "Delivery Partner");

  const html = `
    <div class="relative flex items-center justify-center select-none" style="width: 52px; height: 52px; cursor: pointer;">
      <!-- Glowing radar ripple rings (Swiggy / Zomato live style) -->
      <span class="absolute -inset-2 rounded-full animate-ping opacity-75 bg-emerald-500 pointer-events-none"></span>
      <span class="absolute -inset-1 rounded-full animate-pulse opacity-50 bg-emerald-400 pointer-events-none"></span>
      
      <!-- Disc displaying high-fidelity vector model of the vehicle -->
      <div class="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl border-2 border-white bg-gradient-to-br from-emerald-600 to-emerald-800 hover:scale-110 transition-transform">
        <div class="w-6 h-6 flex items-center justify-center drop-shadow-md text-white">
          ${vehicleConfig.svg}
        </div>
      </div>
      
      <!-- Driver name & vehicle model live pill badge -->
      <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-mono-numeral font-bold text-white shadow-lg bg-[#1D1B17] border border-emerald-500/70 flex items-center gap-1.5 z-20">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span>${vehicleConfig.emoji} ${label}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "zeroplate-courier-live-icon",
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -28],
  });
}

export default function DeliveryRouteMap({
  pickup,
  drop,
  status = "assigned",
  courierLocation,
  courierInfo,
  role = "institution",
  urgencyTier,
  theme = "dark",
  className = "w-full h-80 sm:h-96",
  onLocationUpdate,
}: DeliveryRouteMapProps) {
  const mapRef = useRef<LeafletType.Map | null>(null);
  const LRef = useRef<typeof LeafletType | null>(null);
  const boundsRef = useRef<LeafletType.LatLngBounds | null>(null);
  const polylineRef = useRef<LeafletType.Polyline | null>(null);
  const courierMarkerRef = useRef<LeafletType.Marker | null>(null);
  const routePointsRef = useRef<[number, number][]>([]);
  const simStepRef = useRef<number>(0);

  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMins: number } | null>(null);
  const [currentCourierPos, setCurrentCourierPos] = useState<{ lat: number; lng: number } | null>(
    courierLocation ? { lat: courierLocation.lat, lng: courierLocation.lng } : null
  );

  const isActiveDelivery = status === "accepted" || status === "picked_up";
  const driverName = courierLocation?.name || courierInfo?.name || "Assigned Driver";
  const vehicleType = courierLocation?.vehicleType || courierInfo?.vehicleType || "two_wheeler";
  const vehicleNumber = courierLocation?.vehicleNumber || courierInfo?.vehicleNumber || "";
  const vehicleConfig = getVehicleConfig(vehicleType);

  // Compute live estimated time of pickup and time of drop-off
  const etas = calculateDeliveryEtas(status, routeInfo?.durationMins || 18);

  // Build Popup Content for the live Courier Marker
  const buildCourierPopupContent = useCallback(
    (posLat: number, posLng: number) => {
      const statusText =
        status === "accepted"
          ? "En Route to Pickup Kitchen"
          : status === "picked_up"
          ? "En Route to Recipient Shelter"
          : "Active Logistics Corridor";

      return `
        <div class="p-3 text-xs space-y-2 min-w-[220px]">
          <div class="flex items-center justify-between border-b border-stone-700/50 pb-1">
            <span class="font-mono-numeral text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Delivery GPS
            </span>
            <span class="text-[10px] text-stone-400 font-mono-numeral">Real-time</span>
          </div>

          <div>
            <div class="font-bold text-sm text-[#F3EEE2] flex items-center gap-1.5">
              <span>${driverName}</span>
              ${vehicleNumber ? `<span class="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] border border-amber-400/40">${vehicleNumber}</span>` : ""}
            </div>
            <div class="text-[11px] text-emerald-300 font-medium mt-0.5 flex items-center gap-1">
              <span>${vehicleConfig.emoji}</span>
              <span>${vehicleConfig.modelDesc}</span>
            </div>
          </div>

          <div class="bg-stone-900/90 rounded p-2 border border-stone-700/50 space-y-1 text-[11px]">
            <div class="flex items-center justify-between">
              <span class="text-stone-400 font-mono-numeral">📍 Est. Pickup:</span>
              <span class="font-semibold text-amber-300 font-mono-numeral">
                ${etas.isPickupDone ? "Collected ✓" : `${etas.pickupClockTime} (~${etas.pickupMins}m)`}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-stone-400 font-mono-numeral">🎯 Est. Drop-off:</span>
              <span class="font-semibold text-emerald-400 font-mono-numeral">
                ${etas.isDropDone ? "Delivered ✓" : `${etas.dropClockTime} (~${etas.dropMins}m)`}
              </span>
            </div>
          </div>

          <div class="text-xs text-stone-300 font-medium">${statusText}</div>

          ${
            courierInfo?.phone
              ? `<div class="pt-1"><a href="tel:${courierInfo.phone}" class="inline-flex items-center gap-1 text-emerald-400 font-mono-numeral underline">📞 Call Driver: ${courierInfo.phone}</a></div>`
              : ""
          }

          <div class="text-[10px] text-stone-500 font-mono-numeral pt-0.5">
            Coordinates: ${posLat.toFixed(4)}, ${posLng.toFixed(4)}
          </div>
        </div>
      `;
    },
    [driverName, vehicleNumber, vehicleConfig, status, etas, courierInfo?.phone]
  );

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
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                pickup.address
              )}.json?access_token=${mapboxToken}&country=in&limit=1`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.features && data.features.length > 0) {
                [pLng, pLat] = data.features[0].center;
              }
            }
          } else {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                pickup.address
              )}&limit=1`,
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
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                drop.address
              )}.json?access_token=${mapboxToken}&country=in&limit=1`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.features && data.features.length > 0) {
                [dLng, dLat] = data.features[0].center;
              }
            }
          } else {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                drop.address
              )}&limit=1`,
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

      // Fallbacks
      const finalPickupLat = pLat ?? 12.9716;
      const finalPickupLng = pLng ?? 77.5946;
      const finalDropLat = dLat ?? (finalPickupLat + 0.015);
      const finalDropLng = dLng ?? (finalPickupLng + 0.018);

      const pickupCoord: [number, number] = [finalPickupLat, finalPickupLng];
      const dropCoord: [number, number] = [finalDropLat, finalDropLng];

      // 1. Pickup Marker (Kitchen - Saffron)
      const pickupIcon = createCustomMarkerIcon(L, {
        type: "kitchen",
        label: "📍 PICKUP",
        color: "#D9A441",
      });

      const pickupPopupContent = `
        <div class="p-3 text-xs space-y-1 min-w-[180px]">
          <div class="font-mono-numeral text-[10px] uppercase tracking-wider text-[#D9A441] font-bold">1. Origin — Donor Kitchen</div>
          <div class="font-semibold text-sm text-[#F3EEE2]">${pickup.name}</div>
          <div class="text-[#D4CBBF] leading-tight">${pickup.address}</div>
          <div class="pt-1 text-[11px] font-mono-numeral text-amber-300">
            Est. Pickup: ${etas.pickupClockTime}
          </div>
          ${
            pickup.contactPhone
              ? `<div class="pt-1"><a href="tel:${pickup.contactPhone}" class="text-[#D9A441] font-mono-numeral underline">📞 Call Kitchen: ${pickup.contactPhone}</a></div>`
              : ""
          }
        </div>
      `;

      const pickupMarker = L.marker(pickupCoord, { icon: pickupIcon }).bindPopup(pickupPopupContent);
      pickupMarker.addTo(map);

      // 2. Drop Marker (NGO Recipient - Basil Green)
      const dropIcon = createCustomMarkerIcon(L, {
        type: "ngo",
        label: "🎯 DROP",
        color: "#2F4B3A",
      });

      const dropPopupContent = `
        <div class="p-3 text-xs space-y-1 min-w-[180px]">
          <div class="font-mono-numeral text-[10px] uppercase tracking-wider text-emerald-400 font-bold">2. Destination — Recipient NGO</div>
          <div class="font-semibold text-sm text-[#F3EEE2]">${drop.name}</div>
          <div class="text-[#D4CBBF] leading-tight">${drop.address}</div>
          <div class="pt-1 text-[11px] font-mono-numeral text-emerald-300">
            Est. Drop-off: ${etas.dropClockTime}
          </div>
          ${
            drop.contactPhone
              ? `<div class="pt-1"><a href="tel:${drop.contactPhone}" class="text-emerald-400 font-mono-numeral underline">📞 Call NGO: ${drop.contactPhone}</a></div>`
              : ""
          }
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

      if (routePoints.length === 0) {
        routePoints = [pickupCoord, dropCoord];
      }
      routePointsRef.current = routePoints;

      if (polylineRef.current) {
        polylineRef.current.remove();
      }

      const isRed = urgencyTier === "critical_red";
      const lineColor = isRed
        ? "#DC2626"
        : status === "confirmed" || status === "delivered"
        ? "#2F4B3A"
        : "#D9A441";

      const polyline = L.polyline(routePoints, {
        color: lineColor,
        weight: isRed ? 5 : 4,
        opacity: 0.95,
        dashArray: status === "confirmed" ? undefined : isRed ? "4, 4" : "6, 6",
        lineCap: "round",
      }).addTo(map);
      polylineRef.current = polyline;

      // 4. Live Food Delivery Courier Marker with vehicle-specific model icon
      if (isActiveDelivery) {
        let initialPos: [number, number];

        if (courierLocation?.lat && courierLocation?.lng) {
          initialPos = [courierLocation.lat, courierLocation.lng];
        } else {
          // Starting offset along the real road
          const ratio = status === "picked_up" ? 0.45 : 0.15;
          const idx = Math.min(
            routePoints.length - 1,
            Math.max(0, Math.floor(routePoints.length * ratio))
          );
          initialPos = routePoints[idx] || pickupCoord;
        }

        setCurrentCourierPos({ lat: initialPos[0], lng: initialPos[1] });

        const courierIcon = createFoodDeliveryCourierIcon(L, {
          name: driverName,
          vehicleType,
          vehicleNumber,
          role,
        });

        if (courierMarkerRef.current) {
          courierMarkerRef.current.remove();
        }

        const marker = L.marker(initialPos, { icon: courierIcon, zIndexOffset: 1000 })
          .bindPopup(buildCourierPopupContent(initialPos[0], initialPos[1]))
          .addTo(map);

        courierMarkerRef.current = marker;
      }

      // 5. Fit bounds to contain all points
      const boundsCoords: [number, number][] = [pickupCoord, dropCoord];
      if (courierLocation?.lat && courierLocation?.lng) {
        boundsCoords.push([courierLocation.lat, courierLocation.lng]);
      }
      const bounds = L.latLngBounds(boundsCoords);
      boundsRef.current = bounds;
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    },
    [
      pickup.lat,
      pickup.lng,
      pickup.name,
      pickup.address,
      pickup.contactPhone,
      drop.lat,
      drop.lng,
      drop.name,
      drop.address,
      drop.contactPhone,
      status,
      isActiveDelivery,
      courierLocation,
      driverName,
      vehicleType,
      vehicleNumber,
      role,
      urgencyTier,
      etas,
      buildCourierPopupContent,
    ]
  );

  // Sync marker when external courierLocation changes
  useEffect(() => {
    if (!courierLocation || !courierLocation.lat || !courierLocation.lng) return;

    setCurrentCourierPos({ lat: courierLocation.lat, lng: courierLocation.lng });

    if (courierMarkerRef.current) {
      courierMarkerRef.current.setLatLng([courierLocation.lat, courierLocation.lng]);
      courierMarkerRef.current.setPopupContent(
        buildCourierPopupContent(courierLocation.lat, courierLocation.lng)
      );

      if (mapRef.current && !mapRef.current.getBounds().contains([courierLocation.lat, courierLocation.lng])) {
        mapRef.current.panTo([courierLocation.lat, courierLocation.lng], { animate: true });
      }
    }
  }, [courierLocation, buildCourierPopupContent]);

  // Fallback smooth simulation along real road if live GPS not updating
  useEffect(() => {
    if (!isActiveDelivery) return;

    const interval = setInterval(() => {
      const points = routePointsRef.current;
      if (!points || points.length < 2) return;

      const totalSteps = points.length;
      let nextStep = simStepRef.current + 1;
      if (nextStep >= totalSteps) {
        nextStep = Math.floor(totalSteps * (status === "picked_up" ? 0.3 : 0.05));
      }
      simStepRef.current = nextStep;

      const targetCoord = points[nextStep];
      if (targetCoord && courierMarkerRef.current) {
        courierMarkerRef.current.setLatLng(targetCoord);
        courierMarkerRef.current.setPopupContent(
          buildCourierPopupContent(targetCoord[0], targetCoord[1])
        );
        setCurrentCourierPos({ lat: targetCoord[0], lng: targetCoord[1] });

        if (onLocationUpdate) {
          onLocationUpdate({
            lat: targetCoord[0],
            lng: targetCoord[1],
            heading: 0,
            speed: 30,
          });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isActiveDelivery, status, buildCourierPopupContent, onLocationUpdate]);

  const handleRecenter = () => {
    if (mapRef.current && boundsRef.current) {
      mapRef.current.fitBounds(boundsRef.current, { padding: [50, 50] });
    }
  };

  const initialLat = pickup.lat && !isNaN(pickup.lat) ? pickup.lat : 12.9716;
  const initialLng = pickup.lng && !isNaN(pickup.lng) ? pickup.lng : 77.5946;

  const targetDestination = status === "accepted" ? pickup : drop;
  const gmapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    currentCourierPos ? `${currentCourierPos.lat},${currentCourierPos.lng}` : pickup.address
  )}&destination=${encodeURIComponent(
    targetDestination.address || `${initialLat},${initialLng}`
  )}&travelmode=driving`;

  return (
    <div className="relative border border-[#3B362E] rounded-[8px] overflow-hidden group shadow-lg">
      <LeafletMapBase
        center={[initialLat, initialLng]}
        zoom={13}
        theme={theme}
        className={className}
        onMapReady={handleMapReady}
      />

      {/* Live Food Delivery Tracking HUD with Estimated Pickup & Drop-off Times */}
      {isActiveDelivery && (
        <div className="absolute top-3 left-3 right-16 sm:right-auto z-[400] bg-[#1D1B17]/95 backdrop-blur-md border border-[#3B362E] p-3 rounded-[8px] shadow-xl max-w-sm">
          {/* Header with Vehicle Type Badge & Pulse */}
          <div className="flex items-center justify-between gap-2 border-b border-[#3B362E]/60 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-mono-numeral text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <span>{vehicleConfig.emoji}</span>
                <span>{status === "accepted" ? "En Route to Pickup" : "In Transit to NGO"}</span>
              </span>
            </div>
            <span className="text-[10px] font-mono-numeral text-stone-300 bg-stone-800 px-1.5 py-0.5 rounded border border-[#3B362E]">
              {vehicleConfig.label}
            </span>
          </div>

          {/* Delivery Points Details */}
          <div className="text-xs text-[#F3EEE2] font-semibold mt-1.5 truncate">
            {status === "accepted" ? `Pickup: ${pickup.name}` : `Destination: ${drop.name}`}
          </div>

          {/* Estimated Pickup & Drop-Off Timings Card */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#3B362E]/60 text-[11px] font-mono-numeral">
            <div className="bg-[#24211C] p-1.5 rounded border border-[#3B362E]">
              <div className="text-stone-400 text-[10px]">📍 Pickup Time</div>
              <div className="font-bold text-amber-300 text-xs">
                {etas.isPickupDone ? "Collected ✓" : etas.pickupClockTime}
              </div>
              {!etas.isPickupDone && (
                <div className="text-[10px] text-stone-500">~{etas.pickupMins}m away</div>
              )}
            </div>

            <div className="bg-[#24211C] p-1.5 rounded border border-[#3B362E]">
              <div className="text-stone-400 text-[10px]">🎯 Drop-off Time</div>
              <div className="font-bold text-emerald-400 text-xs">
                {etas.isDropDone ? "Delivered ✓" : etas.dropClockTime}
              </div>
              {!etas.isDropDone && (
                <div className="text-[10px] text-stone-500">~{etas.dropMins}m away</div>
              )}
            </div>
          </div>

          {/* Distance & GPS indicator */}
          <div className="flex items-center justify-between text-[10px] font-mono-numeral text-[#D4CBBF] mt-2 pt-1 border-t border-[#3B362E]/40">
            <span>
              {routeInfo ? `${routeInfo.distanceKm} km total corridor` : "Road corridor computed"}
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
        </div>
      )}

      {/* Floating Map Action Controls */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 bg-[#1D1B17]/95 backdrop-blur-md border border-[#3B362E] p-1.5 rounded-[6px] text-xs shadow-lg">
        <button
          type="button"
          onClick={handleRecenter}
          className="px-2 py-1 text-[11px] font-mono-numeral text-[#F3EEE2] hover:text-[#D9A441] transition-colors cursor-pointer"
          title="Recenter corridor view"
        >
          ⤢ Fit
        </button>
        <span className="text-[#3B362E]">|</span>
        <a
          href={gmapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-1 text-[11px] font-mono-numeral text-[#D9A441] hover:underline flex items-center gap-1"
          title="Open in Google Maps Navigation"
        >
          <span>🧭 Navigate</span>
        </a>
      </div>

      {/* Footer Corridor Stats */}
      <div className="absolute bottom-2 left-2 z-[400] bg-[#1D1B17]/90 backdrop-blur-sm border border-[#3B362E] px-2.5 py-1 rounded-[4px] text-[11px] font-mono-numeral text-[#9E9587] flex items-center gap-2 flex-wrap">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            urgencyTier === "critical_red" ? "bg-red-500 animate-ping" : "bg-[#86C29B] animate-pulse"
          }`}
        />
        <span className="text-[#F3EEE2] font-semibold">
          {vehicleConfig.emoji} {vehicleConfig.label}
        </span>
        <span>•</span>
        <span>{routeInfo ? `${routeInfo.distanceKm} km` : "Active Line"}</span>
        {currentCourierPos && (
          <>
            <span>•</span>
            <span className="text-emerald-400">
              📍 {currentCourierPos.lat.toFixed(3)}, {currentCourierPos.lng.toFixed(3)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
