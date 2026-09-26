import { NextRequest, NextResponse } from 'next/server';
import {
  buildAuthorizationUrl,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from '@/lib/auth/oauth';

const VERIFIER_COOKIE = 'oauth_code_verifier';
const STATE_COOKIE = 'oauth_state';
const COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export async function GET(_request: NextRequest) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  let authUrl: string;
  try {
    authUrl = buildAuthorizationUrl(state, codeChallenge);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OAuth configuration error.';
    console.error('/api/auth/google error:', message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, _request.url)
    );
  }

  const response = NextResponse.redirect(authUrl);

  // Store PKCE verifier and state in short-lived HTTP-only cookies
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
  response.cookies.set(VERIFIER_COOKIE, codeVerifier, cookieOpts);
  response.cookies.set(STATE_COOKIE, state, cookieOpts);

  return response;
}
