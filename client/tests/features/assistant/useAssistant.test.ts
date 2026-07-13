import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../src/lib/api.js';
import { useAssistant } from '../../../src/features/assistant/useAssistant.js';
import type { VenueProfile } from '../../../src/lib/api-types.js';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAssistant', () => {
  it('ignores empty questions without calling the API', async () => {
    vi.spyOn(api, 'fetchVenueData').mockRejectedValue(new Error('fail silently'));
    const ask = vi.spyOn(api, 'askAssistant');
    const { result } = renderHook(() => useAssistant());

    await act(async () => {
      await result.current.ask('   ');
    });

    expect(ask).not.toHaveBeenCalled();
    expect(result.current.turns).toHaveLength(0);
  });

  it('falls back to a generic message when a non-ApiError is thrown', async () => {
    vi.spyOn(api, 'fetchVenueData').mockRejectedValue(new Error('fail silently'));
    vi.spyOn(api, 'askAssistant').mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAssistant());

    await act(async () => {
      await result.current.ask('Where is Gate 1?');
    });

    expect(result.current.error).toBe('The assistant is unavailable right now. Please try again.');
  });

  it('enters offline mode and serves offline response when navigator is offline', async () => {
    vi.spyOn(api, 'fetchVenueData').mockRejectedValue(new Error('fail silently'));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { result } = renderHook(() => useAssistant());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOffline).toBe(true);

    await act(async () => {
      await result.current.ask('Where is the gate?');
    });

    expect(result.current.turns).toHaveLength(2);
    expect(result.current.turns[1]!.text).toContain('Gates 1 to 6');
  });

  it('enters offline mode and serves offline response when api throws NETWORK error', async () => {
    vi.spyOn(api, 'fetchVenueData').mockRejectedValue(new Error('fail silently'));
    vi.spyOn(api, 'askAssistant').mockRejectedValue(new api.ApiError('NETWORK', 'Network failed'));
    const { result } = renderHook(() => useAssistant());

    await act(async () => {
      await result.current.ask('Where is the gate?');
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.turns).toHaveLength(2);
    expect(result.current.turns[1]!.text).toContain('Gates 1 to 6');
  });

  it('pre-caches venue data on mount when online', async () => {
    const venueMock = { name: 'Estadio Azteca', capacity: 100 } as unknown as VenueProfile;
    const fetchSpy = vi.spyOn(api, 'fetchVenueData').mockResolvedValue({ venue: venueMock });

    renderHook(() => useAssistant());

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
      expect(localStorage.getItem('arenaflow_venue_data_time')).not.toBeNull();
    });
  });

  it('handles online window events correctly', () => {
    vi.spyOn(api, 'fetchVenueData').mockRejectedValue(new Error('fail silently'));
    const { result } = renderHook(() => useAssistant());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOffline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOffline).toBe(false);
  });
});
