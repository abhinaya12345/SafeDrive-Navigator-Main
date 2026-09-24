import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import L from "leaflet";
import { useLocation } from "@/contexts/LocationContext";
import { RiskToggle } from "@/components/RiskToggle";
import { getRiskColor, getRiskOpacity } from "@/data/riskZones";
import { useVoiceAlert } from "@/hooks/useVoiceAlert";
import { ArrowLeft, Volume2, VolumeX, Eye, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

type LatLngTuple = [number, number];
type RiskLevel = "high" | "medium" | "safe";

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Densify route so sampling is stable
function densifyRoute(points: LatLngTuple[], stepMeters = 120): LatLngTuple[] {
  if (points.length < 2) return points;

  const out: LatLngTuple[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    out.push(a);

    const distM = getDistanceInKm(a[0], a[1], b[0], b[1]) * 1000;
    const steps = Math.max(1, Math.floor(distM / stepMeters));

    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

// Sample route every N meters, but keep the original index inside dense route
function sampleRouteEveryWithIndex(points: LatLngTuple[], everyMeters = 600) {
  if (points.length < 2) return [{ pt: points[0], idx: 0 }];

  const out: { pt: LatLngTuple; idx: number }[] = [{ pt: points[0], idx: 0 }];
  let acc = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    acc += getDistanceInKm(prev[0], prev[1], cur[0], cur[1]) * 1000;

    if (acc >= everyMeters) {
      out.push({ pt: cur, idx: i });
      acc = 0;
    }
  }

  const last = points[points.length - 1];
  const lastOut = out[out.length - 1].pt;
  if (lastOut[0] !== last[0] || lastOut[1] !== last[1]) out.push({ pt: last, idx: points.length - 1 });

  return out;
}

// Simple risk labeling pattern (replace with real scoring later)
function buildRouteDots(sampled: { pt: LatLngTuple; idx: number }[]) {
  const levels: RiskLevel[] = ["safe", "medium", "high", "safe", "medium"];
  return sampled.map((item, k) => ({
    lat: item.pt[0],
    lng: item.pt[1],
    level: levels[k % levels.length],
    routeIdx: item.idx, // important for detours
  }));
}

// --- Detour helpers ---

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

// Bearing from A to B (degrees)
function bearingDeg(a: LatLngTuple, b: LatLngTuple) {
  const lat1 = toRad(a[0]);
  const lon1 = toRad(a[1]);
  const lat2 = toRad(b[0]);
  const lon2 = toRad(b[1]);

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Offset a point by meters at given bearing
function offsetPointMeters(p: LatLngTuple, bearing: number, meters: number): LatLngTuple {
  const R = 6371000; // meters
  const brng = toRad(bearing);
  const lat1 = toRad(p[0]);
  const lon1 = toRad(p[1]);

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(meters / R) + Math.cos(lat1) * Math.sin(meters / R) * Math.cos(brng));
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(meters / R) * Math.cos(lat1),
      Math.cos(meters / R) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [toDeg(lat2), toDeg(lon2)];
}

// Fetch OSRM route for points: [lat,lng]
async function fetchOSRMRoute(waypoints: LatLngTuple[], signal?: AbortSignal): Promise<LatLngTuple[] | null> {
  if (waypoints.length < 2) return null;

  // OSRM expects lon,lat
  const path = waypoints.map((p) => `${p[1]},${p[0]}`).join(";");

  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&steps=false`;

  const res = await fetch(url, { signal });
  if (!res.ok) return null;

  const data = await res.json();
  const coords: [number, number][] | undefined = data?.routes?.[0]?.geometry?.coordinates; // [lon,lat]
  if (!coords || coords.length < 2) return null;

  return coords.map(([lon, lat]) => [lat, lon]);
}

const RoutePage: React.FC = () => {
  const { currentLocation, destination, destinationName } = useLocation();
  const navigate = useNavigate();
  const { alertRiskLevel, customAlert } = useVoiceAlert();

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const routeLineRef = useRef<L.Polyline | null>(null);
  const dotsRef = useRef<L.Circle[]>([]);
  const altRoutesRef = useRef<L.Polyline[]>([]);

  const [activeFilters, setActiveFilters] = useState({
    high: true,
    medium: true,
    safe: true,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const [denseRoute, setDenseRoute] = useState<LatLngTuple[]>([]);
  const [routeDots, setRouteDots] = useState<{ lat: number; lng: number; level: RiskLevel; routeIdx: number }[]>([]);
  const [routeMeta, setRouteMeta] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  // 1) Init map
  useEffect(() => {
    if (!currentLocation || !destination || !mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLocation.lat, currentLocation.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    const currentLocationIcon = L.divIcon({
      className: "current-location-marker",
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; inset: 0; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);"></div>
          <div style="position: absolute; inset: 2px; background: rgba(255,255,255,0.3); border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const destinationIcon = L.divIcon({
      className: "destination-marker",
      html: `
        <div style="position: relative; width: 32px; height: 40px;">
          <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
            <path fill="#ef4444" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
    });

    L.marker([currentLocation.lat, currentLocation.lng], { icon: currentLocationIcon }).addTo(map);
    L.marker([destination.lat, destination.lng], { icon: destinationIcon }).addTo(map);

    mapRef.current = map;
    setIsMapReady(true);

    if (!isMuted) customAlert(`Navigation started. Heading to ${destinationName}.`);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, destination]);

  // 2) Fetch OSRM route + draw main route + build dots
  useEffect(() => {
    if (!currentLocation || !destination || !mapRef.current || !isMapReady) return;

    const controller = new AbortController();

    async function loadMainRoute() {
      try {
        const start = `${currentLocation.lng},${currentLocation.lat}`;
        const end = `${destination.lng},${destination.lat}`;
        const url =
          `https://router.project-osrm.org/route/v1/driving/${start};${end}` +
          `?overview=full&geometries=geojson&steps=false`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`OSRM failed: ${res.status}`);

        const data = await res.json();
        const route = data?.routes?.[0];
        const coords: [number, number][] | undefined = route?.geometry?.coordinates; // [lon,lat]
        if (!coords || coords.length < 2) throw new Error("No route geometry");

        const pts: LatLngTuple[] = coords.map(([lon, lat]) => [lat, lon]);
        const densePts = densifyRoute(pts, 120);
        setDenseRoute(densePts);

        // Clean dots (not congested)
        const sampled = sampleRouteEveryWithIndex(densePts, 650);
        setRouteDots(buildRouteDots(sampled));

        setRouteMeta({
          distanceKm: (route.distance ?? 0) / 1000,
          durationMin: (route.duration ?? 0) / 60,
        });

        if (routeLineRef.current) routeLineRef.current.remove();

        const line = L.polyline(densePts, {
          color: "#3b82f6",
          weight: 4,
          opacity: 0.95,
        }).addTo(mapRef.current!);

        routeLineRef.current = line;
        mapRef.current!.fitBounds(line.getBounds(), { padding: [50, 50] });
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
        console.error(e);
        setDenseRoute([]);
        setRouteDots([]);
        setRouteMeta(null);
        if (!isMuted) customAlert("Unable to fetch route.");
      }
    }

    loadMainRoute();
    return () => controller.abort();
  }, [currentLocation, destination, isMapReady, isMuted, customAlert]);

  // 3) Draw dots (green/yellow/red) ON main route
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    dotsRef.current.forEach((c) => c.remove());
    dotsRef.current = [];

    if (!routeDots.length) return;

    const visibleDots = routeDots.filter((d) => activeFilters[d.level]);

    visibleDots.forEach((d) => {
      const circle = L.circle([d.lat, d.lng], {
        radius: 45,
        color: getRiskColor(d.level),
        fillColor: getRiskColor(d.level),
        fillOpacity: 0.45,
        weight: 2,
      });

      circle.on("click", () => {
        if (!isMuted) alertRiskLevel(d.level);
      });

      circle.addTo(mapRef.current!);
      dotsRef.current.push(circle);
    });
  }, [activeFilters, isMapReady, isMuted, alertRiskLevel, routeDots]);

  // 4) ✅ Alternative routes ONLY for RED dots
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // remove old alternative polylines
    altRoutesRef.current.forEach((l) => l.remove());
    altRoutesRef.current = [];

    if (!denseRoute.length || !routeDots.length) return;

    // ✅ only for RED / high dots (and only if high filter is ON)
    if (!activeFilters.high) return;

    // Take max 2 red points to avoid clutter
    const redDots = routeDots.filter((d) => d.level === "high").slice(0, 2);
    if (!redDots.length) return;

    const controller = new AbortController();

    async function buildAlternatives() {
      for (const rd of redDots) {
        const idx = rd.routeIdx;

        // take a small segment around the red dot
        const before = Math.max(0, idx - 25);
        const after = Math.min(denseRoute.length - 1, idx + 25);

        const startPt = denseRoute[before];
        const hazardPt = denseRoute[idx];
        const endPt = denseRoute[after];

        // direction along route
        const dir = bearingDeg(startPt, endPt);

        // perpendicular bearings (left/right)
        const leftBrng = (dir + 270) % 360;
        const rightBrng = (dir + 90) % 360;

        // how far the detour goes away from hazard
        const detourMeters = 650; // change 400–900 if needed

        const leftDetour = offsetPointMeters(hazardPt, leftBrng, detourMeters);
        const rightDetour = offsetPointMeters(hazardPt, rightBrng, detourMeters);

        // fetch both alternative segments
        const [leftRoute, rightRoute] = await Promise.all([
          fetchOSRMRoute([startPt, leftDetour, endPt], controller.signal),
          fetchOSRMRoute([startPt, rightDetour, endPt], controller.signal),
        ]);

        // draw if available
        const alts: (LatLngTuple[] | null)[] = [leftRoute, rightRoute];

        for (const alt of alts) {
          if (!alt || alt.length < 2) continue;

          const poly = L.polyline(alt, {
            color: "#22f7ff", // amber/orange alternate path
            weight: 4,
            opacity: 0.9,
            dashArray: "10, 10",
          }).addTo(mapRef.current!);

          altRoutesRef.current.push(poly);
        }
      }
    }

    buildAlternatives().catch((e) => {
      if ((e as any)?.name === "AbortError") return;
      console.error(e);
    });

    return () => controller.abort();
  }, [activeFilters.high, denseRoute, isMapReady, routeDots]);

  const handleToggle = useCallback(
    (level: "high" | "medium" | "safe") => {
      setActiveFilters((prev) => ({ ...prev, [level]: !prev[level] }));

      if (!isMuted) {
        const newState = !activeFilters[level];
        const levelName = level === "high" ? "high risk" : level === "medium" ? "medium risk" : "safe";
        customAlert(`${levelName} zones ${newState ? "enabled" : "disabled"}`);
      }
    },
    [activeFilters, isMuted, customAlert]
  );

  const goToStreetView = () => navigate("/street-view");

  if (!currentLocation || !destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No destination selected</p>
          <Button onClick={() => navigate("/map")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <header className="absolute top-0 left-0 right-0 z-[1000] p-4">
        <div className="glass-panel p-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/map")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>

            <div>
              <p className="text-sm font-medium text-foreground">Navigating to</p>
              <p className="text-xs text-muted-foreground">{destinationName}</p>
              {routeMeta && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {routeMeta.distanceKm.toFixed(1)} km • {Math.round(routeMeta.durationMin)} min
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                Yellow/Green: main route • Red: alternatives shown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition-colors ${isMuted ? "bg-destructive/20" : "bg-secondary"}`}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-destructive" />
              ) : (
                <Volume2 className="w-5 h-5 text-primary" />
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <div className="absolute top-24 right-4 z-[1000] w-44">
        <RiskToggle activeFilters={activeFilters} onToggle={handleToggle} />
      </div>

      <div ref={mapContainerRef} className="absolute inset-0" style={{ background: "hsl(222 47% 6%)" }} />

      <div className="absolute bottom-8 left-4 right-4 z-[1000]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{destinationName}</p>
                <p className="text-xs text-muted-foreground">Tap to explore in 360° view</p>
              </div>
            </div>
          </div>

          <Button variant="glow" size="lg" className="w-full" onClick={goToStreetView}>
            <Eye className="w-5 h-5" />
            Open 360° Street View
          </Button>
        </motion.div>
      </div>

      <style>{`
        .current-location-marker, .destination-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          background: hsl(222 47% 6%);
        }
      `}</style>
    </div>
  );
};

export default RoutePage;
