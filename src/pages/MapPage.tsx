import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { useLocation } from '@/contexts/LocationContext';
import { DestinationSearch } from '@/components/DestinationSearch';
import { coimbatoreBounds } from '@/data/riskZones';
import { LogOut, User, Navigation } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

const MapPage: React.FC = () => {
  const { currentLocation, isLoading, error } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Initialize map - use Coimbatore as default center
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const mapCenter = currentLocation || coimbatoreBounds.center;

    // Create map centered on Coimbatore
    const map = L.map(mapContainerRef.current, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: 14,
      zoomControl: false,
    });

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Custom current location icon
    const currentLocationIcon = L.divIcon({
      className: 'current-location-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; inset: 0; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);"></div>
          <div style="position: absolute; inset: 2px; background: rgba(255,255,255,0.3); border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Add marker at current location or Coimbatore center
    const marker = L.marker([mapCenter.lat, mapCenter.lng], {
      icon: currentLocationIcon,
    }).addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentLocation]);

  // Update marker position when location changes
  useEffect(() => {
    if (mapRef.current && markerRef.current && currentLocation) {
      markerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 14, { animate: true });
    }
  }, [currentLocation]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-primary flex items-center justify-center">
              <Navigation className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground">Detecting your location...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] p-4">
        <div className="glass-panel p-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>
      </header>

      {/* Map */}
      <div 
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{ background: 'hsl(222 47% 6%)' }}
      />

      {/* Error message */}
      {error && (
        <div className="absolute top-24 left-4 right-4 z-[1000]">
          <div className="glass-panel p-3 bg-destructive/20 border-destructive/50">
            <p className="text-sm text-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Search panel */}
      <div className="absolute bottom-8 left-4 right-4 z-[1000]">
        <DestinationSearch />
      </div>

      {/* Custom CSS for marker */}
      <style>{`
        .current-location-marker {
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

export default MapPage;
