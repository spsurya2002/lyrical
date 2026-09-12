import { describe, expect, it } from 'vitest';
import {
  ANONYMOUS_VIEWER,
  getEntitlements,
  refuseChatbot,
  refuseExport,
  type Viewer,
} from '../../src/domain/entitlements.js';

const basic = (overrides: Partial<Viewer> = {}): Viewer => ({
  userId: 'u1',
  plan: 'basic',
  researchUsedThisMonth: 0,
  librarySavedCount: 0,
  ...overrides,
});

const pro = (overrides: Partial<Viewer> = {}): Viewer => basic({ plan: 'pro', ...overrides });

describe('getEntitlements — Basic', () => {
  it('gets a monthly research allowance and a visible meter', () => {
    const e = getEntitlements(basic());
    expect(e.researchLimit).toBe(5);
    expect(e.researchRemaining).toBe(5);
    expect(e.showQuotaMeter).toBe(true);
  });

  it('counts down as research is used', () => {
    expect(getEntitlements(basic({ researchUsedThisMonth: 2 })).researchRemaining).toBe(3);
  });

  it('reports zero, never a negative allowance', () => {
    // A mid-month plan change can leave usage above the limit. "-2 left" is
    // nonsense to a reader.
    expect(getEntitlements(basic({ researchUsedThisMonth: 7 })).researchRemaining).toBe(0);
  });

  it('does not get the chatbot or export', () => {
    const e = getEntitlements(basic());
    expect(e.chatbotAvailable).toBe(false);
    expect(e.exportAvailable).toBe(false);
  });

  it('has a library cap', () => {
    expect(getEntitlements(basic()).libraryLimit).toBe(20);
  });
});

describe('getEntitlements — Pro', () => {
  it('has unlimited research and no meter to show', () => {
    const e = getEntitlements(pro());
    expect(e.researchLimit).toBeNull();
    expect(e.researchRemaining).toBeNull();
    expect(e.showQuotaMeter).toBe(false);
  });

  it('gets the chatbot and export', () => {
    const e = getEntitlements(pro());
    expect(e.chatbotAvailable).toBe(true);
    expect(e.exportAvailable).toBe(true);
  });

  it('stays unlimited regardless of usage', () => {
    expect(getEntitlements(pro({ researchUsedThisMonth: 900 })).researchRemaining).toBeNull();
  });
});

describe('getEntitlements — signed out', () => {
  it('can still read, but gets no meter and no gated features', () => {
    const e = getEntitlements(ANONYMOUS_VIEWER);
    expect(e.plan).toBe('anonymous');
    expect(e.showQuotaMeter).toBe(false);
    expect(e.chatbotAvailable).toBe(false);
  });

  it('is its own cache class, so a signed-out response is never served to a member', () => {
    expect(getEntitlements(ANONYMOUS_VIEWER).viewerClass).toBe('anon');
    expect(getEntitlements(basic()).viewerClass).toBe('basic');
    expect(getEntitlements(pro()).viewerClass).toBe('pro');
  });
});

describe('refusals carry a machine-readable reason', () => {
  it('refuses the chatbot for Basic and anonymous', () => {
    expect(refuseChatbot(getEntitlements(basic()))).toBe('PRO_ONLY_FEATURE');
    expect(refuseChatbot(getEntitlements(ANONYMOUS_VIEWER))).toBe('PRO_ONLY_FEATURE');
  });

  it('allows the chatbot for Pro', () => {
    expect(refuseChatbot(getEntitlements(pro()))).toBeNull();
  });

  it('refuses export for Basic and allows it for Pro', () => {
    expect(refuseExport(getEntitlements(basic()))).toBe('PRO_ONLY_FEATURE');
    expect(refuseExport(getEntitlements(pro()))).toBeNull();
  });
});
