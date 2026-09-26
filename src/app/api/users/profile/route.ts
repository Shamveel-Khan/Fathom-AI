import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { userRepository } from '@/lib/repositories';

// PATCH /api/users/profile — update current authenticated user's profile
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, role, avatarColor } = body as {
      name?: string;
      role?: string;
      avatarColor?: string;
    };

    if (name !== undefined && name.trim().length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    const updatedUser = await userRepository.updateProfile(userId, {
      name: name?.trim(),
      role: role?.trim(),
      avatarColor,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (err: unknown) {
    console.error('Error updating user profile:', err);
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
