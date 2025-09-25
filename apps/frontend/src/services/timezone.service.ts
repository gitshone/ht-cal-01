import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class TimezoneService {
  private static instance: TimezoneService;
  private userTimezone: string | null = null;
  private browserTimezone: string;
  private cachedTimezones: Array<{ value: string; label: string }> | null =
    null;

  private readonly availableTimezones = [
    'UTC',
    // America
    'America/Adak',
    'America/Anchorage',
    'America/Anguilla',
    'America/Antigua',
    'America/Argentina/Buenos_Aires',
    'America/Argentina/Catamarca',
    'America/Argentina/Cordoba',
    'America/Argentina/Jujuy',
    'America/Argentina/La_Rioja',
    'America/Argentina/Mendoza',
    'America/Argentina/Rio_Gallegos',
    'America/Argentina/Salta',
    'America/Argentina/San_Juan',
    'America/Argentina/San_Luis',
    'America/Argentina/Tucuman',
    'America/Argentina/Ushuaia',
    'America/Aruba',
    'America/Asuncion',
    'America/Bahia',
    'America/Bahia_Banderas',
    'America/Barbados',
    'America/Belem',
    'America/Belize',
    'America/Boa_Vista',
    'America/Bogota',
    'America/Boise',
    'America/Cambridge_Bay',
    'America/Campo_Grande',
    'America/Cancun',
    'America/Caracas',
    'America/Cayenne',
    'America/Cayman',
    'America/Chicago',
    'America/Chihuahua',
    'America/Costa_Rica',
    'America/Creston',
    'America/Cuiaba',
    'America/Curacao',
    'America/Danmarkshavn',
    'America/Dawson',
    'America/Dawson_Creek',
    'America/Denver',
    'America/Detroit',
    'America/Dominica',
    'America/Edmonton',
    'America/Eirunepe',
    'America/El_Salvador',
    'America/Fort_Nelson',
    'America/Fortaleza',
    'America/Glace_Bay',
    'America/Goose_Bay',
    'America/Grand_Turk',
    'America/Grenada',
    'America/Guadeloupe',
    'America/Guatemala',
    'America/Guayaquil',
    'America/Guyana',
    'America/Halifax',
    'America/Havana',
    'America/Hermosillo',
    'America/Indiana/Indianapolis',
    'America/Indiana/Knox',
    'America/Indiana/Marengo',
    'America/Indiana/Petersburg',
    'America/Indiana/Tell_City',
    'America/Indiana/Vevay',
    'America/Indiana/Vincennes',
    'America/Indiana/Winamac',
    'America/Inuvik',
    'America/Iqaluit',
    'America/Jamaica',
    'America/Juneau',
    'America/Kentucky/Louisville',
    'America/Kentucky/Monticello',
    'America/Kralendijk',
    'America/La_Paz',
    'America/Lima',
    'America/Los_Angeles',
    'America/Lower_Princes',
    'America/Maceio',
    'America/Managua',
    'America/Manaus',
    'America/Marigot',
    'America/Martinique',
    'America/Matamoros',
    'America/Mazatlan',
    'America/Menominee',
    'America/Merida',
    'America/Metlakatla',
    'America/Mexico_City',
    'America/Miquelon',
    'America/Moncton',
    'America/Monterrey',
    'America/Montevideo',
    'America/Montserrat',
    'America/Nassau',
    'America/New_York',
    'America/Nipigon',
    'America/Nome',
    'America/Noronha',
    'America/North_Dakota/Beulah',
    'America/North_Dakota/Center',
    'America/North_Dakota/New_Salem',
    'America/Nuuk',
    'America/Ojinaga',
    'America/Panama',
    'America/Pangnirtung',
    'America/Paramaribo',
    'America/Phoenix',
    'America/Port-au-Prince',
    'America/Port_of_Spain',
    'America/Porto_Velho',
    'America/Puerto_Rico',
    'America/Punta_Arenas',
    'America/Rainy_River',
    'America/Rankin_Inlet',
    'America/Recife',
    'America/Regina',
    'America/Resolute',
    'America/Rio_Branco',
    'America/Santarem',
    'America/Santiago',
    'America/Santo_Domingo',
    'America/Sao_Paulo',
    'America/Scoresbysund',
    'America/Sitka',
    'America/St_Barthelemy',
    'America/St_Johns',
    'America/St_Kitts',
    'America/St_Lucia',
    'America/St_Thomas',
    'America/St_Vincent',
    'America/Swift_Current',
    'America/Tegucigalpa',
    'America/Thule',
    'America/Thunder_Bay',
    'America/Tijuana',
    'America/Toronto',
    'America/Tortola',
    'America/Vancouver',
    'America/Whitehorse',
    'America/Winnipeg',
    'America/Yakutat',
    'America/Yellowknife',

    // Europe
    'Europe/Amsterdam',
    'Europe/Andorra',
    'Europe/Astrakhan',
    'Europe/Athens',
    'Europe/Belgrade',
    'Europe/Berlin',
    'Europe/Bratislava',
    'Europe/Brussels',
    'Europe/Bucharest',
    'Europe/Budapest',
    'Europe/Busingen',
    'Europe/Chisinau',
    'Europe/Copenhagen',
    'Europe/Dublin',
    'Europe/Gibraltar',
    'Europe/Guernsey',
    'Europe/Helsinki',
    'Europe/Isle_of_Man',
    'Europe/Istanbul',
    'Europe/Jersey',
    'Europe/Kaliningrad',
    'Europe/Kiev',
    'Europe/Kirov',
    'Europe/Lisbon',
    'Europe/Ljubljana',
    'Europe/London',
    'Europe/Luxembourg',
    'Europe/Madrid',
    'Europe/Malta',
    'Europe/Mariehamn',
    'Europe/Minsk',
    'Europe/Monaco',
    'Europe/Moscow',
    'Europe/Oslo',
    'Europe/Paris',
    'Europe/Podgorica',
    'Europe/Prague',
    'Europe/Riga',
    'Europe/Rome',
    'Europe/Samara',
    'Europe/San_Marino',
    'Europe/Sarajevo',
    'Europe/Saratov',
    'Europe/Simferopol',
    'Europe/Skopje',
    'Europe/Sofia',
    'Europe/Stockholm',
    'Europe/Tallinn',
    'Europe/Tirane',
    'Europe/Ulyanovsk',
    'Europe/Uzhgorod',
    'Europe/Vaduz',
    'Europe/Vatican',
    'Europe/Vienna',
    'Europe/Vilnius',
    'Europe/Volgograd',
    'Europe/Warsaw',
    'Europe/Zagreb',
    'Europe/Zaporozhye',
    'Europe/Zurich',

    // Asia
    'Asia/Aden',
    'Asia/Almaty',
    'Asia/Amman',
    'Asia/Anadyr',
    'Asia/Aqtau',
    'Asia/Aqtobe',
    'Asia/Ashgabat',
    'Asia/Atyrau',
    'Asia/Baghdad',
    'Asia/Bahrain',
    'Asia/Baku',
    'Asia/Bangkok',
    'Asia/Barnaul',
    'Asia/Beirut',
    'Asia/Bishkek',
    'Asia/Brunei',
    'Asia/Chita',
    'Asia/Choibalsan',
    'Asia/Colombo',
    'Asia/Damascus',
    'Asia/Dhaka',
    'Asia/Dili',
    'Asia/Dubai',
    'Asia/Dushanbe',
    'Asia/Famagusta',
    'Asia/Gaza',
    'Asia/Hebron',
    'Asia/Ho_Chi_Minh',
    'Asia/Hong_Kong',
    'Asia/Hovd',
    'Asia/Irkutsk',
    'Asia/Jakarta',
    'Asia/Jayapura',
    'Asia/Jerusalem',
    'Asia/Kabul',
    'Asia/Kamchatka',
    'Asia/Karachi',
    'Asia/Kathmandu',
    'Asia/Khandyga',
    'Asia/Kolkata',
    'Asia/Krasnoyarsk',
    'Asia/Kuala_Lumpur',
    'Asia/Kuching',
    'Asia/Kuwait',
    'Asia/Macau',
    'Asia/Magadan',
    'Asia/Makassar',
    'Asia/Manila',
    'Asia/Muscat',
    'Asia/Nicosia',
    'Asia/Novokuznetsk',
    'Asia/Novosibirsk',
    'Asia/Omsk',
    'Asia/Oral',
    'Asia/Phnom_Penh',
    'Asia/Pontianak',
    'Asia/Pyongyang',
    'Asia/Qatar',
    'Asia/Qostanay',
    'Asia/Qyzylorda',
    'Asia/Riyadh',
    'Asia/Sakhalin',
    'Asia/Samarkand',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Srednekolymsk',
    'Asia/Taipei',
    'Asia/Tashkent',
    'Asia/Tbilisi',
    'Asia/Tehran',
    'Asia/Thimphu',
    'Asia/Tokyo',
    'Asia/Tomsk',
    'Asia/Ulaanbaatar',
    'Asia/Urumqi',
    'Asia/Ust-Nera',
    'Asia/Vientiane',
    'Asia/Vladivostok',
    'Asia/Yakutsk',
    'Asia/Yangon',
    'Asia/Yekaterinburg',
    'Asia/Yerevan',

    // Africa
    'Africa/Abidjan',
    'Africa/Accra',
    'Africa/Addis_Ababa',
    'Africa/Algiers',
    'Africa/Asmara',
    'Africa/Bamako',
    'Africa/Bangui',
    'Africa/Banjul',
    'Africa/Bissau',
    'Africa/Blantyre',
    'Africa/Brazzaville',
    'Africa/Bujumbura',
    'Africa/Cairo',
    'Africa/Casablanca',
    'Africa/Ceuta',
    'Africa/Conakry',
    'Africa/Dakar',
    'Africa/Dar_es_Salaam',
    'Africa/Djibouti',
    'Africa/Douala',
    'Africa/El_Aaiun',
    'Africa/Freetown',
    'Africa/Gaborone',
    'Africa/Harare',
    'Africa/Johannesburg',
    'Africa/Juba',
    'Africa/Kampala',
    'Africa/Khartoum',
    'Africa/Kigali',
    'Africa/Kinshasa',
    'Africa/Lagos',
    'Africa/Libreville',
    'Africa/Lome',
    'Africa/Luanda',
    'Africa/Lubumbashi',
    'Africa/Lusaka',
    'Africa/Malabo',
    'Africa/Maputo',
    'Africa/Maseru',
    'Africa/Mbabane',
    'Africa/Mogadishu',
    'Africa/Monrovia',
    'Africa/Nairobi',
    'Africa/Ndjamena',
    'Africa/Niamey',
    'Africa/Nouakchott',
    'Africa/Ouagadougou',
    'Africa/Porto-Novo',
    'Africa/Sao_Tome',
    'Africa/Tripoli',
    'Africa/Tunis',
    'Africa/Windhoek',

    // Australia
    'Australia/Adelaide',
    'Australia/Brisbane',
    'Australia/Broken_Hill',
    'Australia/Darwin',
    'Australia/Eucla',
    'Australia/Hobart',
    'Australia/Lindeman',
    'Australia/Lord_Howe',
    'Australia/Melbourne',
    'Australia/Perth',
    'Australia/Sydney',

    // Pacific
    'Pacific/Apia',
    'Pacific/Auckland',
    'Pacific/Bougainville',
    'Pacific/Chatham',
    'Pacific/Chuuk',
    'Pacific/Easter',
    'Pacific/Efate',
    'Pacific/Enderbury',
    'Pacific/Fakaofo',
    'Pacific/Fiji',
    'Pacific/Funafuti',
    'Pacific/Galapagos',
    'Pacific/Gambier',
    'Pacific/Guadalcanal',
    'Pacific/Guam',
    'Pacific/Honolulu',
    'Pacific/Kiritimati',
    'Pacific/Kosrae',
    'Pacific/Kwajalein',
    'Pacific/Majuro',
    'Pacific/Marquesas',
    'Pacific/Midway',
    'Pacific/Nauru',
    'Pacific/Niue',
    'Pacific/Norfolk',
    'Pacific/Noumea',
    'Pacific/Pago_Pago',
    'Pacific/Palau',
    'Pacific/Pitcairn',
    'Pacific/Pohnpei',
    'Pacific/Port_Moresby',
    'Pacific/Rarotonga',
    'Pacific/Saipan',
    'Pacific/Tahiti',
    'Pacific/Tarawa',
    'Pacific/Tongatapu',
    'Pacific/Wake',
    'Pacific/Wallis',

    // Indian Ocean
    'Indian/Antananarivo',
    'Indian/Chagos',
    'Indian/Christmas',
    'Indian/Cocos',
    'Indian/Comoro',
    'Indian/Kerguelen',
    'Indian/Mahe',
    'Indian/Maldives',
    'Indian/Mauritius',
    'Indian/Mayotte',
    'Indian/Reunion',

    // Atlantic
    'Atlantic/Azores',
    'Atlantic/Bermuda',
    'Atlantic/Canary',
    'Atlantic/Cape_Verde',
    'Atlantic/Faroe',
    'Atlantic/Madeira',
    'Atlantic/Reykjavik',
    'Atlantic/South_Georgia',
    'Atlantic/St_Helena',
    'Atlantic/Stanley',
  ];

  private constructor() {
    this.browserTimezone = this.detectBrowserTimezone();
  }

  public static getInstance(): TimezoneService {
    if (!TimezoneService.instance) {
      TimezoneService.instance = new TimezoneService();
    }
    return TimezoneService.instance;
  }

  /**
   * Detect browser timezone using Intl API
   */
  private detectBrowserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      return 'UTC';
    }
  }

  /**
   * Set user's preferred timezone (from settings)
   */
  public setUserTimezone(timezone: string): void {
    this.userTimezone = timezone;
  }

  /**
   * Get current timezone (user preference or browser default)
   */
  public getCurrentTimezone(): string {
    return this.userTimezone || this.browserTimezone;
  }

  /**
   * Get browser timezone
   */
  public getBrowserTimezone(): string {
    return this.browserTimezone;
  }

  /**
   * Convert local time to UTC for storage
   */
  public toUTC(
    localDateTime: string | Date | dayjs.Dayjs,
    timezone?: string
  ): dayjs.Dayjs {
    const tz = timezone || this.getCurrentTimezone();

    const localTime = dayjs.tz(localDateTime, tz);
    const utcTime = localTime.utc();

    return utcTime;
  }

  /**
   * Convert UTC time to user's timezone for display
   */
  public fromUTC(
    utcDateTime: string | Date | dayjs.Dayjs,
    targetTimezone?: string
  ): dayjs.Dayjs {
    const tz = targetTimezone || this.getCurrentTimezone();

    const utcTime = dayjs.utc(utcDateTime);
    const localTime = utcTime.tz(tz);

    return localTime;
  }

  /**
   * Format time for display in user's timezone
   */
  public formatTime(
    utcDateTime: string | Date | dayjs.Dayjs,
    format?: string,
    targetTimezone?: string
  ): string {
    const tz = targetTimezone || this.getCurrentTimezone();
    const localTime = this.fromUTC(utcDateTime, tz);

    if (format) {
      return localTime.format(format);
    }

    const is24Hour = this.is24HourFormat(tz);
    return localTime.format(is24Hour ? 'HH:mm' : 'h:mm A');
  }

  /**
   * Format date for display in user's timezone
   */
  public formatDate(
    utcDateTime: string | Date | dayjs.Dayjs,
    format?: string,
    targetTimezone?: string
  ): string {
    const tz = targetTimezone || this.getCurrentTimezone();
    const localTime = this.fromUTC(utcDateTime, tz);
    return localTime.format(format || 'MMM D, YYYY');
  }

  /**
   * Format date and time for display
   */
  public formatDateTime(
    utcDateTime: string | Date | dayjs.Dayjs,
    targetTimezone?: string
  ): string {
    const tz = targetTimezone || this.getCurrentTimezone();
    const localTime = this.fromUTC(utcDateTime, tz);
    const is24Hour = this.is24HourFormat(tz);
    const timeFormat = is24Hour ? 'HH:mm' : 'h:mm A';
    return localTime.format(`MMM D, YYYY ${timeFormat}`);
  }

  /**
   * Format time range (start - end)
   */
  public formatTimeRange(
    startUTC: string | Date | dayjs.Dayjs,
    endUTC: string | Date | dayjs.Dayjs,
    targetTimezone?: string
  ): string {
    const tz = targetTimezone || this.getCurrentTimezone();
    const start = this.fromUTC(startUTC, tz);
    const end = this.fromUTC(endUTC, tz);
    const is24Hour = this.is24HourFormat(tz);
    const timeFormat = is24Hour ? 'HH:mm' : 'h:mm A';
    return `${start.format(timeFormat)} - ${end.format(timeFormat)}`;
  }

  /**
   * Check if timezone uses 24-hour format
   */
  public is24HourFormat(timezone: string): boolean {
    // Use browser's actual locale settings instead of hardcoded timezone rules
    try {
      // Check if the browser uses 24-hour format by formatting a time
      const testTime = new Date('2023-01-01T13:00:00');
      const formatted = testTime.toLocaleTimeString(navigator.language, {
        hour12: false,
        timeZone: timezone,
      });

      // If the formatted time shows 13:00 (24-hour) instead of 1:00 PM (12-hour)
      // then the browser/locale prefers 24-hour format
      const uses24Hour =
        formatted.includes('13:00') || formatted.includes('13');

      return uses24Hour;
    } catch (error) {
      if (timezone.startsWith('America/')) {
        return false;
      }

      return true;
    }
  }

  /**
   * Validate IANA timezone string
   */
  public isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get timezone offset string (e.g., "+02:00", "-05:00")
   */
  public getTimezoneOffset(timezone?: string): string {
    const tz = timezone || this.getCurrentTimezone();
    return dayjs().tz(tz).format('Z');
  }

  /**
   * Create formatted timezone label
   */
  private createTimezoneLabel(timezone: string): string {
    try {
      const offset = this.getTimezoneOffset(timezone);
      const cityName =
        timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
      const region = timezone.split('/')[0] || '';

      // For UTC, use simple format
      if (timezone === 'UTC') {
        return `UTC ${offset}`;
      }

      return `${cityName} (${region}) ${offset}`;
    } catch (error) {
      return timezone;
    }
  }

  /**
   * Get all timezones - single comprehensive list with user's timezone highlighted
   */
  public getAllTimezones(): Array<{ value: string; label: string }> {
    // Return cached result if available
    if (this.cachedTimezones) {
      return this.cachedTimezones;
    }

    const browserTz = this.getBrowserTimezone();

    // Use our comprehensive list
    this.cachedTimezones = this.availableTimezones
      .filter(tz => this.isValidTimezone(tz))
      .map(timezone => ({
        value: timezone,
        label:
          timezone === browserTz
            ? `${this.createTimezoneLabel(timezone)} (Your timezone)`
            : this.createTimezoneLabel(timezone),
      }))
      .sort((a, b) => {
        // Put user's browser timezone first
        if (a.value === browserTz) return -1;
        if (b.value === browserTz) return 1;

        // Then UTC
        if (a.value === 'UTC') return -1;
        if (b.value === 'UTC') return 1;

        // Then sort by region, then by city name
        const aRegion = a.value.split('/')[0] || 'UTC';
        const bRegion = b.value.split('/')[0] || 'UTC';

        if (aRegion !== bRegion) {
          return aRegion.localeCompare(bRegion);
        }

        return a.label.localeCompare(b.label);
      });

    return this.cachedTimezones;
  }

  /**
   * Search timezones by city/region name
   */
  public searchTimezones(
    query: string
  ): Array<{ value: string; label: string }> {
    const allTimezones = this.getAllTimezones();
    const lowerQuery = query.toLowerCase();

    return allTimezones
      .filter(
        tz =>
          tz.label.toLowerCase().includes(lowerQuery) ||
          tz.value.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 20); // Limit results for performance
  }

  /**
   * Clear cached timezones (useful for testing or if timezone data changes)
   */
  public clearCache(): void {
    this.cachedTimezones = null;
  }

  /**
   * Creates a local datetime string from user input (date + time)
   */
  public createLocalDateTime(
    dateString: string,
    timeString: string,
    timezone: string
  ): string {
    const localDateTime = `${dateString}T${timeString}:00`;
    const localTime = dayjs.tz(localDateTime, timezone);
    const utcTime = localTime.utc();

    return utcTime.toISOString();
  }

  /**
   * Get total count of available timezones
   */
  public getTimezoneCount(): number {
    return this.availableTimezones.length;
  }

  /**
   * Get timezone statistics for debugging
   */
  public getTimezoneStats(): {
    total: number;
    browser: string;
    current: string;
  } {
    return {
      total: this.getTimezoneCount(),
      browser: this.getBrowserTimezone(),
      current: this.getCurrentTimezone(),
    };
  }
}

// Export singleton instance
export const timezoneService = TimezoneService.getInstance();
