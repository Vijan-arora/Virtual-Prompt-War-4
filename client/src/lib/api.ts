// Typed fetch wrapper. Every network call goes through here so error
// handling and JSON parsing are consistent across features.
import type {
  ApiErrorBody,
  AssistantAnswer,
  OpsBriefing,
  OpsSnapshot,
  SupportedLanguage,
  VenueProfile,
} from './api-types.js';

/** Error thrown for any non-2xx API response, carrying a display message. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const GENERIC_ERROR = 'The service is temporarily unavailable. Please try again.';

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }
  const { error } = value;
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    throw new ApiError('NETWORK', GENERIC_ERROR);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const { code, message } = isErrorBody(payload)
      ? payload.error
      : { code: 'UNKNOWN', message: GENERIC_ERROR };
    throw new ApiError(code, message);
  }
  return payload as T;
}

/** Asks the fan assistant a grounded question in the given language. */
export function askAssistant(
  question: string,
  language: SupportedLanguage,
): Promise<AssistantAnswer> {
  return request<AssistantAnswer>('/api/assistant/ask', {
    method: 'POST',
    body: JSON.stringify({ question, language }),
  });
}

/** Fetches the current operations snapshot. */
export function fetchSnapshot(): Promise<OpsSnapshot> {
  return request<OpsSnapshot>('/api/operations/snapshot');
}

/** Requests a freshly generated AI operations briefing. */
export function requestBriefing(): Promise<OpsBriefing> {
  return request<OpsBriefing>('/api/operations/briefing', { method: 'POST' });
}

/** Fetches the complete venue profile. */
export function fetchVenueData(): Promise<{ venue: VenueProfile }> {
  return request<{ venue: VenueProfile }>('/api/stadium/venue');
}
