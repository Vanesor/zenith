import { NextResponse } from 'next/server';
import { getClubDetails } from '@/lib/adminDataService';

export async function GET(request: Request, { params }: { params: { clubId: string } }) {
  try {
    const { clubId } = params;
    
    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
    }
    
    const clubData = await getClubDetails(clubId);
    
    return NextResponse.json(clubData);
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: 'Failed to fetch club details' }, { status: 500 });
  }
}
