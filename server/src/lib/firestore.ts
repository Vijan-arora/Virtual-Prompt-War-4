// Firestore access. The client is created once at module scope and reused
// across requests; in production it authenticates via the attached service account.
import { Firestore } from '@google-cloud/firestore';

import { env } from '../config/env.js';
import { FakeFirestore } from './firestore-fake.js';
import { logger } from './logger.js';

/** Firestore collection names used by the operations feature. */
export const COLLECTIONS = {
  zones: 'zones',
  incidents: 'incidents',
  sustainability: 'sustainability',
} as const;

/** Document id of the single sustainability metrics document. */
export const SUSTAINABILITY_DOC_ID = 'current';

let client: Firestore | undefined;

/** Returns the shared Firestore client, creating it on first use. */
export function getFirestore(): Firestore {
  if (env.USE_FAKE_FIRESTORE) {
    if (!client) {
      logger.info('Using fake in-memory Firestore database for local development');
      client = new FakeFirestore().asFirestore();
    }
    return client;
  }
  client ??= new Firestore();
  return client;
}
