import { describe, it, expect } from 'vitest';
import { emailDomain, isInternal, INTERNAL_DOMAINS } from './internalAccounts';

describe('emailDomain', () => {
  it('extracts and lowercases the domain', () => {
    expect(emailDomain('Jane@PolicyCopilot.co')).toBe('policycopilot.co');
  });
  it('returns null for missing/garbage', () => {
    expect(emailDomain(null)).toBeNull();
    expect(emailDomain('nope')).toBeNull();
  });
});

describe('isInternal', () => {
  it('flags configured internal domains', () => {
    expect(isInternal('dev@policycopilot.co', INTERNAL_DOMAINS, [])).toBe(true);
  });
  it('flags explicit test emails (case-insensitive)', () => {
    expect(isInternal('QA1@gmail.com', [], ['qa1@gmail.com'])).toBe(true);
  });
  it('treats real external users as not internal', () => {
    expect(isInternal('analyst@worldbank.org', INTERNAL_DOMAINS, [])).toBe(false);
  });
  it('treats null email as not internal', () => {
    expect(isInternal(null, INTERNAL_DOMAINS, [])).toBe(false);
  });
});
