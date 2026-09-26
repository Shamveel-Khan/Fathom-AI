import { SignJWT, jwtVerify } from 'jose';

export interface SessionPayload {
  userId: string;
  email: string;
}

const ALG = 'HS256';
const SESSION_DURATION = '7d';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is not set.');
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}
