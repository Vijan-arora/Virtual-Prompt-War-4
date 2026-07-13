import { useEffect, useState } from 'react';

/**
 * Tracks browser connectivity via the `online`/`offline` window events.
 * Returns the current offline flag and a setter, so callers can also force
 * offline mode themselves (e.g. after a request fails with a network error).
 */
export function useOnlineStatus(): [boolean, (value: boolean) => void] {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOffline(false);
    };
    const handleOffline = (): void => {
      setIsOffline(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return [isOffline, setIsOffline];
}
