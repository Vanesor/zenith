import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-unified";
import { RoleHierarchy } from "@/lib/roleHierarchy";

/**
 * API to get current user's committee roles and permissions
 */
export async function GET(request: NextRequest) {
  console.log('=== COMMITTEE ROLES API START ===');
  
  try {
    console.log('1. Starting auth verification...');
    const authResult = await verifyAuth(request);
    console.log('2. Auth result:', {
      success: authResult.success,
      hasUser: !!authResult.user,
      userId: authResult.user?.id,
      userEmail: authResult.user?.email
    });
    
    if (!authResult.success || !authResult.user) {
      console.log('❌ AUTH FAILED: Unauthorized');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = authResult.user;
    console.log('✅ AUTH PASSED: User authenticated');
    console.log('3. User details from auth:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Get user's complete role information
    console.log('4. Calling RoleHierarchy.getUserRoles...');
    const userRoles = await RoleHierarchy.getUserRoles(user.id);
    console.log('5. RoleHierarchy result:', userRoles);
    
    if (!userRoles) {
      console.log('❌ ROLE FETCH FAILED: User not found in role hierarchy');
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log('✅ ROLES FETCHED: User roles retrieved');
    console.log('6. User roles breakdown:');
    console.log('   - Base role:', userRoles.baseRole);
    console.log('   - Committee roles count:', userRoles.committeeRoles.length);
    console.log('   - Club roles count:', userRoles.clubRoles.length);
    console.log('   - Effective permissions:', userRoles.effectivePermissions);

    // Check if user has Zenith access using the unified role system
    console.log('7. Checking privilege status...');
    // Always use toLowerCase for case-insensitive comparison
    const userRoleLowerCase = userRoles.baseRole.toLowerCase();
    const hasZenithAccess = RoleHierarchy.isPrivilegedRole(userRoleLowerCase);
    console.log('8. Privilege check result:');
    console.log('   - Role being checked:', userRoles.baseRole);
    console.log('   - Role lowercase:', userRoleLowerCase);
    console.log('   - Is privileged:', hasZenithAccess);
    console.log('   - RoleHierarchy.isPrivilegedRole call result:', RoleHierarchy.isPrivilegedRole(userRoleLowerCase));

    // Additional debug for specific roles
    if (userRoles.baseRole === 'innovation_head') {
      console.log('🔍 SPECIAL DEBUG: innovation_head role detected');
      console.log('   - Role hierarchy level:', RoleHierarchy.getRoleHierarchyLevel(userRoles.baseRole));
      console.log('   - Role permissions:', RoleHierarchy.getRolePermissions(userRoles.baseRole));
    }

    const response = {
      baseRole: userRoles.baseRole,
      committeeRoles: userRoles.committeeRoles.map((role: any) => ({
        committeeId: role.committeeId,
        committeeName: role.committeeName,
        name: role.roleName,
        hierarchy: role.hierarchy,
        permissions: role.permissions,
        isPrivileged: role.isPrivileged,
        isCurrentTerm: role.isCurrentTerm
      })),
      clubRoles: userRoles.clubRoles.map((role: any) => ({
        clubId: role.clubId,
        clubName: role.clubName,
        role: role.role,
        hierarchy: role.hierarchy,
        isCurrentTerm: role.isCurrentTerm
      })),
      effectivePermissions: userRoles.effectivePermissions,
      hasZenithAccess: hasZenithAccess,
      hasAdminAccess: ['admin', 'super_admin'].includes(userRoles.baseRole),
      isCommitteeMember: userRoles.committeeRoles.length > 0 || RoleHierarchy.isPrivilegedRole(userRoles.baseRole)
    };

    console.log('9. Final API response being sent:');
    console.log(JSON.stringify(response, null, 2));
    console.log('=== COMMITTEE ROLES API SUCCESS ===');
    
    return NextResponse.json(response);

  } catch (error) {
    console.error("💥 FATAL ERROR in committee-roles API:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
      { status: 500 }
    );
  }
}