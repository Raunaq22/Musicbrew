import React, { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      setRegistration(registration);
      setIsRegistered(true);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });

      console.log('MusicBrew Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    isSupported,
    isRegistered,
    registration,
    updateAvailable,
    updateServiceWorker
  };
};

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor Core Web Vitals
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(setMetrics);
        getFID(setMetrics);
        getFCP(setMetrics);
        getLCP(setMetrics);
        getTTFB(setMetrics);
      });
    }
  }, []);

  const { isSupported, isRegistered, updateAvailable, updateServiceWorker } = useServiceWorker();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-primary text-white px-3 py-2 rounded-lg text-xs font-mono"
      >
        🚀 Perf
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-card border border-gray-600 rounded-lg p-4 w-80 text-xs font-mono">
          <h3 className="font-bold mb-2 text-text-light">Performance Metrics</h3>
          
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="flex justify-between mb-1">
              <span className="text-text-muted">{key}:</span>
              <span className="text-text-light">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </span>
            </div>
          ))}

          <div className="border-t border-gray-600 mt-2 pt-2">
            <h4 className="font-bold mb-1 text-text-light">Service Worker</h4>
            <div className="flex justify-between mb-1">
              <span className="text-text-muted">Supported:</span>
              <span className="text-text-light">{isSupported ? '✅' : '❌'}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-text-muted">Registered:</span>
              <span className="text-text-light">{isRegistered ? '✅' : '❌'}</span>
            </div>
            {updateAvailable && (
              <button
                onClick={updateServiceWorker}
                className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
              >
                Update Available - Click to Refresh
              </button>
            )}
          </div>

          <div className="border-t border-gray-600 mt-2 pt-2">
            <h4 className="font-bold mb-1 text-text-light">Network Info</h4>
            <div className="flex justify-between mb-1">
              <span className="text-text-muted">Connection:</span>
              <span className="text-text-light">
                {navigator.connection?.effectiveType || 'unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Online:</span>
              <span className="text-text-light">
                {navigator.onLine ? '✅' : '❌'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="w-full mt-2 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection type
    if ('connection' in navigator) {
      setConnectionType(navigator.connection.effectiveType);
      
      navigator.connection.addEventListener('change', () => {
        setConnectionType(navigator.connection.effectiveType);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className="fixed top-16 left-0 right-0 bg-yellow-600 text-white px-4 py-2 text-center text-sm z-40">
      📡 You're offline. Some features may be limited.
      {connectionType !== '4g' && connectionType !== 'wifi' && (
        <span className="ml-2">Connection: {connectionType}</span>
      )}
    </div>
  );
};

export default {
  useServiceWorker,
  PerformanceMonitor,
  NetworkStatus
};