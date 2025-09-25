import React, { useState, useEffect } from 'react';
import {
  isValidPhoneNumber,
  AsYouType,
  getCountries,
  getCountryCallingCode,
} from 'libphonenumber-js';

interface PhoneNumberInputProps {
  value: string;
  onChange: (phoneNumber: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  defaultCountry?: string;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter phone number',
  className = '',
  error = '',
  defaultCountry = 'US',
}) => {
  const [formattedValue, setFormattedValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [countries] = useState(() => getCountries());

  // Update formatted value when country changes
  useEffect(() => {
    if (value) {
      const asYouType = new AsYouType(selectedCountry as any);
      const formatted = asYouType.input(value);
      setFormattedValue(formatted);
    }
  }, [selectedCountry, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Format the phone number as user types
    const asYouType = new AsYouType(selectedCountry as any);
    const formatted = asYouType.input(inputValue);
    setFormattedValue(formatted);

    // Validate the phone number
    const isValidNumber = isValidPhoneNumber(
      inputValue,
      selectedCountry as any
    );
    setIsValid(isValidNumber || inputValue === '');

    onChange(inputValue);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);

    if (value) {
      const asYouType = new AsYouType(newCountry as any);
      const formatted = asYouType.input(value);
      setFormattedValue(formatted);
    }
  };

  const handleBlur = () => {
    if (value && !isValidPhoneNumber(value, selectedCountry as any)) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  };

  const getCountryCode = (country: string) => {
    try {
      return getCountryCallingCode(country as any);
    } catch {
      return '1';
    }
  };

  const getCountryFlag = (country: string) => {
    const flagMap: Record<string, string> = {
      AD: '🇦🇩',
      AE: '🇦🇪',
      AF: '🇦🇫',
      AG: '🇦🇬',
      AI: '🇦🇮',
      AL: '🇦🇱',
      AM: '🇦🇲',
      AO: '🇦🇴',
      AQ: '🇦🇶',
      AR: '🇦🇷',
      AS: '🇦🇸',
      AT: '🇦🇹',
      AU: '🇦🇺',
      AW: '🇦🇼',
      AX: '🇦🇽',
      AZ: '🇦🇿',
      BA: '🇧🇦',
      BB: '🇧🇧',
      BD: '🇧🇩',
      BE: '🇧🇪',
      BF: '🇧🇫',
      BG: '🇧🇬',
      BH: '🇧🇭',
      BI: '🇧🇮',
      BJ: '🇧🇯',
      BL: '🇧🇱',
      BM: '🇧🇲',
      BN: '🇧🇳',
      BO: '🇧🇴',
      BQ: '🇧🇶',
      BR: '🇧🇷',
      BS: '🇧🇸',
      BT: '🇧🇹',
      BV: '🇧🇻',
      BW: '🇧🇼',
      BY: '🇧🇾',
      BZ: '🇧🇿',
      CA: '🇨🇦',
      CC: '🇨🇨',
      CD: '🇨🇩',
      CF: '🇨🇫',
      CG: '🇨🇬',
      CH: '🇨🇭',
      CI: '🇨🇮',
      CK: '🇨🇰',
      CL: '🇨🇱',
      CM: '🇨🇲',
      CN: '🇨🇳',
      CO: '🇨🇴',
      CR: '🇨🇷',
      CU: '🇨🇺',
      CV: '🇨🇻',
      CW: '🇨🇼',
      CX: '🇨🇽',
      CY: '🇨🇾',
      CZ: '🇨🇿',
      DE: '🇩🇪',
      DJ: '🇩🇯',
      DK: '🇩🇰',
      DM: '🇩🇲',
      DO: '🇩🇴',
      DZ: '🇩🇿',
      EC: '🇪🇨',
      EE: '🇪🇪',
      EG: '🇪🇬',
      EH: '🇪🇭',
      ER: '🇪🇷',
      ES: '🇪🇸',
      ET: '🇪🇹',
      FI: '🇫🇮',
      FJ: '🇫🇯',
      FK: '🇫🇰',
      FM: '🇫🇲',
      FO: '🇫🇴',
      FR: '🇫🇷',
      GA: '🇬🇦',
      GB: '🇬🇧',
      GD: '🇬🇩',
      GE: '🇬🇪',
      GF: '🇬🇫',
      GG: '🇬🇬',
      GH: '🇬🇭',
      GI: '🇬🇮',
      GL: '🇬🇱',
      GM: '🇬🇲',
      GN: '🇬🇳',
      GP: '🇬🇵',
      GQ: '🇬🇶',
      GR: '🇬🇷',
      GS: '🇬🇸',
      GT: '🇬🇹',
      GU: '🇬🇺',
      GW: '🇬🇼',
      GY: '🇬🇾',
      HK: '🇭🇰',
      HM: '🇭🇲',
      HN: '🇭🇳',
      HR: '🇭🇷',
      HT: '🇭🇹',
      HU: '🇭🇺',
      ID: '🇮🇩',
      IE: '🇮🇪',
      IL: '🇮🇱',
      IM: '🇮🇲',
      IN: '🇮🇳',
      IO: '🇮🇴',
      IQ: '🇮🇶',
      IR: '🇮🇷',
      IS: '🇮🇸',
      IT: '🇮🇹',
      JE: '🇯🇪',
      JM: '🇯🇲',
      JO: '🇯🇴',
      JP: '🇯🇵',
      KE: '🇰🇪',
      KG: '🇰🇬',
      KH: '🇰🇭',
      KI: '🇰🇮',
      KM: '🇰🇲',
      KN: '🇰🇳',
      KP: '🇰🇵',
      KR: '🇰🇷',
      KW: '🇰🇼',
      KY: '🇰🇾',
      KZ: '🇰🇿',
      LA: '🇱🇦',
      LB: '🇱🇧',
      LC: '🇱🇨',
      LI: '🇱🇮',
      LK: '🇱🇰',
      LR: '🇱🇷',
      LS: '🇱🇸',
      LT: '🇱🇹',
      LU: '🇱🇺',
      LV: '🇱🇻',
      LY: '🇱🇾',
      MA: '🇲🇦',
      MC: '🇲🇨',
      MD: '🇲🇩',
      ME: '🇲🇪',
      MF: '🇲🇫',
      MG: '🇲🇬',
      MH: '🇲🇭',
      MK: '🇲🇰',
      ML: '🇲🇱',
      MM: '🇲🇲',
      MN: '🇲🇳',
      MO: '🇲🇴',
      MP: '🇲🇵',
      MQ: '🇲🇶',
      MR: '🇲🇷',
      MS: '🇲🇸',
      MT: '🇲🇹',
      MU: '🇲🇺',
      MV: '🇲🇻',
      MW: '🇲🇼',
      MX: '🇲🇽',
      MY: '🇲🇾',
      MZ: '🇲🇿',
      NA: '🇳🇦',
      NC: '🇳🇨',
      NE: '🇳🇪',
      NF: '🇳🇫',
      NG: '🇳🇬',
      NI: '🇳🇮',
      NL: '🇳🇱',
      NO: '🇳🇴',
      NP: '🇳🇵',
      NR: '🇳🇷',
      NU: '🇳🇺',
      NZ: '🇳🇿',
      OM: '🇴🇲',
      PA: '🇵🇦',
      PE: '🇵🇪',
      PF: '🇵🇫',
      PG: '🇵🇬',
      PH: '🇵🇭',
      PK: '🇵🇰',
      PL: '🇵🇱',
      PM: '🇵🇲',
      PN: '🇵🇳',
      PR: '🇵🇷',
      PS: '🇵🇸',
      PT: '🇵🇹',
      PW: '🇵🇼',
      PY: '🇵🇾',
      QA: '🇶🇦',
      RE: '🇷🇪',
      RO: '🇷🇴',
      RS: '🇷🇸',
      RU: '🇷🇺',
      RW: '🇷🇼',
      SA: '🇸🇦',
      SB: '🇸🇧',
      SC: '🇸🇨',
      SD: '🇸🇩',
      SE: '🇸🇪',
      SG: '🇸🇬',
      SH: '🇸🇭',
      SI: '🇸🇮',
      SJ: '🇸🇯',
      SK: '🇸🇰',
      SL: '🇸🇱',
      SM: '🇸🇲',
      SN: '🇸🇳',
      SO: '🇸🇴',
      SR: '🇸🇷',
      SS: '🇸🇸',
      ST: '🇸🇹',
      SV: '🇸🇻',
      SX: '🇸🇽',
      SY: '🇸🇾',
      SZ: '🇸🇿',
      TC: '🇹🇨',
      TD: '🇹🇩',
      TF: '🇹🇫',
      TG: '🇹🇬',
      TH: '🇹🇭',
      TJ: '🇹🇯',
      TK: '🇹🇰',
      TL: '🇹🇱',
      TM: '🇹🇲',
      TN: '🇹🇳',
      TO: '🇹🇴',
      TR: '🇹🇷',
      TT: '🇹🇹',
      TV: '🇹🇻',
      TW: '🇹🇼',
      TZ: '🇹🇿',
      UA: '🇺🇦',
      UG: '🇺🇬',
      UM: '🇺🇲',
      US: '🇺🇸',
      UY: '🇺🇾',
      UZ: '🇺🇿',
      VA: '🇻🇦',
      VC: '🇻🇨',
      VE: '🇻🇪',
      VG: '🇻🇬',
      VI: '🇻🇮',
      VN: '🇻🇳',
      VU: '🇻🇺',
      WF: '🇼🇫',
      WS: '🇼🇸',
      YE: '🇾🇪',
      YT: '🇾🇹',
      ZA: '🇿🇦',
      ZM: '🇿🇲',
      ZW: '🇿🇼',
    };
    return flagMap[country] || '🌍';
  };

  return (
    <div className="relative">
      <div className="flex">
        <div className="flex items-center px-2 py-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="text-sm text-gray-700 bg-transparent border-none outline-none cursor-pointer min-w-0"
          >
            {countries.map(country => (
              <option key={country} value={country}>
                {getCountryFlag(country)} {country} (+{getCountryCode(country)})
              </option>
            ))}
          </select>
        </div>
        <input
          type="tel"
          value={formattedValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            error || !isValid
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : ''
          } ${className}`}
        />
      </div>

      {!isValid && value && (
        <p className="mt-1 text-sm text-red-600">
          Please enter a valid phone number for {selectedCountry}
        </p>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default PhoneNumberInput;
