import React from 'react';
import Navigation from '../components/Navigation';
import EventsList from '../components/EventsList';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Calendar Events Section */}
          <div className="bg-white rounded-lg shadow px-6 py-8">
            <EventsList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
