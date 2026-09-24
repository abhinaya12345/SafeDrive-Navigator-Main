import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Compass,
  Share2,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "@/contexts/LocationContext";
import { riskZones, coimbatoreBounds } from "@/data/riskZones";
import { useVoiceAlert } from "@/hooks/useVoiceAlert";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

declare global {
  interface Window {
    google?: any;
  }
}

type RiskLevel = "high" | "medium" | "safe" | null;

const StreetViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { destinationName, destination, currentLocation } = useLocation();
  const { alertRiskLevel } = useVoiceAlert();

  // ✅ Use destination first, else current, else coimbatore center
  const initialViewLocation = destination || currentLocation || coimbatoreBounds.center;

  // UI states
  const [zoom, setZoom] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentRiskLevel, setCurrentRiskLevel] = useState<RiskLevel>(null);
  const [showStreetCoverage] = useState(true);

  // ✅ Real street view state (we can move it by clicking map)
  const [viewLocation, setViewLocation] = useState<{ lat: number; lng: number }>(initialViewLocation);
  const [heading, setHeading] = useState(0);
  const [panoError, setPanoError] = useState<string | null>(null);

  // Refs
  const panoramaDivRef = useRef<HTMLDivElement>(null);
  const panoInstanceRef = useRef<any>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // ---------------------------
  // ✅ Init Leaflet bottom map
  // ---------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [viewLocation.lat, viewLocation.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Simulated StreetView coverage (optional)
    if (showStreetCoverage) {
      const streets = [
        [[11.0168, 76.9558], [11.02, 76.96]],
        [[11.0168, 76.9558], [11.014, 76.952]],
        [[11.02, 76.96], [11.023, 76.965]],
        [[11.014, 76.952], [11.011, 76.948]],
        [[11.0168, 76.9558], [11.019, 76.952]],
        [[11.0168, 76.9558], [11.0145, 76.959]],
      ];

      streets.forEach((coords) => {
        L.polyline(coords as [number, number][], {
          color: "#00bcd4",
          weight: 3,
          opacity: 0.8,
        }).addTo(map);
      });
    }

    const viewMarkerIcon = L.divIcon({
      className: "street-view-marker",
      html: `
        <div style="position: relative; width: 40px; height: 40px; transform: translate(-50%, -50%);">
          <div style="
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: white;">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 60px;
            height: 60px;
            border: 2px solid #f97316;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.5;
          "></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([viewLocation.lat, viewLocation.lng], {
      icon: viewMarkerIcon,
      draggable: false,
    }).addTo(map);

    // ✅ click map → move Street View to clicked location
    map.on("click", (e: any) => {
      setViewLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      marker.setLatLng(e.latlng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep marker & map centered when viewLocation changes (from other sources)
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([viewLocation.lat, viewLocation.lng], mapRef.current.getZoom(), { animate: true });
    }
    if (markerRef.current) markerRef.current.setLatLng([viewLocation.lat, viewLocation.lng]);
  }, [viewLocation.lat, viewLocation.lng]);

  // ------------------------------------------
  // ✅ Real Google Street View initialization
  // ------------------------------------------
  useEffect(() => {
    if (!panoramaDivRef.current) return;

    // Check Google loaded
    if (!window.google?.maps) {
      setPanoError(
        "Google Maps API not loaded. Add the script in index.html and make sure API key + billing is enabled."
      );
      return;
    }

    const sv = new window.google.maps.StreetViewService();

    // Find nearest panorama near viewLocation
    sv.getPanorama(
      {
        location: { lat: viewLocation.lat, lng: viewLocation.lng },
        radius: 120,
      },
      (data: any, status: any) => {
        if (status !== "OK" || !data?.location?.latLng) {
          setPanoError("Street View not available for this location. Try clicking a nearby main road.");
          return;
        }

        setPanoError(null);

        // Create panorama once
        if (!panoInstanceRef.current) {
          panoInstanceRef.current = new window.google.maps.StreetViewPanorama(panoramaDivRef.current, {
            position: data.location.latLng,
            pov: { heading: heading, pitch: 0 },
            zoom: 1,
            addressControl: false,
            fullscreenControl: true,
            motionTracking: false,
            motionTrackingControl: false,
            linksControl: true,
            panControl: true,
            clickToGo: true,
            scrollwheel: true,
            showRoadLabels: true,
          });

          // ✅ update heading state when user rotates
          panoInstanceRef.current.addListener("pov_changed", () => {
            const pov = panoInstanceRef.current.getPov?.();
            if (pov?.heading !== undefined) setHeading(pov.heading);
          });
        } else {
          // Update position
          panoInstanceRef.current.setPosition(data.location.latLng);
        }

        // Apply zoom if user changed it
        panoInstanceRef.current.setZoom(Math.max(0, Math.min(2, zoom - 1)));
      }
    );
  }, [viewLocation.lat, viewLocation.lng]);

  // apply zoom changes to panorama
  useEffect(() => {
    if (!panoInstanceRef.current) return;
    // Google zoom is ~0-2, we map our 0.5-2.5 to 0-2
    const z = Math.max(0, Math.min(2, zoom - 1));
    panoInstanceRef.current.setZoom(z);
  }, [zoom]);

  // ---------------------------
  // ✅ Risk zone check
  // ---------------------------
  useEffect(() => {
    const nearbyZone = riskZones.find((zone) => {
      const distance =
        Math.sqrt(Math.pow(zone.lat - viewLocation.lat, 2) + Math.pow(zone.lng - viewLocation.lng, 2)) * 111000;
      return distance < zone.radius;
    });

    if (nearbyZone && nearbyZone.level !== currentRiskLevel && !isMuted) {
      setCurrentRiskLevel(nearbyZone.level);
      alertRiskLevel(nearbyZone.level);
    } else if (!nearbyZone) {
      setCurrentRiskLevel(null);
    }
  }, [viewLocation.lat, viewLocation.lng, isMuted]);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(2.5, prev + delta)));
  };

  const getRiskIndicator = () => {
    switch (currentRiskLevel) {
      case "high":
        return { color: "bg-risk-high", text: "HIGH RISK ZONE", borderColor: "#ef4444" };
      case "medium":
        return { color: "bg-risk-medium", text: "MEDIUM RISK ZONE", borderColor: "#eab308" };
      case "safe":
        return { color: "bg-risk-safe", text: "SAFE ZONE", borderColor: "#22c55e" };
      default:
        return null;
    }
  };

  const riskIndicator = getRiskIndicator();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Panorama Section */}
      <div className="relative flex-1 min-h-0" style={{ height: "55%" }}>
        {/* ✅ Real Google Street View container */}
        <div ref={panoramaDivRef} className="absolute inset-0 overflow-hidden" />

        {/* If Street View not available / API not loaded */}
        <AnimatePresence>
          {panoError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 z-40 flex items-center justify-center p-4"
            >
              <div className="glass-panel p-5 max-w-md text-center">
                <p className="text-foreground font-semibold mb-2">Street View not available</p>
                <p className="text-muted-foreground text-sm">{panoError}</p>
                <p className="text-muted-foreground text-xs mt-3">
                  Tip: click a main road in the bottom map.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 p-3">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/route")}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </motion.button>

            <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center p-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{destinationName || "Coimbatore, Tamil Nadu"}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Google Street View
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Alert Banner */}
        <AnimatePresence>
          {riskIndicator && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-3 right-3 z-50"
            >
              <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 border-l-4" style={{ borderLeftColor: riskIndicator.borderColor }}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${riskIndicator.color} animate-pulse`} />
                  <span className="font-semibold text-sm text-gray-800">{riskIndicator.text}</span>
                  <button onClick={() => setIsMuted(!isMuted)} className="ml-auto p-1.5 rounded-full hover:bg-gray-100">
                    {isMuted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-primary" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right side zoom controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleZoom(0.3)} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleZoom(-0.3)} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <ZoomOut className="w-5 h-5 text-gray-700" />
          </motion.button>
        </div>

        {/* Compass (uses Google pano heading state) */}
        <div className="absolute right-3 bottom-3 z-50">
          <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Compass className="w-6 h-6 text-gray-700" style={{ transform: `rotate(${-heading}deg)` }} />
          </div>
        </div>

        {/* Date indicator */}
        <div className="absolute left-3 bottom-3 z-50">
          <div className="bg-white/90 backdrop-blur rounded px-2 py-1 shadow">
            <p className="text-xs text-gray-600">Jan 2026</p>
          </div>
        </div>

        {/* Share button */}
        <div className="absolute right-3 top-20 z-40">
          <button className="bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-2 bg-gray-200 flex items-center justify-center cursor-row-resize">
        <div className="w-12 h-1 bg-gray-400 rounded-full" />
      </div>

      {/* Bottom Map Section */}
      <div className="relative bg-gray-100" style={{ height: "42%" }}>
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Map Legend */}
        <div className="absolute bottom-3 left-3 z-[1000]">
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-2 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 bg-cyan-500" />
                <span className="text-gray-600">Street View</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 border-t-2 border-dashed border-cyan-500" />
                <span className="text-gray-600">Photo Path</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-gray-600">Photo Sphere</span>
              </div>
            </div>
            <p className="text-gray-500 mt-1">Click on the map to move Street View</p>
          </div>
        </div>

        {/* Map zoom controls */}
        <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1">
          <button onClick={() => mapRef.current?.zoomIn()} className="w-8 h-8 bg-white rounded shadow flex items-center justify-center text-gray-700 hover:bg-gray-50">+</button>
          <button onClick={() => mapRef.current?.zoomOut()} className="w-8 h-8 bg-white rounded shadow flex items-center justify-center text-gray-700 hover:bg-gray-50">−</button>
        </div>
      </div>

      <style>{`
        .street-view-marker { background: transparent !important; border: none !important; }
        .leaflet-container { font-family: inherit; }
      `}</style>
    </div>
  );
};

export default StreetViewPage;
