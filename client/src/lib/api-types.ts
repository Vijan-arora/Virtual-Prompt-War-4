// Response shapes returned by the ArenaFlow API. Kept in sync with the
// server feature types; the client only depends on the fields it renders.

/** Languages the fan assistant supports. */
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'pt' | 'ar';

/** Answer returned by POST /api/assistant/ask. */
export interface AssistantAnswer {
  answer: string;
  language: SupportedLanguage;
  cached: boolean;
}

/** Crowd-management status for a zone. */
export type ZoneStatus = 'comfortable' | 'busy' | 'critical';

/** A stadium zone with derived density, from the operations snapshot. */
export interface ZoneOccupancy {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  densityPct: number;
  status: ZoneStatus;
}

/** An operational incident. */
export interface Incident {
  id: string;
  zoneId: string;
  category: 'crowd' | 'medical' | 'facility' | 'security';
  severity: 'low' | 'medium' | 'high';
  summary: string;
  status: 'open' | 'resolved';
  reportedAt: string;
}

/** Venue sustainability counters. */
export interface SustainabilityMetrics {
  wasteDivertedPct: number;
  energyKwh: number;
  waterRefillCount: number;
  co2SavedKg: number;
}

/** Full operations snapshot from GET /api/operations/snapshot. */
export interface OpsSnapshot {
  zones: ZoneOccupancy[];
  incidents: Incident[];
  sustainability: SustainabilityMetrics;
  generatedAt: string;
}

/** AI operations briefing from POST /api/operations/briefing. */
export interface OpsBriefing {
  briefing: string;
  generatedAt: string;
}

/** Error body shape returned by the API on failure. */
export interface ApiErrorBody {
  error: { code: string; message: string };
}

/** A named entry gate with the stands it serves. */
export interface Gate {
  id: string;
  name: string;
  serves: string;
  accessible: boolean;
}

/** A guest-facing facility inside the stadium. */
export interface Facility {
  id: string;
  name: string;
  category: string;
  location: string;
  accessible: boolean;
  details: string;
}

/** A way to reach or leave the stadium. */
export interface TransitRoute {
  id: string;
  mode: string;
  name: string;
  guidance: string;
  accessible: boolean;
}

/** The full static venue description used for assistant grounding, from
 *  GET /api/stadium/venue. This is the single source of truth for the
 *  shape — other modules should import it rather than redeclaring it. */
export interface VenueProfile {
  name: string;
  city: string;
  tournament: string;
  capacity: number;
  gates: Gate[];
  facilities: Facility[];
  transit: TransitRoute[];
}
