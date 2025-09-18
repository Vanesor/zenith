import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from '@/lib/auth-unified';
import { db } from "@/lib/database";

interface CommitteeMembership {
  id: string;
  committee_id: string;
  committee_name: string;
  role_id: string;
  role_name: string;
  academic_year: string;
  status: string;
  is_current_term: boolean;
  hierarchy: number;
  joined_at: string;
  term_start?: string;
  term_end?: string;
}

interface ClubMembership {
  id: string;
  club_id: string;
  club_name: string;
  role: string;
  academic_year: string;
  is_leader: boolean;
  is_current_term: boolean;
  hierarchy: number;
  joined_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify admin access
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;
    const userRole = user.role?.toLowerCase() || '';

    // Ensure user is a system admin
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ 
        error: "Access denied. Only admin and super admin users can view membership data." 
      }, { status: 403 });
    }

    const { userId } = params;

    // Validate user exists
    const userQuery = `
      SELECT id, name, email, role 
      FROM users 
      WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get committee memberships
    const committeeMembershipsQuery = `
      SELECT 
        cm.id,
        cm.committee_id,
        c.name as committee_name,
        cm.role_id,
        cr.name as role_name,
        cm.academic_year,
        cm.status,
        cm.is_current_term,
        cr.hierarchy,
        cm.joined_at,
        cm.term_start,
        cm.term_end
      FROM committee_members cm
      JOIN committees c ON cm.committee_id = c.id
      JOIN committee_roles cr ON cm.role_id = cr.id
      WHERE cm.user_id = $1
      ORDER BY cm.academic_year DESC, c.name, cr.hierarchy
    `;

    // Get club memberships
    const clubMembershipsQuery = `
      SELECT 
        clm.id,
        clm.club_id,
        cl.name as club_name,
        clm.role,
        clm.academic_year,
        clm.is_leader,
        clm.is_current_term,
        clm.hierarchy,
        clm.display_order,
        clm.bio,
        clm.achievements,
        clm.joined_at
      FROM club_members clm
      JOIN clubs cl ON clm.club_id = cl.id
      WHERE clm.user_id = $1
      ORDER BY clm.academic_year DESC, cl.name, clm.hierarchy
    `;

    const [committeeMemberships, clubMemberships] = await Promise.all([
      db.query(committeeMembershipsQuery, [userId]),
      db.query(clubMembershipsQuery, [userId])
    ]);

    return NextResponse.json({
      success: true,
      user: userResult.rows[0],
      memberships: {
        committees: committeeMemberships.rows as CommitteeMembership[],
        clubs: clubMemberships.rows as ClubMembership[]
      }
    });

  } catch (error) {
    console.error('Error fetching user memberships:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}