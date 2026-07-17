import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeFirestore } from './helpers/fake-firestore.js';

const generateContentMock = vi.fn();
const fakeDb = new FakeFirestore();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

vi.mock('../src/lib/firestore.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/firestore.js')>();
  return { ...original, getFirestore: () => fakeDb.asFirestore() };
});

let app: Express;

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  const { ensureSeeded } = await import('../src/features/operations/service.js');
  app = buildApp();
  await ensureSeeded();
});

beforeEach(() => {
  generateContentMock.mockReset();
});

describe('GET /api/health', () => {
  it('reports ok with a version', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', version: expect.any(String) as string });
  });
});

describe('GET /.well-known/security.txt', () => {
  it('returns plain text RFC 9116 security policy info', async () => {
    const res = await request(app).get('/.well-known/security.txt');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/plain');
    expect(res.text).toContain('Contact: https://github.com/Vijan-arora');
    expect(res.text).toContain('Preferred-Languages: en');
  });
});

describe('GET /api/stadium/facilities', () => {
  it('returns all facilities without a filter', async () => {
    const res = await request(app).get('/api/stadium/facilities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.facilities)).toBe(true);
    expect(res.body.facilities.length).toBeGreaterThan(0);
  });

  it('filters by a valid category', async () => {
    const res = await request(app).get('/api/stadium/facilities?category=accessibility');
    expect(res.status).toBe(200);
    expect(
      res.body.facilities.every((f: { category: string }) => f.category === 'accessibility'),
    ).toBe(true);
  });

  it('rejects an unknown category with 400', async () => {
    const res = await request(app).get('/api/stadium/facilities?category=bogus');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('POST /api/assistant/ask', () => {
  it('returns a grounded answer for a valid question', async () => {
    generateContentMock.mockResolvedValue({ text: 'Gate 6 offers step-free access.' });
    const res = await request(app)
      .post('/api/assistant/ask')
      .send({ question: 'Where is the accessible entrance?', language: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.answer).toContain('Gate 6');
    expect(res.body.language).toBe('en');
  });

  it('rejects an empty question with 400', async () => {
    const res = await request(app).post('/api/assistant/ask').send({ question: '' });
    expect(res.status).toBe(400);
  });

  it('rejects unknown body keys with 400', async () => {
    const res = await request(app)
      .post('/api/assistant/ask')
      .send({ question: 'hi', role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('maps a Gemini outage to a sanitized 502', async () => {
    generateContentMock.mockRejectedValue(new Error('secret internal quota trace'));
    const res = await request(app)
      .post('/api/assistant/ask')
      .send({ question: 'A brand new question to dodge the cache', language: 'fr' });
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('quota');
  });
});

describe('operations endpoints', () => {
  it('GET /api/operations/snapshot returns zones, incidents and sustainability', async () => {
    const res = await request(app).get('/api/operations/snapshot');
    expect(res.status).toBe(200);
    expect(res.body.zones.length).toBeGreaterThan(0);
    expect(res.body.sustainability.wasteDivertedPct).toBeGreaterThan(0);
  });

  it('POST /api/operations/briefing generates an AI briefing', async () => {
    generateContentMock.mockResolvedValue({ text: 'TOP RISKS\n- South Concourse busy' });
    const res = await request(app).post('/api/operations/briefing');
    expect(res.status).toBe(200);
    expect(res.body.briefing).toContain('TOP RISKS');
  });
});

describe('unknown routes', () => {
  it('returns a 404 with a stable error shape', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
