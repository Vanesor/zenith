'use server';

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-unified";
import { db } from "@/lib/database";
import { RoleHierarchy } from "@/lib/roleHierarchy";

/**
 * API to get committee roles for a committee
 */
export async function GET(request: NextRequest) {
  console.log('=== COMMITTEE ROLES API START ===');
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get committee ID from query
    const { searchParams } = new URL(request.url);
    const committeeId = searchParams.get('committeeId');
    
    if (!committeeId) {
      return NextResponse.json(
        { error: "Committee ID is required" },
        { status: 400 }
      );
    }
    
    // Check if user can access committee roles
    const userResult = await db.query(
      'SELECT role FROM users WHERE email = $1',
      [authResult.user.email]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // User's role
    const userRole = userResult.rows[0].role;
    
    // Get committee roles
    const rolesResult = await db.query(
      'SELECT id, name, committee_id, hierarchy FROM committee_roles WHERE committee_id = $1 ORDER BY hierarchy ASC',
      [committeeId]
    );
    
    console.log('=== COMMITTEE ROLES API END ===');
    
    return NextResponse.json({
      success: true,
      roles: rolesResult.rows.map(role => role.name)
    });
  } catch (error) {
    console.error("Error in committee-roles API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}