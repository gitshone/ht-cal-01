import React, { useState, useEffect, useRef } from 'react';

interface LocationSearchProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

interface LocationResult {
  place_id: string;
  display_name: string;
  name: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className = '',
  error = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [predictions, setPredictions] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1`
      );

      if (response.ok) {
        const results = await response.json();
        setPredictions(results);
        setIsOpen(true);
      } else {
        setPredictions([]);
        setIsOpen(false);
      }
    } catch (error) {
      setPredictions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      searchLocations(inputValue);
    }, 300);
  };

  const handleLocationSelect = (location: LocationResult) => {
    onChange(location.display_name);
    setPredictions([]);
    setIsOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleFocus = () => {
    if (predictions.length > 0) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
        } ${className}`}
        autoComplete="off"
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {isOpen && predictions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {predictions.map(prediction => (
            <div
              key={prediction.place_id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleLocationSelect(prediction)}
            >
              <div className="text-sm font-medium text-gray-900">
                {prediction.name || prediction.display_name.split(',')[0]}
              </div>
              <div className="text-xs text-gray-500">
                {prediction.display_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default LocationSearch;
