import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SearchResult {
  name: string;
  lat: number;
  lng: number;
  displayName: string;
}

export const DestinationSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { setDestination } = useLocation();
  const navigate = useNavigate();

  const searchLocation = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Bias search to Coimbatore, Tamil Nadu
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Coimbatore, Tamil Nadu')}&limit=5&bounded=1&viewbox=76.88,10.9,77.05,11.1`
      );
      const data = await response.json();
      
      const formattedResults: SearchResult[] = data.map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
      }));
      
      setResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search location');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounced search
    const timeoutId = setTimeout(() => searchLocation(value), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleSelectDestination = (result: SearchResult) => {
    setDestination({ lat: result.lat, lng: result.lng }, result.name);
    setQuery(result.name);
    setResults([]);
    toast.success(`Destination set: ${result.name}`);
    navigate('/route');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleSelectDestination(results[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Your current location</p>
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-location-blue animate-pulse" />
              Coimbatore, Tamil Nadu
            </p>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-risk-high/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-risk-high" />
            </div>
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Enter your destination..."
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="bg-secondary border-border focus:border-primary pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
              )}
            </div>
          </div>

          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 glass-panel p-2 z-50 max-h-60 overflow-y-auto"
            >
              {results.map((result, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectDestination(result)}
                  className="w-full p-3 text-left hover:bg-secondary rounded-lg transition-colors flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{result.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.displayName}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        <Button
          variant="glow"
          size="lg"
          className="w-full"
          disabled={!query}
          onClick={() => results.length > 0 && handleSelectDestination(results[0])}
        >
          <Navigation className="w-5 h-5" />
          Start Navigation
        </Button>
      </div>
    </motion.div>
  );
};
