import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { fetchAdminDashboardStatistics } from '@/lib/data-layer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const stats = await fetchAdminDashboardStatistics();
    return NextResponse.json({ success: true, stats });
  } catch (error: unknown) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ success: false, error: 'فشل جلب إحصائيات لوحة التحكم' }, { status: 500 });
  }
}
