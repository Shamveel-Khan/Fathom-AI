import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { searchRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({
      success: true,
      query: '',
      results: [],
      total: 0,
    });
  }

  try {
    const results = await searchRepository.search(userId, q);
    return NextResponse.json({
      success: true,
      query: q,
      results,
      total: results.length,
    });
  } catch (err) {
    console.error('/api/search error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to execute search.' },
      { status: 500 }
    );
  }
}
