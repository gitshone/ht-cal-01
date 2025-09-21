import React from 'react';
import Navigation from '../components/Navigation';
import SettingsList from '../components/SettingsList';

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Settings Section */}
          <div className="bg-white rounded-lg shadow px-6 py-8">
            <SettingsList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
