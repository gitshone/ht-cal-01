import React from 'react';
import dayjs from 'dayjs';
import { CalendarViewType, EventFilterType } from '@ht-cal-01/shared-types';
import AdvancedDropdown from '../ui/AdvancedDropdown';

interface CalendarHeaderProps {
  viewType: CalendarViewType;
  currentDate: dayjs.Dayjs;
  onViewTypeChange: (viewType: CalendarViewType) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  providerFilter: EventFilterType;
  onProviderFilterChange: (filter: EventFilterType) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  showWeekends: boolean;
  onShowWeekendsChange: (show: boolean) => void;
  disabled?: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  viewType,
  currentDate,
  onViewTypeChange,
  onPrevious,
  onNext,
  onToday,
  providerFilter,
  onProviderFilterChange,
  searchQuery,
  onSearchQueryChange,
  showWeekends,
  onShowWeekendsChange,
  disabled = false,
}) => (
  <div className="bg-white border-b border-gray-200 shadow-sm">
    <div className="px-6 py-4">
      {/* Main Header Row */}
      <div className="flex items-center justify-between">
        {/* Left Side - Navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <button
              onClick={onPrevious}
              disabled={disabled}
              className={`p-2 rounded-full transition-colors ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={onNext}
              disabled={disabled}
              className={`p-2 rounded-full transition-colors ${
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={onToday}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Today
          </button>
        </div>

        {/* Center - Date */}
        <h1
          className={`text-2xl font-normal text-gray-900 ${
            disabled ? 'text-gray-400' : ''
          }`}
        >
          {currentDate.format('MMMM YYYY')}
        </h1>

        {/* Right Side - Advanced Options Dropdown */}
        <AdvancedDropdown
          viewType={viewType}
          onViewTypeChange={onViewTypeChange}
          providerFilter={providerFilter}
          onProviderFilterChange={onProviderFilterChange}
          showWeekends={showWeekends}
          onShowWeekendsChange={onShowWeekendsChange}
          disabled={disabled}
        />
      </div>

      {/* Bottom Row - Search */}
      <div className="flex items-center mt-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            disabled={disabled}
            className={`w-full pl-10 pr-4 py-2 text-sm font-normal border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              disabled
                ? 'bg-gray-50 text-gray-400 placeholder-gray-300 cursor-not-allowed'
                : 'bg-white hover:border-gray-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default CalendarHeader;
