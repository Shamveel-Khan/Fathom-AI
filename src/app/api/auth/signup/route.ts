import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { userRepository } from '@/lib/repositories';
import { hashPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';

const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100).trim(),
  email: z.string().email('Please enter a valid email address.').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0] ?? 'Invalid input.';
      return NextResponse.json(
        { success: false, error: firstError, fieldErrors: errors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check for duplicate email
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.createUser({ name, email, passwordHash });

    await setSessionCookie(user.id, user.email);

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err) {
    console.error('/api/auth/signup error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
