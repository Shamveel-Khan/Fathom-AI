import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const account = await userRepository.findByEmail(email);

    if (!account || account.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    await setSessionCookie(account.id);

    const { password: _pw, dataFile: _df, ...user } = account;
    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('/api/auth/login error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
