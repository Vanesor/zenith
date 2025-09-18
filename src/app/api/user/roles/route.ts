import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-unified";
import { RoleHierarchy } from "@/lib/roleHierarchy";

/**
 * GET /api/user/roles
 * Get complete role information for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get complete role information
    const userRoles = await RoleHierarchy.getUserRoles(authResult.user.id);
    
    if (!userRoles) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(userRoles);

  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}