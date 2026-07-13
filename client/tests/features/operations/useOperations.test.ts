import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../src/lib/api.js';
import { useOperations } from '../../../src/features/operations/useOperations.js';
import type { OpsBriefing, OpsSnapshot } from '../../../src/lib/api-types.js';

const SNAPSHOT: OpsSnapshot = {
  zones: [],
  incidents: [],
  sustainability: { wasteDivertedPct: 60, energyKwh: 1, waterRefillCount: 2, co2SavedKg: 3 },
  generatedAt: '2026-07-06T17:00:00.000Z',
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useOperations', () => {
  it('surfaces a generic message when the briefing fails without an ApiError', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);
    vi.spyOn(api, 'requestBriefing').mockRejectedValue(new Error('unexpected'));

    const { result } = renderHook(() => useOperations());

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    await act(async () => {
      await result.current.generateBriefing();
    });

    expect(result.current.briefingError).toBe('Unable to generate a briefing right now.');
  });

  it('should return early on generateBriefing if already loading', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);

    let resolveBriefing!: (value: OpsBriefing) => void;
    const briefingPromise = new Promise<OpsBriefing>((resolve) => {
      resolveBriefing = resolve;
    });
    const requestBriefingSpy = vi.spyOn(api, 'requestBriefing').mockReturnValue(briefingPromise);

    const { result } = renderHook(() => useOperations());

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    act(() => {
      void result.current.generateBriefing();
    });

    expect(result.current.isBriefingLoading).toBe(true);

    act(() => {
      void result.current.generateBriefing();
    });

    await act(async () => {
      resolveBriefing({ briefing: 'DONE', generatedAt: '2026-07-12' });
      await briefingPromise;
    });

    expect(requestBriefingSpy).toHaveBeenCalledTimes(1);
  });

  it('updates online/offline state via window events', () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);
    const { result } = renderHook(() => useOperations());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOffline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOffline).toBe(false);
  });

  it('loads cached snapshot when offline on mount', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    localStorage.setItem('arenaflow_ops_snapshot', JSON.stringify(SNAPSHOT));

    const { result } = renderHook(() => useOperations());
    expect(result.current.isOffline).toBe(true);
    await waitFor(() => {
      expect(result.current.snapshot).toEqual(SNAPSHOT);
    });
  });

  it('falls back to cache and sets offline if fetchSnapshot fails', async () => {
    localStorage.setItem('arenaflow_ops_snapshot', JSON.stringify(SNAPSHOT));
    vi.spyOn(api, 'fetchSnapshot').mockRejectedValue(new Error('API Down'));

    const { result } = renderHook(() => useOperations());
    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
      expect(result.current.snapshot).toEqual(SNAPSHOT);
    });
  });

  it('sets briefingError and returns early if generating briefing while offline', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);
    const { result } = renderHook(() => useOperations());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await act(async () => {
      await result.current.generateBriefing();
    });

    expect(result.current.briefingError).toBe('Unable to generate a briefing while offline.');
  });

  it('goes offline if requestBriefing throws a NETWORK ApiError', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);
    vi.spyOn(api, 'requestBriefing').mockRejectedValue(new api.ApiError('NETWORK', 'No net'));

    const { result } = renderHook(() => useOperations());
    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    await act(async () => {
      await result.current.generateBriefing();
    });

    expect(result.current.isOffline).toBe(true);
  });

  it('refetches automatically on interval when online', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);
    renderHook(() => useOperations());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
