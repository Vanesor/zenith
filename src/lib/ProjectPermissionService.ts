import db from './database';

export interface UserPermissions {
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canInviteMembers: boolean;
  canManageAllProjects: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;
  role: string;
  roleHierarchy: number;
}

export class ProjectPermissionService {
  
  // Define privileged roles that can manage projects
  private static readonly PRIVILEGED_ROLES = [
    'club_coordinator',
    'co_coordinator', 
    'president',
    'vice_president',
    'innovation_head',
    'secretary',
    'outreach_coordinator',
    'media_head',
    'treasurer',
    'Coordinator', // Handle case variations
    'coordinator',
    'Co-coordinator',
    'co-coordinator'
  ];

  private static readonly ROLE_HIERARCHY = {
    'president': 1,
    'vice_president': 2,
    'secretary': 3,
    'treasurer': 4,
    'innovation_head': 5,
    'outreach_coordinator': 6,
    'media_head': 7,
    'club_coordinator': 8,
    'co_coordinator': 9,
    'Coordinator': 8, // Handle case variations
    'coordinator': 8,
    'Co-coordinator': 9,
    'co-coordinator': 9,
    'member': 10
  };

  /**
   * Check if user has permission to create/edit/delete projects
   */
  static async getUserPermissions(userId: string, projectId?: string): Promise<UserPermissions> {
    try {
      // Get user role and committee membership
      const userQuery = `
        SELECT 
          u.role,
          u.club_id,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM committee_members cm 
              JOIN committee_roles cr ON cm.role_id = cr.id 
              WHERE cm.user_id = u.id AND cm.status = 'active'
            ) THEN true 
            ELSE false 
          END as is_committee_member,
          COALESCE(cr.name, u.role) as effective_role
        FROM users u
        LEFT JOIN committee_members cm ON u.id = cm.user_id AND cm.status = 'active'
        LEFT JOIN committee_roles cr ON cm.role_id = cr.id
        WHERE u.id = $1
        ORDER BY cr.hierarchy ASC
        LIMIT 1
      `;
      
      const userResult = await db.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return this.getDefaultPermissions();
      }
      
      const user = userResult.rows[0];
      const effectiveRole = user.effective_role || user.role;
      const userRole = user.role;
      
      // Check if user is in privileged roles (check both effective role and direct role)
      const isPrivileged = this.PRIVILEGED_ROLES.includes(effectiveRole) || 
                          this.PRIVILEGED_ROLES.includes(userRole) ||
                          this.PRIVILEGED_ROLES.includes(effectiveRole.toLowerCase()) ||
                          this.PRIVILEGED_ROLES.includes(userRole.toLowerCase());
      
      console.log('Permission check for user:', { 
        userId, 
        userRole, 
        effectiveRole, 
        isPrivileged,
        roleHierarchy: this.ROLE_HIERARCHY[effectiveRole as keyof typeof this.ROLE_HIERARCHY] || 10,
        privilegedRoles: this.PRIVILEGED_ROLES,
        matchesPrivileged: this.PRIVILEGED_ROLES.includes(userRole.toLowerCase())
      });
      
      // If checking project-specific permissions
      let isProjectMember = false;
      let projectRole = 'member';
      
      if (projectId) {
        const projectMemberQuery = `
          SELECT role, status FROM project_members 
          WHERE project_id = $1 AND user_id = $2 AND status = 'active'
        `;
        const projectResult = await db.query(projectMemberQuery, [projectId, userId]);
        
        if (projectResult.rows.length > 0) {
          isProjectMember = true;
          projectRole = projectResult.rows[0].role;
        }
      }
      
      const roleHierarchy = this.ROLE_HIERARCHY[effectiveRole as keyof typeof this.ROLE_HIERARCHY] || 10;
      
      // Force permissions for innovation_head role regardless of other checks
      const isInnovationHead = 
        userRole === 'innovation_head' || 
        effectiveRole === 'innovation_head' ||
        userRole.toLowerCase() === 'innovation_head';
      
      return {
        canCreateProject: isPrivileged || isInnovationHead,
        canEditProject: isPrivileged || isInnovationHead || (isProjectMember && ['admin', 'manager'].includes(projectRole)),
        canDeleteProject: (isPrivileged && roleHierarchy <= 7) || isInnovationHead, // Only top-level roles
        canInviteMembers: isPrivileged || isInnovationHead || (isProjectMember && ['admin', 'manager'].includes(projectRole)),
        canManageAllProjects: (isPrivileged && roleHierarchy <= 3) || isInnovationHead, // President, VP, Secretary
        canCreateTasks: isPrivileged || isInnovationHead || isProjectMember,
        canEditTasks: isPrivileged || isInnovationHead || isProjectMember,
        canDeleteTasks: isPrivileged || isInnovationHead || (isProjectMember && ['admin', 'manager'].includes(projectRole)),
        canAssignTasks: isPrivileged || isInnovationHead || (isProjectMember && ['admin', 'manager'].includes(projectRole)),
        role: effectiveRole,
        roleHierarchy
      };
      
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return this.getDefaultPermissions();
    }
  }
  
  /**
   * Check if user can access a specific project
   */
  static async canAccessProject(userId: string, projectId: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId, projectId);
      
      // Check if user is project member
      const memberQuery = `
        SELECT 1 FROM project_members 
        WHERE project_id = $1 AND user_id = $2 AND status = 'active'
      `;
      const memberResult = await db.query(memberQuery, [projectId, userId]);
      
      // Check if project is public
      const projectQuery = `
        SELECT is_public FROM projects WHERE id = $1
      `;
      const projectResult = await db.query(projectQuery, [projectId]);
      
      if (projectResult.rows.length === 0) return false;
      
      const isPublic = projectResult.rows[0].is_public;
      const isMember = memberResult.rows.length > 0;
      
      // Allow access if: user has management permissions, is a member, or project is public
      return permissions.canManageAllProjects || isMember || isPublic;
      
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }
  
  /**
   * Get list of users who can be invited to projects
   */
  static async getInvitableUsers(projectId: string): Promise<any[]> {
    try {
      // First get the project's club
      const projectQuery = `
        SELECT club_id FROM projects WHERE id = $1
      `;
      const projectResult = await db.query(projectQuery, [projectId]);
      
      if (!projectResult.rows.length) {
        return [];
      }
      
      const clubId = projectResult.rows[0].club_id;
      
      // Get users who are not already project members
      let query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          CASE 
            WHEN cm.user_id IS NOT NULL THEN cr.name
            ELSE u.role 
          END as display_role
        FROM users u
        LEFT JOIN committee_members cm ON u.id = cm.user_id AND cm.status = 'active'
        LEFT JOIN committee_roles cr ON cm.role_id = cr.id
        LEFT JOIN project_members pm ON u.id = pm.user_id AND pm.project_id = $1
        WHERE pm.user_id IS NULL
      `;
      
      const params = [projectId];
      
      // If club specified, prioritize club members
      if (clubId) {
        query += ` AND (u.club_id = $2 OR cm.user_id IS NOT NULL)`;
        params.push(clubId);
      }
      
      query += ` ORDER BY 
        CASE WHEN cm.user_id IS NOT NULL THEN cr.hierarchy ELSE 999 END,
        u.name
      `;
      
      const result = await db.query(query, params);
      return result.rows;
      
    } catch (error) {
      console.error('Error getting invitable users:', error);
      return [];
    }
  }
  
  private static getDefaultPermissions(): UserPermissions {
    return {
      canCreateProject: false,
      canEditProject: false,
      canDeleteProject: false,
      canInviteMembers: false,
      canManageAllProjects: false,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canAssignTasks: false,
      role: 'member',
      roleHierarchy: 10
    };
  }
}
