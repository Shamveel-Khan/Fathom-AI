import crypto from 'crypto';

export interface GoogleUserInfo {
  sub: string;         // Google's unique user ID
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
}

// -------------------------------------------------------
// PKCE helpers
// -------------------------------------------------------

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

// -------------------------------------------------------
// OAuth URLs & token exchange
// -------------------------------------------------------

export function buildAuthorizationUrl(
  state: string,
  codeChallenge: string
): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      'GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI must be set in environment.'
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'online',
    prompt: 'select_account',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI must be set.'
    );
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${body}`);
  }

  const data = await res.json() as { access_token?: string };
  if (!data.access_token) {
    throw new Error('No access_token in token exchange response.');
  }

  return data.access_token;
}

export async function fetchGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google user info: ${res.status}`);
  }

  return res.json() as Promise<GoogleUserInfo>;
}
