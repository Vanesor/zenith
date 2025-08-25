import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { queryRawSQL, executeRawSQL } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { selectedClub, phone, dateOfBirth } = await request.json();

    if (!selectedClub) {
      return NextResponse.json(
        { error: 'Club selection is required' },
        { status: 400 }
      );
    }

    // Update user profile with club selection and additional info
    await executeRawSQL(`
      UPDATE users 
      SET 
        club_id = $1,
        phone = $2,
        date_of_birth = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [
      selectedClub === 'none' ? null : selectedClub,
      phone || null,
      dateOfBirth || null,
      session.user.id
    ]);

    // If user selected a club (not 'none'), add them as a member for current academic year
    if (selectedClub !== 'none') {
      // Check if club exists
      const clubExists = await queryRawSQL(
        'SELECT id FROM clubs WHERE id = $1',
        [selectedClub]
      );

      if (clubExists.rows.length > 0) {
        // Add user to club_members table for current academic year
        await executeRawSQL(`
          INSERT INTO club_members (id, user_id, club_id, role, academic_year, is_current_term, is_leader, joined_at, created_at, updated_at)
          VALUES (uuid_generate_v4(), $1, $2, 'member', '2024-2025', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, club_id, academic_year) DO NOTHING
        `, [session.user.id, selectedClub]);

        // Update club member count
        await executeRawSQL(`
          UPDATE clubs 
          SET member_count = (
            SELECT COUNT(*) 
            FROM club_members 
            WHERE club_id = $1 AND is_current_term = true
          )
          WHERE id = $1
        `, [selectedClub]);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully'
    });

  } catch (error) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
