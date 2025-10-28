import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'primary', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'border-primary',
    accent: 'border-accent',
    white: 'border-white'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} ${className}`}></div>
  );
};

export const LoadingScreen = ({ message = 'Loading...', className = '' }) => (
  <div className={`flex flex-col items-center justify-center min-h-[200px] space-y-4 ${className}`}>
    <LoadingSpinner size="large" />
    <p className="text-text-muted">{message}</p>
  </div>
);

export const LoadingCard = ({ className = '' }) => (
  <div className={`bg-card rounded-lg p-6 space-y-4 ${className}`}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-600 rounded w-1/2"></div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-600 rounded"></div>
      <div className="h-3 bg-gray-600 rounded w-5/6"></div>
    </div>
  </div>
);

export const LoadingGrid = ({ items = 6, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <LoadingCard key={index} />
    ))}
  </div>
);

export default LoadingSpinner;