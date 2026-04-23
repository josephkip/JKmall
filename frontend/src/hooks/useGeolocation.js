import { useState, useEffect } from 'react';

export const useGeolocation = (enabled = false) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      return;
    }

    const handleSuccess = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    };

    const handleError = (err) => {
      setError(err.message);
    };

    const watcher = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    });

    return () => navigator.geolocation.clearWatch(watcher);
  }, [enabled]);

  return { location, error };
};
