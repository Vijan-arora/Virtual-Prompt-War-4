import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getOfflineAssistantResponse,
  getOpsSnapshot,
  getVenueData,
  saveOpsSnapshot,
  saveVenueData,
} from '../../src/lib/offline-store.js';
import type { OpsSnapshot, VenueProfile } from '../../src/lib/api-types.js';

describe('offline-store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves venue data correctly', () => {
    const mockVenue = { name: 'Estadio Azteca Mock', capacity: 80000 } as unknown as VenueProfile;
    saveVenueData(mockVenue);
    expect(getVenueData()).toEqual(mockVenue);
  });

  it('falls back to default venue data if cache is empty', () => {
    const venue = getVenueData();
    expect(venue.name).toBe('Estadio Azteca');
    expect(venue.gates.length).toBe(6);
  });

  it('saves and retrieves operations snapshot correctly', () => {
    const mockSnapshot = {
      generatedAt: '2026-07-12T10:00:00Z',
      zones: [],
      incidents: [],
    } as unknown as OpsSnapshot;
    saveOpsSnapshot(mockSnapshot);
    expect(getOpsSnapshot()).toEqual(mockSnapshot);
  });

  it('returns null if there is no cached snapshot', () => {
    expect(getOpsSnapshot()).toBeNull();
  });

  it('handles localStorage throw errors on getVenueData, saveOpsSnapshot, and getOpsSnapshot', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    // Should fall back to default venue data
    const venue = getVenueData();
    expect(venue.name).toBe('Estadio Azteca');

    // Should fail silently
    saveOpsSnapshot({} as unknown as OpsSnapshot);

    // Should return null
    expect(getOpsSnapshot()).toBeNull();

    getSpy.mockRestore();
    setSpy.mockRestore();
  });

  describe('getOfflineAssistantResponse', () => {
    it('returns gates information for gate queries', () => {
      expect(getOfflineAssistantResponse('What gate should I use?', 'en')).toContain(
        'Gates 1 to 6',
      );
      expect(getOfflineAssistantResponse('بوابة', 'ar')).toContain('البوابات من 1 إلى 6');
      expect(getOfflineAssistantResponse('puerta', 'es')).toContain('puertas 1 a 6');
      expect(getOfflineAssistantResponse('porte', 'fr')).toContain('portes 1 à 6');
      expect(getOfflineAssistantResponse('portão', 'pt')).toContain('portões 1 a 6');
    });

    it('returns facilities information for food/water/prayer/family queries', () => {
      expect(getOfflineAssistantResponse('Where can I get water?', 'en')).toContain('Food Courts');
      expect(getOfflineAssistantResponse('comida', 'es')).toContain('áreas de comida');
      expect(getOfflineAssistantResponse('طعام', 'ar')).toContain('صالات طعام');
      expect(getOfflineAssistantResponse('nourriture', 'fr')).toContain('restaurants');
      expect(getOfflineAssistantResponse('refeição', 'pt')).toContain('alimentação');
    });

    it('returns transit information for metro/transport/shuttle queries', () => {
      expect(getOfflineAssistantResponse('How to take metro?', 'en')).toContain('Tren Ligero');
      expect(getOfflineAssistantResponse('مترو', 'ar')).toContain('القطار الخفيف');
      expect(getOfflineAssistantResponse('autobús', 'es')).toContain('Tren Ligero');
      expect(getOfflineAssistantResponse('shuttle', 'fr')).toContain('Tren Ligero');
      expect(getOfflineAssistantResponse('ônibus', 'pt')).toContain('Tren Ligero');
    });

    it('returns accessibility information for wheelchair/mobility queries', () => {
      expect(getOfflineAssistantResponse('wheelchair access', 'en')).toContain('Step-free gates');
      expect(getOfflineAssistantResponse('accesible', 'es')).toContain('puertas accesibles');
      expect(getOfflineAssistantResponse('كرسي', 'ar')).toContain('المدرج الغربي');
      expect(getOfflineAssistantResponse('fauteuil', 'fr')).toContain('tribune ouest');
      expect(getOfflineAssistantResponse('cadeira', 'pt')).toContain('arquibancada oeste');
    });

    it('returns default guidelines for unmatched queries', () => {
      expect(getOfflineAssistantResponse('Hello!', 'en')).toContain('Guest Services Desks');
    });
  });
});
