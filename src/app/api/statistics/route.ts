import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { fetchPublicStatistics } from '@/lib/data-layer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  noStore();
  try {
    const stats = await fetchPublicStatistics();
    return NextResponse.json(
      { success: true, stats },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: unknown) {
    console.error('Public statistics error:', error);
    return NextResponse.json({ success: false, error: 'فشل احتساب الإحصائيات' }, { status: 500 });
  }
}
