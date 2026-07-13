import { useEffect, useState } from 'react';

import { fetchVenueData } from '../../lib/api.js';
import { saveVenueData } from '../../lib/offline-store.js';

const STORAGE_KEY = 'arenaflow_venue_data_time';

/**
 * While online, fetches the full venue profile in the background and caches
 * it for offline fallback. Returns when that cache was last refreshed, so
 * the UI can show fans how fresh the offline data is.
 */
export function useCachedVenueTime(isOffline: boolean): string | null {
  const [lastKnownTime, setLastKnownTime] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );

  useEffect(() => {
    if (isOffline) {
      return;
    }
    fetchVenueData()
      .then((res) => {
        saveVenueData(res.venue);
        const nowStr = new Date().toLocaleTimeString();
        localStorage.setItem(STORAGE_KEY, nowStr);
        setLastKnownTime(nowStr);
      })
      .catch(() => {
        // Ignore background fetch error; the assistant falls back to
        // whatever venue data is already cached.
      });
  }, [isOffline]);

  return lastKnownTime;
}
