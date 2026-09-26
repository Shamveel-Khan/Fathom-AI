import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const account = await userRepository.findByEmail(email);

    if (!account || account.passwordHash === null) {
      // Constant-time-ish delay to avoid timing attacks when user doesn't exist
      await new Promise((r) => setTimeout(r, 100));
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, account.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    await setSessionCookie(account.id, account.email);

    const { passwordHash: _ph, ...user } = account;
    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('/api/auth/login error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
