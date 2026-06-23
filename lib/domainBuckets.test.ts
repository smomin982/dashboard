import { describe, it, expect } from 'vitest';
import { bucketForDomain, BUCKET_ORDER } from './domainBuckets';

describe('bucketForDomain', () => {
  it('classifies government domains', () => {
    expect(bucketForDomain('treasury.gov')).toBe('Government');
    expect(bucketForDomain('finance.gov.ng')).toBe('Government');
    expect(bucketForDomain('education.go.ke')).toBe('Government');
  });
  it('classifies academic domains', () => {
    expect(bucketForDomain('mit.edu')).toBe('Academic');
    expect(bucketForDomain('ox.ac.uk')).toBe('Academic');
  });
  it('classifies known multilateral/NGO domains', () => {
    expect(bucketForDomain('worldbank.org')).toBe('Multilateral / NGO');
    expect(bucketForDomain('undp.org')).toBe('Multilateral / NGO');
  });
  it('classifies personal providers', () => {
    expect(bucketForDomain('gmail.com')).toBe('Personal');
    expect(bucketForDomain('outlook.com')).toBe('Personal');
  });
  it('falls back to Other org email for custom domains', () => {
    expect(bucketForDomain('acme-consulting.com')).toBe('Other org email');
  });
  it('handles unknown/empty as Unknown', () => {
    expect(bucketForDomain(null)).toBe('Unknown');
    expect(bucketForDomain('')).toBe('Unknown');
  });
  it('BUCKET_ORDER includes every bucket it can return', () => {
    ['Government','Academic','Multilateral / NGO','Other org email','Personal','Unknown']
      .forEach((b) => expect(BUCKET_ORDER).toContain(b));
  });
});
