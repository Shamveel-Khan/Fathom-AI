import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { User } from './types';
import { signSession, verifySession, SessionPayload } from './jwt';
import { userRepository } from '@/lib/repositories';

export const SESSION_COOKIE = 'fathom_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// -------------------------------------------------------
// Server-side session helpers (use in Route Handlers / Server Components)
// -------------------------------------------------------

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getSessionUserId(): Promise<string | null> {
  const payload = await getSessionPayload();
  return payload?.userId ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return userRepository.findById(userId);
}

/**
 * Use in Route Handlers where we have a NextRequest.
 * Reads and verifies the JWT from the cookie header.
 */
export async function getSessionPayloadFromRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getUserIdFromRequest(
  req: NextRequest
): Promise<string | null> {
  const payload = await getSessionPayloadFromRequest(req);
  return payload?.userId ?? null;
}


export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  const payload = await getSessionPayloadFromRequest(req);
  if (!payload) return null;
  return userRepository.findById(payload.userId);
}

// -------------------------------------------------------
// Cookie set / clear helpers — call from Route Handlers only
// -------------------------------------------------------

export async function setSessionCookie(
  userId: string,
  email: string
): Promise<void> {
  const token = await signSession({ userId, email });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
