import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
// In-memory fixture database: resets when the process restarts.
const password = 'Practice-only-123!';
const salt = randomBytes(16);
const passwordHash = scryptSync(password, salt, 64);
export const users = [
  { id: 'alice', email: 'alice@alpha.test', tenantId: 'alpha', role: 'member', active: true },
  { id: 'bob', email: 'bob@alpha.test', tenantId: 'alpha', role: 'member', active: true },
  { id: 'vera', email: 'vera@alpha.test', tenantId: 'alpha', role: 'viewer', active: true },
  { id: 'ada', email: 'ada@alpha.test', tenantId: 'alpha', role: 'admin', active: true },
  { id: 'ben', email: 'ben@beta.test', tenantId: 'beta', role: 'admin', active: true },
  { id: 'disabled', email: 'disabled@alpha.test', tenantId: 'alpha', role: 'member', active: false },
];
export const documents = [
  { id: 'doc-alice', tenantId: 'alpha', ownerId: 'alice', title: 'Alice budget' },
  { id: 'doc-bob', tenantId: 'alpha', ownerId: 'bob', title: 'Bob report' },
  { id: 'doc-vera', tenantId: 'alpha', ownerId: 'vera', title: 'Vera notes' },
  { id: 'doc-beta', tenantId: 'beta', ownerId: 'ben', title: 'Beta confidential' },
];
export const sessions = new Map();
export const tokenDigest = token => createHash('sha256').update(token).digest('hex');
export function issueSession(userId, ttlMs = 30 * 60 * 1000) {
  const token = randomBytes(32).toString('hex');
  sessions.set(tokenDigest(token), { userId, expiresAt: Date.now() + ttlMs, revoked: false });
  return token;
}
export function revokeSession(token) {
  const session = sessions.get(tokenDigest(token));
  if (session) session.revoked = true;
}
export function verifyPassword(candidate) {
  return typeof candidate === 'string' && candidate.length <= 256 &&
    timingSafeEqual(scryptSync(candidate, salt, 64), passwordHash);
}
