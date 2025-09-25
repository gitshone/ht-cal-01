import React, { memo } from 'react';
import dayjs from 'dayjs';
import { Event } from '@ht-cal-01/shared-types';

interface YearViewProps {
  date: dayjs.Dayjs;
  events: { [key: string]: Event[] };
  onEventClick: (event: Event) => void;
  onDateClick: (date: string) => void;
  onNavigateToMonth: (month: dayjs.Dayjs) => void;
}

const YearView: React.FC<YearViewProps> = memo(
  ({ date, events, onEventClick, onDateClick, onNavigateToMonth }) => {
    const months = Array.from({ length: 12 }, (_, i) =>
      date.startOf('year').add(i, 'month')
    );

    return (
      <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Year Grid */}
        <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <div className="grid grid-cols-3 gap-6">
            {months.map(month => {
              const monthEvents = Object.keys(events)
                .filter(dateKey => dayjs(dateKey).isSame(month, 'month'))
                .reduce((acc, dateKey) => acc + events[dateKey].length, 0);

              return (
                <div
                  key={month.format('YYYY-MM')}
                  className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onNavigateToMonth(month)}
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {month.format('MMMM')}
                    </h3>
                    <div className="text-xl font-bold text-blue-600 mb-2">
                      {monthEvents}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

YearView.displayName = 'YearView';

export default YearView;
