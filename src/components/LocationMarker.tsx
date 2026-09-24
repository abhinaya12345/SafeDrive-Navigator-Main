import React from 'react';
import { motion } from 'framer-motion';

interface LocationMarkerProps {
  type: 'current' | 'destination';
  size?: 'sm' | 'md' | 'lg';
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({ type, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  if (type === 'current') {
    return (
      <div className={`relative ${sizeClasses[size]}`}>
        <motion.div
          className="absolute inset-0 rounded-full bg-location-blue"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(59, 130, 246, 0.7)',
              '0 0 0 10px rgba(59, 130, 246, 0)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        <div className="absolute inset-0 rounded-full bg-location-blue shadow-lg" />
        <div className="absolute inset-1 rounded-full bg-white/30" />
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg viewBox="0 0 24 24" className="w-full h-full text-risk-high drop-shadow-lg">
        <path
          fill="currentColor"
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        />
      </svg>
    </div>
  );
};
