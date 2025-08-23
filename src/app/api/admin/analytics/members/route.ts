import { NextResponse } from 'next/server';
import { getMemberStats } from '@/lib/adminDataService';

export async function GET() {
  try {
    const statsData = await getMemberStats();
    
    return NextResponse.json(statsData);
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Failed to fetch member statistics' }, { status: 500 });
  }
}
