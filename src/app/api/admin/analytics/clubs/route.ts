import { NextResponse } from 'next/server';
import { getClubStats } from '@/lib/adminDataService';

export async function GET() {
  try {
    const statsData = await getClubStats();
    
    return NextResponse.json(statsData);
  } catch (error) {
    console.error('Error fetching club analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch club analytics' }, { status: 500 });
  }
}
