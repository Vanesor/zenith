import { NextResponse } from 'next/server';
import { getAssignmentStats } from '@/lib/adminDataService';

export async function GET() {
  try {
    const statsData = await getAssignmentStats();
    
    return NextResponse.json(statsData);
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Failed to fetch assignment statistics' }, { status: 500 });
  }
}
