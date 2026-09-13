import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/index.js';

/**
 * The server decides, not the interface. FR-030, constitution Principle VI.
 * T080.
 *
 * The song page shows the chatbot entry to Basic users marked PRO rather than
 * hiding it, so the request is one devtools visit away. Every assertion here
 * calls the route DIRECTLY, with no UI involved — because hiding a control has
 * never been a security boundary and this is the only test that proves it.
 */

const app = createApp();

const token = (plan: string, sub = 'u-test'): string =>
  jwt.sign({ sub, plan }, config.JWT_SECRET);

const asPlan = (plan: string) =>
  request(app).post('/api/chat/kun-faya-kun').set('Authorization', `Bearer ${token(plan)}`);

describe('gated routes refuse on the server', () => {
  it('refuses a Basic user with a machine-readable reason', async () => {
    const res = await asPlan('basic');
    expect(res.status).toBe(402);
    expect(res.body.reason).toBe('PRO_ONLY_FEATURE');
  });

  it('refuses a signed-out visitor', async () => {
    const res = await request(app).post('/api/chat/kun-faya-kun');
    expect(res.status).toBe(402);
    expect(res.body.reason).toBe('PRO_ONLY_FEATURE');
  });

  it('refuses a forged token rather than trusting its claim', async () => {
    // The plan claim is the obvious thing to tamper with — sign "pro" with the
    // wrong secret and see what happens.
    const forged = jwt.sign({ sub: 'u-test', plan: 'pro' }, 'not-the-real-secret');
    const res = await request(app)
      .post('/api/chat/kun-faya-kun')
      .set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(402);
  });

  it('refuses an unrecognised plan claim rather than assuming the best', async () => {
    // A validly signed token claiming a plan that does not exist degrades to
    // Basic. Anything else would make "plan: superuser" a free upgrade.
    const res = await asPlan('enterprise-unlimited');
    expect(res.status).toBe(402);
    expect(res.body.reason).toBe('PRO_ONLY_FEATURE');
  });

  it('lets a Pro user through to a feature that does not exist yet', async () => {
    // 501, not 402: they are entitled to something unbuilt. Answering anything
    // else would be pretending it exists.
    const res = await asPlan('pro');
    expect(res.status).toBe(501);
    expect(res.body.reason).toBe('NOT_IMPLEMENTED');
  });
});

describe('the viewer block reflects the plan', () => {
  it('gives a Basic user a quota and no chatbot', async () => {
    const res = await request(app)
      .get('/api/songs/kun-faya-kun?mode=en')
      .set('Authorization', `Bearer ${token('basic')}`);
    expect(res.body.viewer.plan).toBe('basic');
    expect(res.body.viewer.quota).not.toBeNull();
    expect(res.body.viewer.chatbotAvailable).toBe(false);
  });

  it('gives a Pro user the chatbot and no meter to show', async () => {
    const res = await request(app)
      .get('/api/songs/kun-faya-kun?mode=en')
      .set('Authorization', `Bearer ${token('pro')}`);
    expect(res.body.viewer.chatbotAvailable).toBe(true);
    expect(res.body.viewer.quota).toBeNull();
  });

  it('gives a signed-out visitor the page, and no viewer block', async () => {
    const res = await request(app).get('/api/songs/kun-faya-kun?mode=en');
    expect(res.status).toBe(200);
    expect(res.body.viewer).toBeNull();
  });
});
