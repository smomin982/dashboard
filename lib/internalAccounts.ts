// Edit these two lists to control who counts as "internal" (team + QA/test).
export const INTERNAL_DOMAINS: string[] = ['policycopilot.co'];
export const INTERNAL_EMAILS: string[] = [
  // 'qa-tester@gmail.com',  ← add real QA/test account emails here
];

export function emailDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf('@');
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

export function isInternal(
  email: string | null | undefined,
  domains: string[],
  emails: string[]
): boolean {
  const d = emailDomain(email);
  if (d && domains.map((x) => x.toLowerCase()).includes(d)) return true;
  if (email && emails.map((x) => x.toLowerCase()).includes(email.toLowerCase())) return true;
  return false;
}
