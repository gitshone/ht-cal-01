import React, { useState, useEffect } from 'react';
import { timezoneService } from '../../services/timezone.service';
import dayjs from 'dayjs';

interface TimezoneAwareDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  timezone?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showTimezone?: boolean;
}

export const TimezoneAwareDateTimePicker: React.FC<
  TimezoneAwareDateTimePickerProps
> = ({
  value,
  onChange,
  timezone,
  label,
  required = false,
  disabled = false,
  className = '',
  showTimezone = true,
}) => {
  const [localDate, setLocalDate] = useState('');
  const [localTime, setLocalTime] = useState('');
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');
  const [timeInputValue, setTimeInputValue] = useState('');

  const userTimezone = timezone || timezoneService.getCurrentTimezone();
  const is24HourFormat = timezoneService.is24HourFormat(userTimezone);

  useEffect(() => {
    if (value) {
      try {
        const utcDate = dayjs.utc(value);
        const localDateObj = utcDate.tz(userTimezone);

        setLocalDate(localDateObj.format('YYYY-MM-DD'));

        if (is24HourFormat) {
          setLocalTime(localDateObj.format('HH:mm'));
        } else {
          const hour24 = localDateObj.hour();
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
          const minute = localDateObj.minute();
          const timeString = `${hour12.toString().padStart(2, '0')}:${minute
            .toString()
            .padStart(2, '0')}`;
          setLocalTime(timeString);
          setTimeInputValue(timeString);
          setAmPm(hour24 >= 12 ? 'PM' : 'AM');
        }
      } catch (error) {
        const now = dayjs().tz(userTimezone);
        setLocalDate(now.format('YYYY-MM-DD'));

        if (is24HourFormat) {
          setLocalTime(now.format('HH:mm'));
        } else {
          const hour24 = now.hour();
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
          const minute = now.minute();
          const timeString = `${hour12.toString().padStart(2, '0')}:${minute
            .toString()
            .padStart(2, '0')}`;
          setLocalTime(timeString);
          setTimeInputValue(timeString);
          setAmPm(hour24 >= 12 ? 'PM' : 'AM');
        }
      }
    }
  }, [value, userTimezone, is24HourFormat]);

  const convertTo24Hour = (time12: string, ampm: 'AM' | 'PM'): string => {
    const [hours, minutes] = time12.split(':').map(Number);
    let hour24 = hours;

    if (ampm === 'AM' && hours === 12) {
      hour24 = 0;
    } else if (ampm === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    }

    return `${hour24.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  };

  const handleDateChange = (newDate: string) => {
    setLocalDate(newDate);
    if (newDate && localTime) {
      const time24 = is24HourFormat
        ? localTime
        : convertTo24Hour(localTime, amPm);
      const localDateTime = `${newDate}T${time24}:00`;
      const utcDateTime = timezoneService.toUTC(localDateTime, userTimezone);
      onChange(utcDateTime.toISOString());
    }
  };

  const handleTimeChange = (newTime: string) => {
    setLocalTime(newTime);
    if (localDate && newTime) {
      const time24 = is24HourFormat ? newTime : convertTo24Hour(newTime, amPm);
      const localDateTime = `${localDate}T${time24}:00`;
      const utcDateTime = timezoneService.toUTC(localDateTime, userTimezone);
      onChange(utcDateTime.toISOString());
    }
  };

  const handleAmPmChange = (newAmPm: 'AM' | 'PM') => {
    setAmPm(newAmPm);
    if (localDate && localTime) {
      const time24 = convertTo24Hour(localTime, newAmPm);
      const localDateTime = `${localDate}T${time24}:00`;
      const utcDateTime = timezoneService.toUTC(localDateTime, userTimezone);
      onChange(utcDateTime.toISOString());
    }
  };

  const parseTimeInput = (
    input: string
  ): { hours: string; minutes: string; valid: boolean } => {
    // Handle various input formats: 9, 9:30, 09:30, 9:30 AM, etc.
    const cleanInput = input.trim().toUpperCase();

    // Remove AM/PM from input if present
    const timeOnly = cleanInput.replace(/\s*(AM|PM)/, '').trim();

    // Parse time
    const timeMatch = timeOnly.match(/^(\d{1,2})(?::(\d{2}))?$/);
    if (!timeMatch) {
      return { hours: '01', minutes: '00', valid: false };
    }

    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

    // Validate hours (1-12 for 12-hour format)
    if (hours < 1 || hours > 12) {
      return { hours: '01', minutes: '00', valid: false };
    }

    // Validate minutes (0-59)
    if (minutes < 0 || minutes > 59) {
      return { hours: '01', minutes: '00', valid: false };
    }

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      valid: true,
    };
  };

  // Handle time input change for 12-hour format
  const handleTimeInputChange = (input: string) => {
    setTimeInputValue(input);

    const parsed = parseTimeInput(input);
    if (parsed.valid) {
      const newTime = `${parsed.hours}:${parsed.minutes}`;
      setLocalTime(newTime);

      if (localDate) {
        const time24 = convertTo24Hour(newTime, amPm);
        const localDateTime = `${localDate}T${time24}:00`;
        const utcDateTime = timezoneService.toUTC(localDateTime, userTimezone);
        onChange(utcDateTime.toISOString());
      }
    }
  };

  // Handle time input blur - auto-format when clicking out
  const handleTimeInputBlur = () => {
    const parsed = parseTimeInput(timeInputValue);
    if (parsed.valid) {
      const formattedTime = `${parsed.hours}:${parsed.minutes}`;
      setTimeInputValue(formattedTime);
      setLocalTime(formattedTime);

      if (localDate) {
        const time24 = convertTo24Hour(formattedTime, amPm);
        const localDateTime = `${localDate}T${time24}:00`;
        const utcDateTime = timezoneService.toUTC(localDateTime, userTimezone);
        onChange(utcDateTime.toISOString());
      }
    } else {
      setTimeInputValue(localTime);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date Input */}
        <div>
          <input
            type="date"
            value={localDate}
            onChange={e => handleDateChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            required={required}
          />
        </div>

        {/* Time Input */}
        <div className="flex gap-2">
          {is24HourFormat ? (
            /* 24-hour format - use HTML time input */
            <input
              type="time"
              value={localTime}
              onChange={e => handleTimeChange(e.target.value)}
              disabled={disabled}
              className="w-24 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              required={required}
            />
          ) : (
            /* 12-hour format - Google Calendar style input with dropdown */
            <>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={timeInputValue}
                  onChange={e => handleTimeInputChange(e.target.value)}
                  onFocus={e => e.target.select()}
                  onBlur={handleTimeInputBlur}
                  placeholder="9:30"
                  disabled={disabled}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                  required={required}
                />
                <select
                  value={amPm}
                  onChange={e =>
                    handleAmPmChange(e.target.value as 'AM' | 'PM')
                  }
                  disabled={disabled}
                  className="px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm bg-white"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface TimezoneAwareTimeRangePickerProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  timezone?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showTimezone?: boolean;
  showIndividualLabels?: boolean;
}

export const TimezoneAwareTimeRangePicker: React.FC<
  TimezoneAwareTimeRangePickerProps
> = ({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  timezone,
  label,
  required = false,
  disabled = false,
  className = '',
  showTimezone = true,
  showIndividualLabels = true,
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <div className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Start</div>
            <TimezoneAwareDateTimePicker
              value={startValue}
              onChange={onStartChange}
              timezone={timezone}
              required={required}
              disabled={disabled}
              showTimezone={false}
            />
          </div>

          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">End</div>
            <TimezoneAwareDateTimePicker
              value={endValue}
              onChange={onEndChange}
              timezone={timezone}
              required={required}
              disabled={disabled}
              showTimezone={false}
            />
          </div>
        </div>

        {/* Timezone Display - Only show once at the end */}
        {showTimezone && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            {timezone || timezoneService.getCurrentTimezone()} (
            {timezoneService.getTimezoneOffset(
              timezone || timezoneService.getCurrentTimezone()
            )}
            )
            {!timezoneService.is24HourFormat(
              timezone || timezoneService.getCurrentTimezone()
            ) && <span className="ml-2 text-blue-600">• 12-hour format</span>}
          </div>
        )}
      </div>
    </div>
  );
};

interface TimezoneAwareTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  timezone?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const TimezoneAwareTimeInput: React.FC<TimezoneAwareTimeInputProps> = ({
  value,
  onChange,
  timezone,
  disabled = false,
  className = '',
  placeholder = '9:30',
}) => {
  const [timeInputValue, setTimeInputValue] = useState('');
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');

  const userTimezone = timezone || timezoneService.getCurrentTimezone();
  const is24HourFormat = timezoneService.is24HourFormat(userTimezone);

  useEffect(() => {
    if (value) {
      try {
        const [hours, minutes] = value.split(':').map(Number);

        if (is24HourFormat) {
          setTimeInputValue(value);
        } else {
          const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
          const timeString = `${hour12.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}`;
          setTimeInputValue(timeString);
          setAmPm(hours >= 12 ? 'PM' : 'AM');
        }
      } catch (error) {
        setTimeInputValue('09:00');
      }
    }
  }, [value, userTimezone, is24HourFormat]);

  // Convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12: string, ampm: 'AM' | 'PM'): string => {
    const [hours, minutes] = time12.split(':').map(Number);
    let hour24 = hours;

    if (ampm === 'AM' && hours === 12) {
      hour24 = 0;
    } else if (ampm === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    }

    return `${hour24.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  };

  // Parse time input for 12-hour format
  const parseTimeInput = (
    input: string
  ): { hours: string; minutes: string; valid: boolean } => {
    const cleanInput = input.trim().toUpperCase();
    const timeOnly = cleanInput.replace(/\s*(AM|PM)/, '').trim();
    const timeMatch = timeOnly.match(/^(\d{1,2})(?::(\d{2}))?$/);

    if (!timeMatch) {
      return { hours: '01', minutes: '00', valid: false };
    }

    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

    if (hours < 1 || hours > 12) {
      return { hours: '01', minutes: '00', valid: false };
    }

    if (minutes < 0 || minutes > 59) {
      return { hours: '01', minutes: '00', valid: false };
    }

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      valid: true,
    };
  };

  // Handle time input change for 12-hour format
  const handleTimeInputChange = (input: string) => {
    setTimeInputValue(input);

    const parsed = parseTimeInput(input);
    if (parsed.valid) {
      const newTime = `${parsed.hours}:${parsed.minutes}`;
      const time24 = convertTo24Hour(newTime, amPm);
      onChange(time24);
    }
  };

  // Handle time input blur - auto-format when clicking out
  const handleTimeInputBlur = () => {
    const parsed = parseTimeInput(timeInputValue);
    if (parsed.valid) {
      const formattedTime = `${parsed.hours}:${parsed.minutes}`;
      setTimeInputValue(formattedTime);
      const time24 = convertTo24Hour(formattedTime, amPm);
      onChange(time24);
    } else {
      // Reset to current valid time if input is invalid
      setTimeInputValue(value);
    }
  };

  const handleAmPmChange = (newAmPm: 'AM' | 'PM') => {
    setAmPm(newAmPm);
    if (timeInputValue) {
      const time24 = convertTo24Hour(timeInputValue, newAmPm);
      onChange(time24);
    }
  };

  const handleTimeChange = (newTime: string) => {
    onChange(newTime);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {is24HourFormat ? (
        /* 24-hour format - use HTML time input */
        <input
          type="time"
          value={value}
          onChange={e => handleTimeChange(e.target.value)}
          disabled={disabled}
          className="w-24 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        />
      ) : (
        /* 12-hour format - Google Calendar style input with dropdown */
        <>
          <div className="flex gap-1">
            <input
              type="text"
              value={timeInputValue}
              onChange={e => handleTimeInputChange(e.target.value)}
              onFocus={e => e.target.select()}
              onBlur={handleTimeInputBlur}
              placeholder={placeholder}
              disabled={disabled}
              className="w-20 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
          </div>
          <select
            value={amPm}
            onChange={e => handleAmPmChange(e.target.value as 'AM' | 'PM')}
            disabled={disabled}
            className="px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm bg-white"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </>
      )}
    </div>
  );
};
