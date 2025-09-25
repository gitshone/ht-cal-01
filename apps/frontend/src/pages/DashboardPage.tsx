import React from 'react';
import Navigation from '../components/Navigation';
import UnifiedCalendarView from '../components/UnifiedCalendarView';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Unified Calendar View */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-[calc(100vh-200px)] overflow-hidden">
            <UnifiedCalendarView />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
