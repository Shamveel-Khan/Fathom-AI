import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, fetchGoogleUserInfo } from '@/lib/auth/oauth';
import { userRepository } from '@/lib/repositories';
import { signSession } from '@/lib/auth/jwt';
import { SESSION_COOKIE } from '@/lib/auth/session';

const VERIFIER_COOKIE = 'oauth_code_verifier';
const STATE_COOKIE = 'oauth_state';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const loginRedirect = (error: string) =>
    NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );

  if (errorParam) {
    return loginRedirect(errorParam);
  }

  if (!code || !state) {
    return loginRedirect('Missing OAuth code or state parameter.');
  }

  const storedVerifier = request.cookies.get(VERIFIER_COOKIE)?.value;
  const storedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!storedVerifier || !storedState) {
    return loginRedirect('OAuth session expired. Please try again.');
  }

  if (state !== storedState) {
    return loginRedirect('Invalid OAuth state. Possible CSRF attack.');
  }

  try {
    const accessToken = await exchangeCodeForTokens(code, storedVerifier);
    const googleUser = await fetchGoogleUserInfo(accessToken);

    const user = await userRepository.findOrCreateOAuthUser('google', googleUser.sub, {
      sub: googleUser.sub,
      name: googleUser.name,
      email: googleUser.email,
      picture: googleUser.picture,
    });

    const token = await signSession({ userId: user.id, email: user.email });
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    // Set JWT session cookie directly on the redirect response
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    // Clean up PKCE cookies
    response.cookies.delete(VERIFIER_COOKIE);
    response.cookies.delete(STATE_COOKIE);

    return response;
  } catch (err) {
    console.error('/api/auth/callback/google error:', err);
    const message = err instanceof Error ? err.message : 'Google authentication failed.';
    return loginRedirect(message);
  }
}

