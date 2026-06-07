"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import { Place } from "@/lib/types";
import { CATEGORY_COLORS } from "@/data/categories";
import { PlaceCard } from "@/components/PlaceCard";

interface MapViewProps {
  places: Place[];
  center: [number, number];
  zoom?: number;
}

function BoundsFitter({ places }: { places: Place[] }) {
  const map = useMap();
  const prevPlacesRef = useRef<string>("");

  useEffect(() => {
    const key = places.map((p) => p.id).join(",");
    if (key === prevPlacesRef.current) return;
    prevPlacesRef.current = key;

    const withCoords = places.filter((p) => p.lat && p.lng);
    if (withCoords.length === 0) return;

    const bounds = withCoords.map((p) => [p.lat!, p.lng!] as [number, number]);
    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [places, map]);

  return null;
}

export function MapView({ places, center, zoom = 13 }: MapViewProps) {
  const withCoords = places.filter((p) => p.lat && p.lng);

  if (withCoords.length === 0) {
    return (
      <div className="w-full h-[360px] sm:h-[500px] rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <p className="text-sm font-medium text-zinc-500">No mapped places</p>
        <p className="text-xs text-zinc-400">Try adjusting your filters to see locations on the map.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[360px] sm:h-[500px] rounded-xl overflow-hidden border border-zinc-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <BoundsFitter places={withCoords} />

        <MarkerClusterGroup chunkedLoading>
          {withCoords.map((place) => (
            <CircleMarker
              key={place.id}
              center={[place.lat!, place.lng!]}
              radius={9}
              pathOptions={{
                fillColor: CATEGORY_COLORS[place.category],
                fillOpacity: 0.9,
                color: "#fff",
                weight: 2,
              }}
            >
              <Popup minWidth={220} maxWidth={260}>
                <PlaceCard place={place} variant="map-popup" />
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
