// State and side effects for the fan assistant conversation. Keeps the page
// component declarative: it renders whatever this hook exposes.
import { useCallback, useState } from 'react';

import { ApiError, askAssistant } from '../../lib/api.js';
import type { SupportedLanguage } from '../../lib/api-types.js';
import { getOfflineAssistantResponse } from '../../lib/offline-store.js';
import { useOnlineStatus } from '../../lib/use-online-status.js';
import { useCachedVenueTime } from './useCachedVenueTime.js';

/** A single turn in the assistant conversation. */
export interface ChatTurn {
  id: string;
  role: 'fan' | 'assistant';
  text: string;
  lang?: SupportedLanguage;
}

interface UseAssistantResult {
  turns: ChatTurn[];
  language: SupportedLanguage;
  isLoading: boolean;
  error: string | null;
  setLanguage: (language: SupportedLanguage) => void;
  ask: (question: string) => Promise<void>;
  isOffline: boolean;
  lastKnownTime: string | null;
}

function makeId(): string {
  return crypto.randomUUID();
}

/** Manages the assistant conversation, language selection and request state. */
export function useAssistant(): UseAssistantResult {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useOnlineStatus();
  const lastKnownTime = useCachedVenueTime(isOffline);

  const ask = useCallback(
    async (question: string): Promise<void> => {
      const trimmed = question.trim();
      if (trimmed === '' || isLoading) {
        return;
      }
      setError(null);
      setIsLoading(true);
      setTurns((prev) => [...prev, { id: makeId(), role: 'fan', text: trimmed, lang: language }]);

      if (isOffline) {
        await new Promise((r) => setTimeout(r, 300));
        const offlineText = getOfflineAssistantResponse(trimmed, language);
        setTurns((prev) => [
          ...prev,
          { id: makeId(), role: 'assistant', text: offlineText, lang: language },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        const result = await askAssistant(trimmed, language);
        setTurns((prev) => [
          ...prev,
          { id: makeId(), role: 'assistant', text: result.answer, lang: result.language },
        ]);
      } catch (caught) {
        if (caught instanceof ApiError && caught.code === 'NETWORK') {
          setIsOffline(true);
          const offlineText = getOfflineAssistantResponse(trimmed, language);
          setTurns((prev) => [
            ...prev,
            { id: makeId(), role: 'assistant', text: offlineText, lang: language },
          ]);
        } else {
          const message =
            caught instanceof ApiError
              ? caught.message
              : 'The assistant is unavailable right now. Please try again.';
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [language, isLoading, isOffline],
  );

  return { turns, language, isLoading, error, setLanguage, ask, isOffline, lastKnownTime };
}
