"use client";

import * as maplibregl from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource, LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { MapPoint } from "@/lib/data/places";
import type { Bbox } from "@/lib/domain/explore-params";
import { logger } from "@/lib/logger";
import {
  categoryColorExpression,
  DEFAULT_BOUNDS,
  MAP_FONT,
  MAP_STYLES,
  roundBbox,
} from "@/lib/map/config";

type ExplorerMapProps = {
  points: MapPoint[];
  selectedId: string | null;
  initialBbox: Bbox | null;
  onSelect: (id: string | null) => void;
  onBoundsChange: (bbox: Bbox) => void;
};

function toGeoJson(points: MapPoint[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      id: p.id,
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, category: p.category, free: p.costBand === "free" },
    })),
  };
}

function boundsOf(points: MapPoint[]): LngLatBoundsLike {
  if (points.length === 0) return DEFAULT_BOUNDS;
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

// The worker is copied into public/ by scripts/copy-map-worker.mjs, since the
// bundler cannot follow MapLibre's own import.meta.url lookup.
maplibregl.setWorkerUrl(`/maplibre/maplibre-gl-worker-${maplibregl.getVersion()}.mjs`);

/** On small screens the results sheet covers the lower half; keep pins above it. */
function fitPadding() {
  if (window.matchMedia("(min-width: 1024px)").matches) return 48;
  return { top: 64, right: 32, left: 32, bottom: Math.round(window.innerHeight * 0.55) };
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Clustered MapLibre map. Loaded only on the explorer's map view.
 * Pins are drawn as map layers; the results list next to the map is the
 * keyboard and screen reader path to the same places (see DECISIONS.md).
 */
export default function ExplorerMap({
  points,
  selectedId,
  initialBbox,
  onSelect,
  onBoundsChange,
}: ExplorerMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const callbacks = useRef({ onSelect, onBoundsChange });
  const latestPoints = useRef(points);
  useEffect(() => {
    callbacks.current = { onSelect, onBoundsChange };
    latestPoints.current = points;
  });

  useEffect(() => {
    if (!container.current) return;
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const map = new maplibregl.Map({
      container: container.current,
      style: dark ? MAP_STYLES.dark : MAP_STYLES.light,
      bounds: initialBbox
        ? [
            [initialBbox[0], initialBbox[1]],
            [initialBbox[2], initialBbox[3]],
          ]
        : boundsOf(points),
      fitBoundsOptions: { padding: fitPadding(), maxZoom: 14 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", (e) => logger.warn("Map error", { message: e.error?.message }));

    map.on("load", () => {
      map.addSource("places", {
        type: "geojson",
        data: toGeoJson(latestPoints.current),
        cluster: true,
        clusterRadius: 44,
        clusterMaxZoom: 13,
      });
      const ink = dark ? "#E9EDF2" : "#12161c";
      const onInk = dark ? "#0E1319" : "#FFFFFF";
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ink,
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 40, 26],
          "circle-stroke-width": 3,
          "circle-stroke-color": dark ? "rgba(12,18,14,0.6)" : "rgba(255,255,255,0.7)",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": MAP_FONT,
          "text-size": 13,
        },
        paint: { "text-color": onInk },
      });
      map.addLayer({
        id: "points",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": categoryColorExpression() as maplibregl.ExpressionSpecification,
          "circle-radius": 7,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#FFFFFF",
        },
      });
      map.addLayer({
        id: "selected",
        type: "circle",
        source: "places",
        filter: ["==", ["get", "id"], ""],
        paint: {
          "circle-color": "rgba(0,0,0,0)",
          "circle-radius": 13,
          "circle-stroke-width": 3,
          "circle-stroke-color": ink,
        },
      });

      map.on("click", "points", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === "string") callbacks.current.onSelect(id);
      });
      map.on("click", "clusters", async (e) => {
        const feature = e.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        if (!feature || typeof clusterId !== "number" || feature.geometry.type !== "Point") return;
        const source = map.getSource("places") as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom,
          duration: reducedMotion() ? 0 : 400,
        });
      });
      map.on("click", (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ["points", "clusters"] });
        if (hits.length === 0) callbacks.current.onSelect(null);
      });
      for (const layer of ["points", "clusters"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }
    });

    map.on("moveend", (e) => {
      // Only movement the person made updates the URL, not programmatic fits.
      if (!("originalEvent" in e) || !e.originalEvent) return;
      const b = map.getBounds();
      callbacks.current.onBoundsChange(
        roundBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]),
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New results: update pins without recreating the map.
  useEffect(() => {
    const source = mapRef.current?.getSource("places") as GeoJSONSource | undefined;
    source?.setData(toGeoJson(points));
  }, [points]);

  // Selection ring, and keep the selected pin in view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("selected")) return;
    map.setFilter("selected", ["==", ["get", "id"], selectedId ?? ""]);
    const p = points.find((x) => x.id === selectedId);
    if (p && !map.getBounds().contains([p.lng, p.lat])) {
      map.easeTo({ center: [p.lng, p.lat], duration: reducedMotion() ? 0 : 400 });
    }
  }, [selectedId, points]);

  return (
    <div
      ref={container}
      role="region"
      aria-label="Map of results. Use the results list for keyboard access to each place."
      className="h-full w-full"
    />
  );
}
