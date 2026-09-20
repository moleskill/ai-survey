import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'ai-survey-admin';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function credentials() {
  return {
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD,
  };
}

function sign(value, password) {
  return createHmac('sha256', password).update(value).digest('hex');
}

export function adminCredentialsAreConfigured() {
  const { email, password } = credentials();
  return Boolean(email && password);
}

export function verifyCredentials(email, password) {
  const expected = credentials();
  if (!expected.email || !expected.password || typeof email !== 'string' || typeof password !== 'string') {
    return false;
  }

  const emailMatches = email.trim().toLowerCase() === expected.email;
  const supplied = Buffer.from(password);
  const configured = Buffer.from(expected.password);
  const passwordMatches = supplied.length === configured.length && timingSafeEqual(supplied, configured);
  return emailMatches && passwordMatches;
}

export function createAdminSession() {
  const { password } = credentials();
  if (!password) throw new Error('ADMIN_PASSWORD is not configured');
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const value = `v1.${expiresAt}`;
  return { value: `${value}.${sign(value, password)}`, maxAge: SESSION_TTL_SECONDS };
}

export function hasValidAdminSession(token) {
  const { password } = credentials();
  if (!password || typeof token !== 'string') return false;
  const [version, expiresAt, signature, ...extra] = token.split('.');
  if (version !== 'v1' || !expiresAt || !signature || extra.length || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;
  const expected = sign(`${version}.${expiresAt}`, password);
  const actual = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}
