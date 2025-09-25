import React from 'react';

interface SliderToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

const SliderToggle: React.FC<SliderToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {label && (
          <div className="text-sm font-medium text-gray-700">{label}</div>
        )}
        {description && (
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked
            ? 'bg-blue-600 shadow-lg shadow-blue-600/30'
            : 'bg-gray-200 hover:bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default SliderToggle;
