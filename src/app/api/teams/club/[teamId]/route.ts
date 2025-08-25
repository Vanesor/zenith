import { NextRequest, NextResponse } from "next/server";
import { queryRawSQL } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get club members with their roles and user details (leadership positions only)
    const membersQuery = `
      SELECT 
        cm.id as member_id,
        cm.academic_year,
        cm.is_current_term,
        cm.role,
        cm.hierarchy,
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.profile_image_url
      FROM club_members cm 
      JOIN users u ON cm.user_id = u.id
      WHERE cm.club_id = $1 
        AND cm.hierarchy IS NOT NULL
      ORDER BY cm.academic_year DESC, 
               cm.hierarchy ASC,
               u.name ASC
    `;

    const membersResult = await queryRawSQL(membersQuery, [teamId]);

    // Get available academic years
    const yearsQuery = `
      SELECT DISTINCT academic_year 
      FROM club_members 
      WHERE club_id = $1 
      ORDER BY academic_year DESC
    `;

    const yearsResult = await queryRawSQL(yearsQuery, [teamId]);

    // Get club details
    const clubQuery = `
      SELECT id, name, description, banner_image_url, icon, color, created_at
      FROM clubs 
      WHERE id = $1
    `;

    const clubResult = await queryRawSQL(clubQuery, [teamId]);

    if (clubResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    const team = clubResult.rows[0];
    const members = membersResult.rows.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      avatar: member.avatar || member.profile_image_url,
      role: member.role,
      academic_year: member.academic_year,
      is_current_term: member.is_current_term,
      is_privileged: false, // Default for club members
      role_permissions: {}
    }));

    const availableYears = yearsResult.rows.map(row => row.academic_year);

    return NextResponse.json({
      team,
      members,
      availableYears
    });

  } catch (error) {
    console.error("Error fetching club team data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
