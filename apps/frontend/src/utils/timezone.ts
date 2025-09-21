export const getSupportedTimezones = (): Array<{
  value: string;
  label: string;
}> => {
  try {
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      const timezones = (Intl as any).supportedValuesOf('timeZone') as string[];

      return timezones
        .map(tz => ({
          value: tz,
          label: formatTimezoneLabel(tz),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
  } catch (error) {
    console.warn(
      'Intl.supportedValuesOf not available, using fallback timezones:',
      error
    );
  }

  return getCommonTimezones();
};

const formatTimezoneLabel = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(now);
    const timeZoneName =
      parts.find(part => part.type === 'timeZoneName')?.value || '';

    const cityName = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;

    return `${cityName} (${timeZoneName})`;
  } catch (error) {
    console.warn('Failed to format timezone label:', error);
    return timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
  }
};

const getCommonTimezones = (): Array<{ value: string; label: string }> => [
  { value: 'UTC', label: 'UTC (UTC)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'America/Denver', label: 'Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Rome', label: 'Rome (CET)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Mumbai (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/Toronto', label: 'Toronto (EST)' },
  { value: 'America/Vancouver', label: 'Vancouver (PST)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)' },
];
