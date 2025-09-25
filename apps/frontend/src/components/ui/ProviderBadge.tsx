import React from 'react';

interface ProviderBadgeProps {
  providerType?: string | null;
  meetingType?: string | null;
  meetingUrl?: string | null;
  className?: string;
}

const ProviderBadge: React.FC<ProviderBadgeProps> = ({
  providerType,
  meetingType,
  meetingUrl,
  className = '',
}) => {
  if (!providerType) return null;

  const getProviderInfo = () => {
    switch (providerType.toLowerCase()) {
      case 'google':
        return {
          name: 'Google Calendar',
          icon: (
            <img
              src="/provider-icons/google.png"
              alt="Google Calendar"
              className="w-3 h-3"
            />
          ),
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'microsoft':
        return {
          name: 'Microsoft Teams',
          icon: (
            <img
              src="/provider-icons/teams.png"
              alt="Microsoft Teams"
              className="w-3 h-3"
            />
          ),
          color: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'zoom':
        return {
          name: 'Zoom',
          icon: (
            <img
              src="/provider-icons/zoom.png"
              alt="Zoom"
              className="w-3 h-3"
            />
          ),
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      default:
        return {
          name: providerType,
          icon: (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ),
          color: 'bg-gray-50 text-gray-700 border-gray-200',
        };
    }
  };

  const getMeetingTypeInfo = () => {
    if (!meetingType) return null;

    switch (meetingType.toLowerCase()) {
      case 'video_call':
        return {
          name: 'Video Call',
          icon: (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          ),
        };
      case 'phone_call':
        return {
          name: 'Phone Call',
          icon: (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          ),
        };
      case 'in_person':
        return {
          name: 'In Person',
          icon: (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          ),
        };
      default:
        return {
          name: meetingType,
          icon: (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ),
        };
    }
  };

  const providerInfo = getProviderInfo();
  const meetingInfo = getMeetingTypeInfo();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Provider Badge */}
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${providerInfo.color}`}
      >
        {providerInfo.icon}
        <span className="ml-1">{providerInfo.name}</span>
      </span>

      {/* Meeting Type Badge */}
      {meetingInfo && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          {meetingInfo.icon}
          <span className="ml-1">{meetingInfo.name}</span>
        </span>
      )}

      {/* Meeting Link Indicator */}
      {meetingUrl && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.59 13.41c.41.39.41 1.03 0 1.42-.39.39-1.03.39-1.42 0a5.003 5.003 0 0 1 0-7.07l3.54-3.54a5.003 5.003 0 0 1 7.07 0 5.003 5.003 0 0 1 0 7.07l-1.49 1.49c.01-.82-.12-1.64-.4-2.42l.47-.48a2.982 2.982 0 0 0 0-4.24 2.982 2.982 0 0 0-4.24 0l-3.53 3.53a2.982 2.982 0 0 0 0 4.24zm2.82-4.24c.39-.39 1.03-.39 1.42 0a5.003 5.003 0 0 1 0 7.07l-3.54 3.54a5.003 5.003 0 0 1-7.07 0 5.003 5.003 0 0 1 0-7.07l1.49-1.49c-.01.82.12 1.64.4 2.42l-.47.48a2.982 2.982 0 0 0 0 4.24 2.982 2.982 0 0 0 4.24 0l3.53-3.53a2.982 2.982 0 0 0 0-4.24z" />
          </svg>
          <span className="ml-1">Link</span>
        </span>
      )}
    </div>
  );
};

export default ProviderBadge;
