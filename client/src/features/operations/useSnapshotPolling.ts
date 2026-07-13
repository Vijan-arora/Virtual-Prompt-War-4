import { useEffect, useState } from 'react';

import { ApiError, fetchSnapshot } from '../../lib/api.js';
import type { OpsSnapshot } from '../../lib/api-types.js';
import { getOpsSnapshot, saveOpsSnapshot } from '../../lib/offline-store.js';

/** How often the dashboard re-fetches the live snapshot, in milliseconds. */
const SNAPSHOT_REFRESH_MS = 30_000;

interface UseSnapshotPollingResult {
  snapshot: OpsSnapshot | null;
  snapshotError: string | null;
  lastKnownTime: string | null;
}

function toMessage(caught: unknown, fallback: string): string {
  return caught instanceof ApiError ? caught.message : fallback;
}

/**
 * Loads the live operations snapshot on mount and re-polls it on an
 * interval while online, falling back to the last cached snapshot (and
 * flipping offline) if a fetch fails.
 */
export function useSnapshotPolling(
  isOffline: boolean,
  setIsOffline: (value: boolean) => void,
): UseSnapshotPollingResult {
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [lastKnownTime, setLastKnownTime] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const useCached = (): boolean => {
      const cached = getOpsSnapshot();
      if (!cached || !active) {
        return false;
      }
      setSnapshot(cached);
      setLastKnownTime(new Date(cached.generatedAt).toLocaleTimeString());
      return true;
    };

    const load = async (): Promise<void> => {
      if (isOffline) {
        useCached();
        return;
      }
      try {
        const next = await fetchSnapshot();
        if (active) {
          setSnapshot(next);
          saveOpsSnapshot(next);
          setSnapshotError(null);
          setLastKnownTime(new Date(next.generatedAt).toLocaleTimeString());
        }
      } catch (caught) {
        if (active && !useCached()) {
          setSnapshotError(toMessage(caught, 'Unable to load live operations data.'));
        } else if (active) {
          setIsOffline(true);
        }
      }
    };

    void load();
    const timer = setInterval(() => {
      if (!isOffline) {
        void load();
      }
    }, SNAPSHOT_REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isOffline, setIsOffline]);

  return { snapshot, snapshotError, lastKnownTime };
}
