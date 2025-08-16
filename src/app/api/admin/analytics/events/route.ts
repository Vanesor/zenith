import { NextResponse } from 'next/server';
import { getEventStats } from '@/lib/adminDataService';

export async function GET() {
  try {
    const statsData = await getEventStats();
    
    return NextResponse.json(statsData);
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch event statistics' }, { status: 500 });
  }
}
