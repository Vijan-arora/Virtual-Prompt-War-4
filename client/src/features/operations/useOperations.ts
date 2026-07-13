// State and side effects for the operations command center: loads the live
// snapshot on mount, refreshes it on an interval, and generates AI briefings
// on demand.
import { useCallback, useState } from 'react';

import { ApiError, requestBriefing } from '../../lib/api.js';
import type { OpsBriefing } from '../../lib/api-types.js';
import { useOnlineStatus } from '../../lib/use-online-status.js';
import { useSnapshotPolling } from './useSnapshotPolling.js';

interface UseOperationsResult {
  snapshot: ReturnType<typeof useSnapshotPolling>['snapshot'];
  snapshotError: string | null;
  briefing: OpsBriefing | null;
  isBriefingLoading: boolean;
  briefingError: string | null;
  generateBriefing: () => Promise<void>;
  isOffline: boolean;
  lastKnownTime: string | null;
}

function toMessage(caught: unknown, fallback: string): string {
  return caught instanceof ApiError ? caught.message : fallback;
}

/** Manages live snapshot polling and briefing generation for the dashboard. */
export function useOperations(): UseOperationsResult {
  const [briefing, setBriefing] = useState<OpsBriefing | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useOnlineStatus();
  const { snapshot, snapshotError, lastKnownTime } = useSnapshotPolling(isOffline, setIsOffline);

  const generateBriefing = useCallback(async (): Promise<void> => {
    if (isBriefingLoading) {
      return;
    }
    if (isOffline) {
      setBriefingError('Unable to generate a briefing while offline.');
      return;
    }
    setBriefingError(null);
    setIsBriefingLoading(true);
    try {
      setBriefing(await requestBriefing());
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'NETWORK') {
        setIsOffline(true);
      }
      setBriefingError(toMessage(caught, 'Unable to generate a briefing right now.'));
    } finally {
      setIsBriefingLoading(false);
    }
  }, [isBriefingLoading, isOffline, setIsOffline]);

  return {
    snapshot,
    snapshotError,
    briefing,
    isBriefingLoading,
    briefingError,
    generateBriefing,
    isOffline,
    lastKnownTime,
  };
}
