"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import type * as LeafletType from "leaflet";
import LeafletMapBase, { createCustomMarkerIcon } from "@/components/maps/leaflet-map-base";
import type { PublicNetworkNode, PublicNetworkRoute } from "@/lib/platform-stats";
import Link from "next/link";
import { RouteIcon, ShieldCheckIcon, CrateIcon, TicketIcon, ChevronRightIcon } from "@/components/icons/ledger-icons";

interface PublicNetworkMapProps {
  nodes: PublicNetworkNode[];
  routes: PublicNetworkRoute[];
}

export function PublicNetworkMap({ nodes, routes }: PublicNetworkMapProps) {
  const mapRef = useRef<LeafletType.Map | null>(null);
  const LRef = useRef<typeof LeafletType | null>(null);
  const layerGroupRef = useRef<LeafletType.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<"all" | "kitchens" | "ngos" | "routes">("all");
  const [selectedEntity, setSelectedEntity] = useState<{
    title: string;
    type: "kitchen" | "ngo" | "route";
    subtitle?: string;
    details?: string;
    stat?: string;
  } | null>(null);

  const renderMapElements = useCallback(() => {
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

    // 1. Render Facility Nodes (Kitchens & NGOs)
    if (activeFilter === "all" || activeFilter === "kitchens" || activeFilter === "ngos") {
      nodes.forEach((node) => {
        if (activeFilter === "kitchens" && node.type !== "kitchen") return;
        if (activeFilter === "ngos" && node.type !== "ngo") return;

        const coord: [number, number] = [node.location.lat, node.location.lng];
        bounds.extend(coord);

        const isKitchen = node.type === "kitchen";
        const icon = createCustomMarkerIcon(L, {
          type: isKitchen ? "kitchen" : "ngo",
          label: node.name.slice(0, 14),
          color: isKitchen ? "#D9A441" : "#2F4B3A",
        });

        const popupContent = `
          <div class="p-3 text-left space-y-1.5" style="min-width: 220px;">
            <div class="flex items-center justify-between">
              <span class="text-[9px] uppercase font-mono-numeral px-2 py-0.5 rounded font-bold text-white" style="background-color: ${
                isKitchen ? "#D9A441" : "#2F4B3A"
              };">
                ${isKitchen ? "Verified Commercial Kitchen" : "FSSAI-Vetted NGO Recipient"}
              </span>
            </div>
            <div class="font-display text-sm font-bold text-[#24211C] leading-snug">${node.name}</div>
            ${node.address ? `<div class="text-[11px] text-[#5A5548] leading-tight">📍 ${node.address}</div>` : ""}
            <div class="pt-1 text-[10px] text-[#2F4B3A] font-mono-numeral font-medium flex items-center gap-1">
              ✓ Active ZeroPlate Circular Network Participant
            </div>
          </div>
        `;

        const marker = L.marker(coord, { icon }).bindPopup(popupContent);

        marker.on("click", () => {
          setSelectedEntity({
            title: node.name,
            type: node.type,
            subtitle: node.address || "Metropolitan Circular Network Hub",
            details: isKitchen
              ? "Predicts meal yields and safely lists verified surplus batches."
              : "Receives certified food surplus for community nourishment.",
            stat: isKitchen ? "Verified Donor Node" : "Verified Recipient Node",
          });
        });

        group.addLayer(marker);
      });
    }

    // 2. Render Live Redistribution Routes
    if (activeFilter === "all" || activeFilter === "routes") {
      routes.forEach((route) => {
        const oCoord: [number, number] = [route.origin.lat, route.origin.lng];
        const dCoord: [number, number] = [route.destination.lat, route.destination.lng];
        bounds.extend(oCoord);
        bounds.extend(dCoord);

        // Midpoint curve
        const midLat = (route.origin.lat + route.destination.lat) / 2 + 0.005;
        const midLng = (route.origin.lng + route.destination.lng) / 2 - 0.006;
        const curvePoints: [number, number][] = [oCoord, [midLat, midLng], dCoord];

        const isDelivered = route.status === "delivered" || route.status === "confirmed";

        const line = L.polyline(curvePoints, {
          color: isDelivered ? "#2F4B3A" : "#D9A441",
          weight: 3.5,
          dashArray: isDelivered ? undefined : "6, 6",
          opacity: 0.85,
        });

        line.bindPopup(`
          <div class="p-3 text-left space-y-1.5" style="min-width: 220px;">
            <div class="flex items-center justify-between border-b border-[#DCD3BE] pb-1">
              <span class="text-[10px] uppercase font-mono-numeral font-bold text-[#D9A441]">Live Dispatch Line</span>
              <span class="text-xs font-mono-numeral font-bold text-[#2F4B3A]">${route.quantity} ${route.unit}</span>
            </div>
            <div class="font-display text-xs font-bold text-[#24211C]">${route.itemName}</div>
            <div class="text-[11px] text-[#5A5548]">From: <strong>${route.origin.name}</strong></div>
            <div class="text-[11px] text-[#2F4B3A]">To: <strong>${route.destination.name}</strong></div>
          </div>
        `);

        line.on("click", () => {
          setSelectedEntity({
            title: `${route.quantity} ${route.unit} of ${route.itemName}`,
            type: "route",
            subtitle: `${route.origin.name} → ${route.destination.name}`,
            details: isDelivered
              ? "Verified recipient confirmation recorded in permanent impact ledger."
              : "Courier moving along optimized logistics corridor.",
            stat: isDelivered ? "✓ Delivery Verified" : "🚚 In Transit",
          });
        });

        group.addLayer(line);

        // Courier Icon if in transit
        if (!isDelivered) {
          const courierIcon = createCustomMarkerIcon(L, {
            type: "courier",
            label: "COURIER",
            pulsing: true,
            color: "#D9A441",
          });
          const cMarker = L.marker([midLat, midLng], { icon: courierIcon });
          group.addLayer(cMarker);
        }
      });
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [nodes, routes, activeFilter]);

  const handleMapReady = (map: LeafletType.Map, L: typeof LeafletType) => {
    mapRef.current = map;
    LRef.current = L;
    renderMapElements();
  };

  useEffect(() => {
    if (mapRef.current && LRef.current) {
      renderMapElements();
    }
  }, [renderMapElements]);

  return (
    <div className="space-y-4">
      {/* Control Bar: Filters & Live Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF6EE] p-3 rounded-[6px] border border-line">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase font-mono-numeral text-ink-soft font-semibold mr-1">
            Filter View:
          </span>
          {[
            { id: "all", label: "Full Network" },
            { id: "kitchens", label: `Kitchens (${nodes.filter((n) => n.type === "kitchen").length})` },
            { id: "ngos", label: `Recipient NGOs (${nodes.filter((n) => n.type === "ngo").length})` },
            { id: "routes", label: `Active Dispatches (${routes.length})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3 py-1 text-xs rounded-[4px] font-medium transition-colors cursor-pointer ${
                activeFilter === f.id
                  ? "bg-basil text-ledger-paper font-semibold"
                  : "bg-ledger-paper text-ink-soft border border-line hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-numeral text-ink-soft self-end sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-basil animate-pulse" />
          <span>Interactive Leaflet Map • NCR Circulation</span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative border border-line rounded-[6px] overflow-hidden shadow-sm">
        <LeafletMapBase
          center={[28.6139, 77.209]}
          zoom={12}
          theme="light"
          className="w-full h-[450px] sm:h-[520px]"
          onMapReady={handleMapReady}
        />

        {/* Floating Legend Overlay */}
        <div className="absolute top-3 left-3 z-[400] bg-ledger-paper/95 backdrop-blur-sm border border-line p-3 rounded-[6px] shadow-sm max-w-xs text-xs space-y-2 hidden sm:block">
          <div className="font-mono-numeral text-[10px] uppercase tracking-wider text-ink-soft font-semibold flex items-center justify-between">
            <span>Network Key</span>
            <span className="text-basil font-bold">Live Nodes</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-ink">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D9A441] border border-white shrink-0" />
              <span>Commercial Kitchens & Caterers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2F4B3A] border border-white shrink-0" />
              <span>Verified Recipient NGOs & Food Banks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-0.5 bg-[#D9A441] border-t border-dashed border-[#D9A441] shrink-0" />
              <span>Dedicated Logistics Redistribution Corridor</span>
            </div>
          </div>
        </div>

        {/* Selected Entity Card Overlay */}
        {selectedEntity && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:max-w-sm z-[400] bg-ledger-paper border border-line p-4 rounded-[6px] shadow-md space-y-2 text-left animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="text-[9px] uppercase font-mono-numeral font-bold px-1.5 py-0.5 rounded text-white"
                  style={{
                    backgroundColor:
                      selectedEntity.type === "kitchen"
                        ? "#D9A441"
                        : selectedEntity.type === "ngo"
                        ? "#2F4B3A"
                        : "#8A4331",
                  }}
                >
                  {selectedEntity.stat}
                </span>
                <h4 className="font-display text-sm font-bold text-ink mt-1">
                  {selectedEntity.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntity(null)}
                className="text-xs text-ink-soft hover:text-ink px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
            {selectedEntity.subtitle && (
              <p className="text-[11px] text-ink-soft font-medium">{selectedEntity.subtitle}</p>
            )}
            {selectedEntity.details && (
              <p className="text-xs text-ink-soft leading-relaxed">{selectedEntity.details}</p>
            )}
          </div>
        )}
      </div>

      {/* Network Exploration Action Banner */}
      <div className="p-4 rounded-[6px] border border-line bg-[#FAF6EE] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h4 className="font-display text-base font-medium text-ink">
            Plug your commercial dining or non-profit facility into this active network
          </h4>
          <p className="text-xs text-ink-soft mt-0.5">
            Real-time proximity routing guarantees surplus is transferred within safe thermal windows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/register?role=institution_admin"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[4px] text-xs font-semibold bg-basil text-ledger-paper hover:bg-basil/90 transition-colors"
          >
            <span>Kitchen Facility</span>
            <ChevronRightIcon size={14} />
          </Link>
          <Link
            href="/register?role=ngo"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[4px] text-xs font-semibold bg-ledger-paper border border-line text-ink hover:text-basil transition-colors"
          >
            <span>Recipient NGO</span>
            <ChevronRightIcon size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
