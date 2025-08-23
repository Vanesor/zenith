import { NextRequest, NextResponse } from 'next/server';
import CommitteeService from '@/lib/CommitteeService';
import { verifyAuth, getUserIdFromRequest } from '@/lib/auth-unified';

// GET /api/committee - Get main committee information
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication if needed
    // const user = await verifyAuth(request);
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get main committee with all members and roles
    const committee = await CommitteeService.getMainCommittee();

    if (!committee) {
      return NextResponse.json({
        error: 'Committee not found',
        message: 'Main committee has not been initialized. Run the setup script.'
      }, { status: 404 });
    }

    // Transform data for frontend
    const committeeData = {
      id: committee.id,
      name: committee.name,
      description: committee.description,
      hierarchy_level: committee.hierarchy_level,
      is_active: committee.is_active,
      created_at: committee.created_at,
      updated_at: committee.updated_at,
      
      // Committee roles with members
      roles: committee.committee_roles?.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        hierarchy: role.hierarchy,
        permissions: role.permissions,
        
        // Members in this role
        members: committee.committee_members
          ?.filter((member: any) => member.role_id === role.id && member.status === 'active')
          ?.map((member: any) => ({
            id: member.id,
            user_id: member.user_id,
            status: member.status,
            joined_at: member.joined_at,
            term_start: member.term_start,
            term_end: member.term_end,
            achievements: member.achievements,
            user: {
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              avatar: member.user.avatar,
              role: member.user.role,
            }
          })) || []
      })) || [],

      // Total member count
      totalMembers: committee.committee_members?.filter((m: any) => m.status === 'active').length || 0,
    };

    return NextResponse.json({
      success: true,
      committee: committeeData
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({
      error: 'Failed to fetch committee data',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// POST /api/committee - Create or update committee structure
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // Check if user has permission to manage committee
    const managementRoles = ['president', 'vice_president', 'admin'];
    if (!managementRoles.includes(user.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        message: 'Only committee leaders can manage committee structure'
      }, { status: 403 });
    }

    const { action, data } = await request.json();

    let result;

    switch (action) {
      case 'add_member':
        result = await CommitteeService.addCommitteeMember(
          data.committee_id,
          data.role_id,
          data.user_id,
          data.term_start,
          data.term_end
        );
        break;

      case 'remove_member':
        result = await CommitteeService.removeCommitteeMember(
          data.committee_id,
          data.user_id
        );
        break;

      case 'get_roles':
        result = await CommitteeService.getCommitteeRoles(data.committee_id);
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action',
          message: 'Supported actions: add_member, remove_member, get_roles'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      message: `Successfully completed ${action.replace('_', ' ')}`
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({
      error: 'Committee management failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
