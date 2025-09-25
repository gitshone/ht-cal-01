import React, { useState, useRef, useEffect, useMemo } from 'react';

interface SearchableSelectProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxVisibleOptions?: number;
  showSearchHint?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  disabled = false,
  maxVisibleOptions = 50,
  showSearchHint = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options.slice(0, maxVisibleOptions);
    }

    const filtered = options.filter(
      option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.slice(0, maxVisibleOptions);
  }, [searchTerm, options, maxVisibleOptions]);

  const hasMoreResults = useMemo(() => {
    if (!searchTerm) {
      return options.length > maxVisibleOptions;
    }

    const totalFiltered = options.filter(
      option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return totalFiltered.length > maxVisibleOptions;
  }, [searchTerm, options, maxVisibleOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? searchTerm : selectedOption?.label || ''}
        onChange={e => setSearchTerm(e.target.value)}
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
        placeholder={
          isOpen ? placeholder : selectedOption?.label || placeholder
        }
        disabled={disabled}
        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-white cursor-pointer'
        }`}
      />

      {/* Dropdown Arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
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
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Search Hint */}
          {showSearchHint &&
            !searchTerm &&
            options.length > maxVisibleOptions && (
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                Showing first {maxVisibleOptions} of {options.length} timezones.
                Type to search all.
              </div>
            )}

          {/* Results Count */}
          {searchTerm && (
            <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
              {filteredOptions.length} result
              {filteredOptions.length !== 1 ? 's' : ''} found
              {hasMoreResults && ` (showing first ${maxVisibleOptions})`}
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No timezones found
            </div>
          ) : (
            filteredOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  option.value === value
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))
          )}

          {/* More Results Hint */}
          {hasMoreResults && (
            <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
              {searchTerm
                ? `Type more to narrow down ${
                    options.length - maxVisibleOptions
                  } more results`
                : `Type to search through ${
                    options.length - maxVisibleOptions
                  } more timezones`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
