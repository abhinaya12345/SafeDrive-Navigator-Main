import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface LocationContextType {
  currentLocation: Location | null;
  destination: Location | null;
  destinationName: string;
  isLoading: boolean;
  error: string | null;
  setDestination: (location: Location, name: string) => void;
  clearDestination: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestinationState] = useState<Location | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (err) => {
          setError('Unable to get your location. Please enable location services.');
          // Default to Chennai, India if location fails
          setCurrentLocation({ lat: 13.0827, lng: 80.2707 });
          setIsLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setCurrentLocation({ lat: 13.0827, lng: 80.2707 });
      setIsLoading(false);
    }
  }, []);

  const setDestination = (location: Location, name: string) => {
    setDestinationState(location);
    setDestinationName(name);
  };

  const clearDestination = () => {
    setDestinationState(null);
    setDestinationName('');
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        destination,
        destinationName,
        isLoading,
        error,
        setDestination,
        clearDestination,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
