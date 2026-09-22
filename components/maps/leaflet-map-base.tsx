"use client";

import React, { useEffect, useRef, useState } from "react";
import type * as LeafletType from "leaflet";

export interface LatLng {
  lat: number;
  lng: number;
}

export type MapTheme = "light" | "dark";

interface LeafletMapBaseProps {
  center?: [number, number];
  zoom?: number;
  theme?: MapTheme;
  className?: string;
  onMapReady?: (map: LeafletType.Map, L: typeof LeafletType) => void;
  children?: React.ReactNode;
}

/**
 * Creates custom styled HTML/SVG markers for ZeroPlate design system.
 */
export function createCustomMarkerIcon(
  L: typeof LeafletType,
  options: {
    type: "kitchen" | "ngo" | "courier" | "surplus" | "pin";
    label?: string;
    pulsing?: boolean;
    color?: string;
  }
): LeafletType.DivIcon {
  const { type, label, pulsing = false, color } = options;

  let bg = color || "#D9A441"; // default saffron
  let iconSvg = "";
  let iconSize: [number, number] = [36, 36];
  let iconAnchor: [number, number] = [18, 36];

  switch (type) {
    case "kitchen":
      bg = color || "#D9A441"; // Saffron
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>`;
      break;
    case "ngo":
      bg = color || "#2F4B3A"; // Basil
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;
      break;
    case "courier":
      bg = color || "#D9A441";
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
      break;
    case "surplus":
      bg = color || "#D9A441";
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
      break;
    case "pin":
    default:
      bg = color || "#B85C38"; // Clay-rust
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
      break;
  }

  const pulseRing = pulsing
    ? `<span class="absolute -inset-1 rounded-full animate-ping opacity-75" style="background-color: ${bg};"></span>`
    : "";

  const labelBadge = label
    ? `<span class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-mono-numeral font-bold text-white shadow" style="background-color: ${bg};">${label}</span>`
    : "";

  const html = `
    <div class="relative flex items-center justify-center select-none" style="width: 36px; height: 36px;">
      ${pulseRing}
      <div class="relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white/90 transition-transform hover:scale-110" style="background-color: ${bg};">
        ${iconSvg}
      </div>
      ${labelBadge}
    </div>
  `;

  return L.divIcon({
    html,
    className: "zeroplate-custom-div-icon",
    iconSize,
    iconAnchor,
    popupAnchor: [0, -32],
  });
}

export default function LeafletMapBase({
  center = [12.9716, 77.5946], // Default center
  zoom = 12,
  theme = "light",
  className = "w-full h-full min-h-[300px]",
  onMapReady,
  children,
}: LeafletMapBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!containerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");

      if (!isMounted || !containerRef.current) return;

      // Initialize map instance
      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // Select tile layer based on Mapbox token & theme
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      let tileUrl: string;
      let tileOptions: LeafletType.TileLayerOptions;

      if (mapboxToken) {
        // High-definition retina vector/raster tiles from Mapbox
        const styleId = theme === "dark" ? "dark-v11" : "streets-v12";
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
        tileOptions = {
          maxZoom: 20,
          tileSize: 512,
          zoomOffset: -1,
        };
      } else {
        tileUrl =
          theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
        tileOptions = {
          maxZoom: 19,
          subdomains: "abcd",
        };
      }

      const tileLayer = L.tileLayer(tileUrl, tileOptions);
      tileLayer.addTo(map);

      // Attribution
      const attributionPrefix = mapboxToken
        ? '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a> | &copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        : '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a> | &copy; <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>';

      L.control
        .attribution({
          position: "bottomright",
          prefix: attributionPrefix,
        })
        .addTo(map);

      mapInstanceRef.current = map;
      setIsLoaded(true);

      // Invalidate size to avoid grey tiles
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      if (onMapReady) {
        onMapReady(map, L);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Resize observer to auto invalidateSize on layout shifts
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      className={`relative rounded-[6px] overflow-hidden ${
        theme === "dark" ? "dark-map bg-[#1D1B17]" : "bg-[#FAF6EE]"
      } ${className}`}
    >
      <div ref={containerRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit/70 text-xs font-mono-numeral text-ink-soft z-20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
            <span>Loading interactive map...</span>
          </div>
        </div>
      )}
      {isLoaded && children}
    </div>
  );
}
