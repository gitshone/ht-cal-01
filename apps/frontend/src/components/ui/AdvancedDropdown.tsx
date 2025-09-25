import React, { useState, useRef, useEffect } from 'react';
import { CalendarViewType, EventFilterType } from '@ht-cal-01/shared-types';
import { integrationsService } from '../../lib/api/integrations.service';
import SliderToggle from './SliderToggle';

interface AdvancedDropdownProps {
  viewType: CalendarViewType;
  onViewTypeChange: (viewType: CalendarViewType) => void;
  providerFilter: EventFilterType;
  onProviderFilterChange: (filter: EventFilterType) => void;
  showWeekends: boolean;
  onShowWeekendsChange: (show: boolean) => void;
  disabled?: boolean;
}

const AdvancedDropdown: React.FC<AdvancedDropdownProps> = ({
  viewType,
  onViewTypeChange,
  providerFilter,
  onProviderFilterChange,
  showWeekends,
  onShowWeekendsChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    providerFilter,
  ]);
  const [availableProviders, setAvailableProviders] = useState<
    { value: string; label: string }[]
  >([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available providers on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providers = await integrationsService.getConnectedProviders();
        const providerOptions = [
          { value: 'all', label: 'All calendars' },
          ...providers.map(provider => ({
            value: provider.providerType,
            label:
              provider.providerType.charAt(0).toUpperCase() +
              provider.providerType.slice(1),
          })),
        ];
        setAvailableProviders(providerOptions);
      } catch (error) {
        setAvailableProviders([
          { value: 'all', label: 'All calendars' },
          { value: 'google', label: 'Google' },
          { value: 'microsoft', label: 'Microsoft' },
          { value: 'zoom', label: 'Zoom' },
        ]);
      }
    };

    fetchProviders();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected providers when providerFilter changes
  useEffect(() => {
    if (providerFilter === 'all') {
      setSelectedProviders(['all']);
    } else if (!selectedProviders.includes(providerFilter)) {
      setSelectedProviders([providerFilter]);
    }
  }, [providerFilter]);

  const viewOptions = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ] as const;

  const handleProviderToggle = (value: string) => {
    if (value === 'all') {
      setSelectedProviders(['all']);
      onProviderFilterChange('all');
    } else {
      const newProviders = selectedProviders.includes(value)
        ? selectedProviders.filter(p => p !== value && p !== 'all')
        : [...selectedProviders.filter(p => p !== 'all'), value];

      if (newProviders.length === 0) {
        setSelectedProviders(['all']);
        onProviderFilterChange('all');
      } else {
        setSelectedProviders(newProviders);
        onProviderFilterChange(newProviders[0] as EventFilterType);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Options</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-6">
            {/* View Type Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                View Type
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {viewOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onViewTypeChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewType === option.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Filter Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Calendar Sources
              </h3>
              <div className="space-y-2">
                {availableProviders.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProviders.includes(option.value)}
                      onChange={() => handleProviderToggle(option.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Display Options
              </h3>
              <div className="space-y-4">
                <SliderToggle
                  checked={showWeekends}
                  onChange={onShowWeekendsChange}
                  disabled={disabled}
                  label="Show weekends"
                  description="Include Saturday and Sunday in calendar views"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDropdown;
