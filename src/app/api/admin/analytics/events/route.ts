import { NextResponse } from 'next/server';
import { getEventStats } from '@/lib/adminDataService';

export async function GET() {
  try {
    const statsData = await getEventStats();
    
    return NextResponse.json(statsData);
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Failed to fetch event statistics' }, { status: 500 });
  }
}
