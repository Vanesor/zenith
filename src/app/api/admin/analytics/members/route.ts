import { NextResponse } from 'next/server';
import { getMemberStats } from '@/lib/adminDataService';

export async function GET() {
  try {
    const statsData = await getMemberStats();
    
    return NextResponse.json(statsData);
  } catch (error) {
    console.error('Error fetching member statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch member statistics' }, { status: 500 });
  }
}
