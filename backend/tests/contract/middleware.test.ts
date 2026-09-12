import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/index.js';

const app = createApp();

describe('optionalAuth — signed-out visitors must get through', () => {
  it('serves a request with no Authorization header', async () => {
    // The failure this guards: making auth required locks out every signed-out
    // visitor from reading song pages, which R-09 explicitly allows.
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('serves a request with a malformed Authorization header', async () => {
    const res = await request(app).get('/health').set('Authorization', 'Basic nonsense');
    expect(res.status).toBe(200);
  });

  it('serves a request with a forged token rather than rejecting it', async () => {
    const forged = jwt.sign({ sub: 'u1', plan: 'pro' }, 'not-the-real-secret');
    const res = await request(app).get('/health').set('Authorization', `Bearer ${forged}`);
    // Treated as no token at all: the visitor reads the page, unsigned-in.
    expect(res.status).toBe(200);
  });

  it('accepts a validly signed token', async () => {
    const token = jwt.sign({ sub: 'u1', plan: 'pro' }, config.JWT_SECRET);
    const res = await request(app).get('/health').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('error handling', () => {
  it('answers an unknown path with 404 JSON, not an HTML stack trace', async () => {
    const res = await request(app).get('/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not found' });
  });
});

describe('hardening', () => {
  it('does not advertise the framework', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
