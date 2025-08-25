import { NextRequest, NextResponse } from "next/server";
import { queryRawSQL } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get committee members with their roles and user details
    const membersQuery = `
      SELECT 
        cm.id as member_id,
        cm.academic_year,
        cm.is_current_term,
        cr.name as role,
        cr.hierarchy,
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.profile_image_url
      FROM committee_members cm 
      JOIN committee_roles cr ON cm.role_id = cr.id 
      JOIN users u ON cm.user_id = u.id
      WHERE cm.committee_id = $1
      ORDER BY cm.academic_year DESC, cr.hierarchy ASC, u.name ASC
    `;

    const membersResult = await queryRawSQL(membersQuery, [teamId]);

    // Get available academic years
    const yearsQuery = `
      SELECT DISTINCT academic_year 
      FROM committee_members 
      WHERE committee_id = $1 
      ORDER BY academic_year DESC
    `;

    const yearsResult = await queryRawSQL(yearsQuery, [teamId]);

    // Get committee details
    const committeeQuery = `
      SELECT id, name, description, created_at
      FROM committees 
      WHERE id = $1
    `;

    const committeeResult = await queryRawSQL(committeeQuery, [teamId]);

    if (committeeResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Committee not found" },
        { status: 404 }
      );
    }

    const team = committeeResult.rows[0];
    const members = membersResult.rows.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      avatar: member.avatar || member.profile_image_url,
      role: member.role,
      academic_year: member.academic_year,
      is_current_term: member.is_current_term,
      is_privileged: false, // Default for committee members
      role_permissions: {}
    }));

    const availableYears = yearsResult.rows.map(row => row.academic_year);

    return NextResponse.json({
      team,
      members,
      availableYears
    });

  } catch (error) {
    console.error("Error fetching committee team data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
