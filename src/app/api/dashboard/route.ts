import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/session';
import { meetingRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardData = await meetingRepository.getDashboardData(userId);

    return NextResponse.json({
      success: true,
      stats: dashboardData.stats,
      meetings: dashboardData.meetings,
    });
  } catch (err: unknown) {
    console.error('Error fetching dashboard data:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
