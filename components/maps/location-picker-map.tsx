"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import type * as LeafletType from "leaflet";
import LeafletMapBase, { createCustomMarkerIcon, MapTheme } from "./leaflet-map-base";

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  radiusMeters?: number;
  theme?: MapTheme;
  pinType?: "kitchen" | "ngo" | "pin" | "courier";
  label?: string;
  readOnly?: boolean;
  onChange?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

interface GeocodeSuggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

export default function LocationPickerMap({
  lat,
  lng,
  radiusMeters,
  theme = "light",
  pinType = "pin",
  label = "Drag or click to position pin",
  readOnly = false,
  onChange,
  className = "w-full h-64 sm:h-72",
}: LocationPickerMapProps) {
  const mapRef = useRef<LeafletType.Map | null>(null);
  const LRef = useRef<typeof LeafletType | null>(null);
  const markerRef = useRef<LeafletType.Marker | null>(null);
  const circleRef = useRef<LeafletType.Circle | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const safeLat = !isNaN(lat) && lat !== 0 ? lat : 28.6139;
  const safeLng = !isNaN(lng) && lng !== 0 ? lng : 77.209;

  const updateMarkerAndCircle = useCallback(
    (newLat: number, newLng: number) => {
      const map = mapRef.current;
      const L = LRef.current;
      if (!map || !L) return;

      const coord: [number, number] = [newLat, newLng];

      if (!markerRef.current) {
        const icon = createCustomMarkerIcon(L, {
          type: pinType,
          label: "TARGET",
          color: pinType === "ngo" ? "#2F4B3A" : "#D9A441",
        });

        const marker = L.marker(coord, {
          icon,
          draggable: !readOnly,
        });

        if (!readOnly) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            if (onChange) {
              onChange({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
            }
          });
        }

        marker.addTo(map);
        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng(coord);
      }

      // Handle service radius circle if specified
      if (radiusMeters && radiusMeters > 0) {
        if (!circleRef.current) {
          const circle = L.circle(coord, {
            radius: radiusMeters,
            color: pinType === "ngo" ? "#2F4B3A" : "#D9A441",
            fillColor: pinType === "ngo" ? "#2F4B3A" : "#D9A441",
            fillOpacity: 0.12,
            weight: 1.5,
          });
          circle.addTo(map);
          circleRef.current = circle;
        } else {
          circleRef.current.setLatLng(coord);
          circleRef.current.setRadius(radiusMeters);
        }
      } else if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    },
    [pinType, readOnly, radiusMeters, onChange]
  );

  const handleMapReady = (map: LeafletType.Map, L: typeof LeafletType) => {
    mapRef.current = map;
    LRef.current = L;

    updateMarkerAndCircle(safeLat, safeLng);

    if (!readOnly) {
      map.on("click", (e: LeafletType.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        const roundedLat = Number(clickLat.toFixed(6));
        const roundedLng = Number(clickLng.toFixed(6));
        updateMarkerAndCircle(roundedLat, roundedLng);
        if (onChange) {
          onChange({ lat: roundedLat, lng: roundedLng });
        }
      });
    }
  };

  useEffect(() => {
    if (mapRef.current && LRef.current) {
      updateMarkerAndCircle(safeLat, safeLng);
      mapRef.current.panTo([safeLat, safeLng]);
    }
  }, [safeLat, safeLng, updateMarkerAndCircle]);

  // Mapbox Geocoding Address Search
  const handleSearchSubmit = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    setIsSearching(true);
    try {
      if (mapboxToken) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery.trim()
        )}.json?access_token=${mapboxToken}&limit=5`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.features) {
            setSuggestions(data.features);
            setShowDropdown(true);
          }
        }
      } else {
        // Fallback: OpenStreetMap Nominatim free geocoding
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=5`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: GeocodeSuggestion[] = data.map((item: any) => ({
              id: String(item.place_id),
              place_name: item.display_name,
              center: [parseFloat(item.lon), parseFloat(item.lat)],
            }));
            setSuggestions(mapped);
            setShowDropdown(true);
          }
        }
      }
    } catch (err) {
      console.warn("Geocoding search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (item: GeocodeSuggestion) => {
    const [lng, lat] = item.center;
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));

    if (mapRef.current) {
      mapRef.current.setView([roundedLat, roundedLng], 15);
      updateMarkerAndCircle(roundedLat, roundedLng);
      if (onChange) {
        onChange({ lat: roundedLat, lng: roundedLng });
      }
    }
    setSearchQuery(item.place_name);
    setShowDropdown(false);
  };

  return (
    <div className="relative border border-line rounded-[6px] overflow-hidden flex flex-col">
      {/* Mapbox Powered Address Search Bar (if not read-only) */}
      {!readOnly && (
        <div className="relative z-[500] bg-[#FAF6EE] border-b border-line p-2">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value) setShowDropdown(false);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit(e);
                  }
                }}
                placeholder="Search address, landmark, locality to position pin..."
                className="w-full bg-white border border-line rounded-[4px] px-3 py-1.5 text-xs text-ink placeholder:text-ink-soft/70 focus:outline-none focus:ring-1 focus:ring-saffron"
              />
              {isSearching && (
                <span className="absolute right-2.5 top-2 text-[10px] font-mono-numeral text-ink-soft animate-pulse">
                  Searching...
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleSearchSubmit()}
              disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-1.5 bg-saffron text-white rounded-[4px] text-xs font-semibold hover:bg-saffron/90 disabled:opacity-50 cursor-pointer"
            >
              Locate
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-2 right-2 mt-1 bg-white border border-line rounded-[4px] shadow-lg max-h-48 overflow-y-auto divide-y divide-line/60 z-[600]">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-[#FAF6EE] flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-2">{item.place_name}</span>
                  <span className="text-[10px] font-mono-numeral text-ink-soft group-hover:text-saffron shrink-0">
                    Fly to ↗
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative w-full">
        <LeafletMapBase
          center={[safeLat, safeLng]}
          zoom={13}
          theme={theme}
          className={className}
          onMapReady={handleMapReady}
        />

        {/* Helper coordinate badge */}
        <div className="absolute top-2 left-2 z-[400] bg-ledger-paper/95 backdrop-blur-sm border border-line px-2.5 py-1 rounded-[4px] text-[11px] font-mono-numeral text-ink-soft shadow-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-saffron" />
          <span>{readOnly ? "Verified Coordinates Pin" : label}</span>
          <span className="text-ink font-semibold">
            ({safeLat.toFixed(4)}, {safeLng.toFixed(4)})
          </span>
        </div>
      </div>
    </div>
  );
}
