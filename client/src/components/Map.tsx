/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
    __manusGoogleMapsLoadPromise?: Promise<void>;
    __manusGoogleMapsReady?: () => void;
    __manusGoogleMapsWasReady?: boolean;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;
const MAP_SCRIPT_ID = "manus-google-maps-api";

function waitForGoogleMaps(timeoutMs = 20_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const poll = () => {
      if (window.google?.maps) {
        resolve();
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("Google Maps API timed out"));
        return;
      }
      window.setTimeout(poll, 30);
    };
    poll();
  });
}

function waitForContainer(container: HTMLDivElement, timeoutMs = 2_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const poll = () => {
      if (container.isConnected && container.clientWidth > 0 && container.clientHeight > 0) {
        resolve();
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("Map container did not become visible"));
        return;
      }
      window.requestAnimationFrame(poll);
    };
    poll();
  });
}

function loadMapScript(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (window.__manusGoogleMapsLoadPromise) return window.__manusGoogleMapsLoadPromise;

  const bootstrapUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&loading=async&callback=__manusGoogleMapsReady&libraries=marker,places,geocoding,geometry`;
  window.__manusGoogleMapsLoadPromise = (async () => {
    // The proxy authorizes requests by browser Origin. A cross-origin <script src>
    // omits that header, while a CORS fetch supplies it and the proxy returns the
    // official Google bootstrap JavaScript with an allow-origin response.
    const response = await fetch(bootstrapUrl);
    if (!response.ok) throw new Error(`Failed to fetch Google Maps bootstrap (${response.status})`);

    const existingScript = document.getElementById(MAP_SCRIPT_ID);
    existingScript?.remove();
    const bootstrapScript = document.createElement("script");
    bootstrapScript.id = MAP_SCRIPT_ID;
    bootstrapScript.textContent = await response.text();
    document.head.appendChild(bootstrapScript);
    await waitForGoogleMaps();
  })().catch((error) => {
    console.warn("[MapView] Google Maps bootstrap request failed; it will be retried.");
    window.__manusGoogleMapsLoadPromise = undefined;
    document.getElementById(MAP_SCRIPT_ID)?.remove();
    throw error;
  });

  return window.__manusGoogleMapsLoadPromise;
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const automaticRetries = useRef(0);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [retryVersion, setRetryVersion] = useState(0);

  const init = usePersistFn(async () => {
    const container = mapContainer.current;
    if (!container) return;
    if (map.current) {
      setLoadState("ready");
      return;
    }
    setLoadState("loading");
    await Promise.all([loadMapScript(), waitForContainer(container)]);
    if (map.current || !window.google?.maps || !mapContainer.current) return;
    map.current = new window.google.maps.Map(mapContainer.current, {
      zoom: initialZoom,
      center: initialCenter,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: true,
      mapId: "DEMO_MAP_ID",
    });
    if (onMapReady) {
      onMapReady(map.current);
    }
    automaticRetries.current = 0;
    setLoadState("ready");
  });

  useEffect(() => {
    let retryTimer: number | undefined;
    void init().catch(() => {
      console.warn("[MapView] Initial map load did not complete; scheduling retry.");
      if (automaticRetries.current < 4) {
        automaticRetries.current += 1;
        setLoadState("loading");
        const retryDelay = automaticRetries.current * 1_000;
        retryTimer = window.setTimeout(() => {
          const staleScript = document.getElementById(MAP_SCRIPT_ID);
          if (!window.google?.maps) staleScript?.remove();
          window.__manusGoogleMapsLoadPromise = undefined;
          map.current = null;
          setRetryVersion((version) => version + 1);
        }, retryDelay);
      } else {
        setLoadState("error");
      }
    });
    return () => {
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [init, retryVersion]);

  const retry = useCallback(() => {
    const staleScript = document.getElementById(MAP_SCRIPT_ID);
    if (!window.google?.maps) staleScript?.remove();
    window.__manusGoogleMapsLoadPromise = undefined;
    map.current = null;
    setRetryVersion((version) => version + 1);
  }, []);

  return (
    <div className={cn("relative w-full h-[500px] overflow-hidden bg-[#f3f0ea]", className)}>
      <div ref={mapContainer} className="absolute inset-0" />
      {loadState !== "ready" && <div className="absolute inset-0 z-10 grid place-items-center bg-[#f6f4ef]/95 text-center"><div className="px-5"><div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-[#d8d0fa] border-t-[#6955b3]" />{loadState === "loading" ? <p className="mt-3 text-xs font-semibold text-[#737b8c]">正在加载地图…</p> : <><p className="mt-3 text-xs font-semibold text-[#737b8c]">地图暂时没有加载成功</p><button onClick={retry} className="mt-3 rounded-full bg-[#6955b3] px-4 py-2 text-xs font-bold text-white transition active:scale-95">重新加载地图</button></>}</div></div>}
    </div>
  );
}
