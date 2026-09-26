import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { User } from './types';
import { userRepository } from '@/lib/repositories';

const SESSION_COOKIE = 'fathom_session_user_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// -------------------------------------------------------
// Server-side session helpers (use in Route Handlers / Server Components)
// -------------------------------------------------------

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return userRepository.findById(userId);
}

/**
 * Use in Route Handlers where we have a NextRequest.
 * Avoids the need to call cookies() from the dynamic context.
 */
export function getUserIdFromRequest(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE)?.value ?? null;
}

export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return null;
  return userRepository.findById(userId);
}

// -------------------------------------------------------
// Cookie set / clear helpers — call from Route Handlers only
// -------------------------------------------------------

export async function setSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
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
