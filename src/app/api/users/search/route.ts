import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { userRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim() || '';
  if (q.length < 2) return NextResponse.json({ success: true, users: [] });

  const users = await userRepository.searchUsers(q, userId);
  // Never expose sensitive data
  const safe = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarColor: u.avatarColor,
    avatarUrl: u.avatarUrl,
  }));
  return NextResponse.json({ success: true, users: safe });
}
