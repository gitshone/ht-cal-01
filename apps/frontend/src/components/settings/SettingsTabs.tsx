import React from 'react';

interface SettingsTabsProps {
  activeTab: 'general' | 'availability' | 'invite';
  onTabChange: (tab: 'general' | 'availability' | 'invite') => void;
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('general')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'general'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          General
        </button>
        <button
          onClick={() => onTabChange('availability')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'availability'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Availability
        </button>
        <button
          onClick={() => onTabChange('invite')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'invite'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Invite Customization
        </button>
      </nav>
    </div>
  );
};

export default SettingsTabs;
