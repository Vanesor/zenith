// Team Permission Management Utility
// This utility provides functions to check and manage team permissions

import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export interface PermissionCheck {
  hasPermission: boolean;
  role?: string;
  academicYear?: string;
  isPrivileged?: boolean;
}

export class TeamPermissionManager {
  /**
   * Check if a user has privileged permissions for a team
   */
  static async hasPrivilegedPermissions(
    userEmail: string, 
    teamType: 'committee' | 'club', 
    teamId: string
  ): Promise<boolean> {
    try {
      const result = await query(
        `SELECT has_privileged_permissions($1, $2, $3) as has_permission`,
        [userEmail, teamType, teamId]
      );
      
      return result.rows[0]?.has_permission || false;
    } catch (error) {
      console.error('Error checking privileged permissions:', error);
      return false;
    }
  }

  /**
   * Check if a user can create projects
   */
  static async canCreateProjects(
    userEmail: string, 
    teamType: 'committee' | 'club', 
    teamId: string
  ): Promise<boolean> {
    if (teamType === 'club') {
      // For clubs, check if user is a leader with privileged permissions
      try {
        const result = await query(`
          SELECT EXISTS(
            SELECT 1 FROM club_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE u.email = $1 
            AND cm.club_id = $2 
            AND cm.role IN ('coordinator', 'co_coordinator')
            AND cm.academic_year IN (
              SELECT academic_year 
              FROM club_members 
              WHERE club_id = $2
              ORDER BY academic_year DESC 
              LIMIT 2
            )
          ) as can_create
        `, [userEmail, teamId]);
        
        return result.rows[0]?.can_create || false;
      } catch (error) {
        console.error('Error checking project creation permission for club:', error);
        return false;
      }
    } else {
      // For committees, check role permissions
      try {
        const result = await query(`
          SELECT EXISTS(
            SELECT 1 FROM committee_members cm
            JOIN committee_roles cr ON cm.role_id = cr.id
            JOIN users u ON cm.user_id = u.id
            WHERE u.email = $1 
            AND cm.committee_id = $2 
            AND cr.can_create_projects = true
            AND cr.is_privileged = true
            AND cm.status = 'active'
          ) as can_create
        `, [userEmail, teamId]);
        
        return result.rows[0]?.can_create || false;
      } catch (error) {
        console.error('Error checking project creation permission for committee:', error);
        return false;
      }
    }
  }

  /**
   * Check if a user can manage events
   */
  static async canManageEvents(
    userEmail: string, 
    teamType: 'committee' | 'club', 
    teamId: string
  ): Promise<boolean> {
    if (teamType === 'club') {
      // For clubs, coordinators and secretaries can manage events
      try {
        const result = await query(`
          SELECT EXISTS(
            SELECT 1 FROM club_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE u.email = $1 
            AND cm.club_id = $2 
            AND cm.role IN ('coordinator', 'co_coordinator', 'secretary')
            AND cm.academic_year IN (
              SELECT academic_year 
              FROM club_members 
              WHERE club_id = $2
              ORDER BY academic_year DESC 
              LIMIT 2
            )
          ) as can_manage
        `, [userEmail, teamId]);
        
        return result.rows[0]?.can_manage || false;
      } catch (error) {
        console.error('Error checking event management permission for club:', error);
        return false;
      }
    } else {
      try {
        const result = await query(`
          SELECT EXISTS(
            SELECT 1 FROM committee_members cm
            JOIN committee_roles cr ON cm.role_id = cr.id
            JOIN users u ON cm.user_id = u.id
            WHERE u.email = $1 
            AND cm.committee_id = $2 
            AND cr.can_manage_events = true
            AND cr.is_privileged = true
            AND cm.status = 'active'
          ) as can_manage
        `, [userEmail, teamId]);
        
        return result.rows[0]?.can_manage || false;
      } catch (error) {
        console.error('Error checking event management permission for committee:', error);
        return false;
      }
    }
  }

  /**
   * Check if a user can approve content
   */
  static async canApproveContent(
    userEmail: string, 
    teamType: 'committee' | 'club', 
    teamId: string
  ): Promise<boolean> {
    if (teamType === 'club') {
      try {
        const result = await query(`
          SELECT EXISTS(
            SELECT 1 FROM club_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE u.email = $1 
            AND cm.club_id = $2 
            AND cm.role IN ('coordinator', 'co_coordinator')
            AND cm.academic_year IN (
              SELECT academic_year 
              FROM club_members 
              WHERE club_id = $2
              ORDER BY academic_year DESC 
              LIMIT 2
            )
          ) as can_approve
        `, [userEmail, teamId]);
        
        return result.rows[0]?.can_approve || false;
      } catch (error) {
        console.error('Error checking content approval permission for club:', error);
        return false;
      }
    } else {
      try {
        const result = await query(`
          SELECT EXISTS(
            SELECT 1 FROM committee_members cm
            JOIN committee_roles cr ON cm.role_id = cr.id
            JOIN users u ON cm.user_id = u.id
            WHERE u.email = $1 
            AND cm.committee_id = $2 
            AND cr.can_approve_content = true
            AND cr.is_privileged = true
            AND cm.status = 'active'
          ) as can_approve
        `, [userEmail, teamId]);
        
        return result.rows[0]?.can_approve || false;
      } catch (error) {
        console.error('Error checking content approval permission for committee:', error);
        return false;
      }
    }
  }

  /**
   * Get user's role and permissions in a team
   */
  static async getUserTeamInfo(
    userEmail: string, 
    teamType: 'committee' | 'club', 
    teamId: string
  ): Promise<{
    isMember: boolean;
    role?: string;
    academicYear?: string;
    isPrivileged: boolean;
    permissions: {
      canCreateProjects: boolean;
      canManageEvents: boolean;
      canApproveContent: boolean;
      canManageMembers: boolean;
    };
  }> {
    try {
      const [privilegedCheck, createProjectsCheck, manageEventsCheck, approveContentCheck] = await Promise.all([
        this.hasPrivilegedPermissions(userEmail, teamType, teamId),
        this.canCreateProjects(userEmail, teamType, teamId),
        this.canManageEvents(userEmail, teamType, teamId),
        this.canApproveContent(userEmail, teamType, teamId)
      ]);

      // Get role and academic year info
      let roleInfo: any = { isMember: false, role: null, academicYear: null };
      
      if (teamType === 'club') {
        const result = await query(`
          SELECT cm.role, cm.academic_year, cm.is_current_term
          FROM club_members cm
          JOIN users u ON cm.user_id = u.id
          WHERE u.email = $1 AND cm.club_id = $2
          ORDER BY cm.academic_year DESC
          LIMIT 1
        `, [userEmail, teamId]);
        
        if (result.rows.length > 0) {
          roleInfo = { isMember: true, ...result.rows[0] };
        }
      } else {
        const result = await query(`
          SELECT cr.name as role, cm.academic_year, cm.is_current_term
          FROM committee_members cm
          JOIN committee_roles cr ON cm.role_id = cr.id
          JOIN users u ON cm.user_id = u.id
          WHERE u.email = $1 AND cm.committee_id = $2 AND cm.status = 'active'
          ORDER BY cm.academic_year DESC
          LIMIT 1
        `, [userEmail, teamId]);
        
        if (result.rows.length > 0) {
          roleInfo = { isMember: true, ...result.rows[0] };
        }
      }

      return {
        isMember: roleInfo.isMember,
        role: roleInfo.role,
        academicYear: roleInfo.academic_year,
        isPrivileged: privilegedCheck,
        permissions: {
          canCreateProjects: createProjectsCheck,
          canManageEvents: manageEventsCheck,
          canApproveContent: approveContentCheck,
          canManageMembers: privilegedCheck && (roleInfo.role?.includes('coordinator') || roleInfo.role === 'president')
        }
      };

    } catch (error) {
      console.error('Error getting user team info:', error);
      return {
        isMember: false,
        isPrivileged: false,
        permissions: {
          canCreateProjects: false,
          canManageEvents: false,
          canApproveContent: false,
          canManageMembers: false
        }
      };
    }
  }

  /**
   * Update academic year and privilege status (run at the start of new academic year)
   */
  static async updateAcademicYear(newAcademicYear: string): Promise<void> {
    try {
      await query('BEGIN');

      // Update committee members
      await query(`
        UPDATE committee_members 
        SET is_current_term = false
        WHERE is_current_term = true
      `);

      await query(`
        UPDATE committee_members 
        SET is_current_term = true,
            academic_year = $1
        WHERE academic_year = (
          SELECT MAX(academic_year) FROM committee_members
        )
      `, [newAcademicYear]);

      // Update club members
      await query(`
        UPDATE club_members 
        SET is_current_term = false
        WHERE is_current_term = true
      `);

      await query(`
        UPDATE club_members 
        SET is_current_term = true,
            academic_year = $1
        WHERE academic_year = (
          SELECT MAX(academic_year) FROM club_members
        )
      `, [newAcademicYear]);

      // Trigger privilege updates
      await query(`
        UPDATE committee_members 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE academic_year IN (
          SELECT DISTINCT academic_year 
          FROM committee_members 
          ORDER BY academic_year DESC 
          LIMIT 2
        )
      `);

      await query('COMMIT');
      console.log(`Academic year updated to ${newAcademicYear}`);
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error updating academic year:', error);
      throw error;
    }
  }
}

// Middleware for checking team permissions in API routes
export function withTeamPermission(
  requiredPermission: 'create_projects' | 'manage_events' | 'approve_content' | 'privileged'
) {
  return async (
    request: Request,
    { params }: { params: { teamType: string; teamId: string } },
    userEmail: string
  ) => {
    const { teamType, teamId } = params;

    if (!['committee', 'club'].includes(teamType)) {
      throw new Error('Invalid team type');
    }

    let hasPermission = false;

    switch (requiredPermission) {
      case 'create_projects':
        hasPermission = await TeamPermissionManager.canCreateProjects(
          userEmail, teamType as 'committee' | 'club', teamId
        );
        break;
      case 'manage_events':
        hasPermission = await TeamPermissionManager.canManageEvents(
          userEmail, teamType as 'committee' | 'club', teamId
        );
        break;
      case 'approve_content':
        hasPermission = await TeamPermissionManager.canApproveContent(
          userEmail, teamType as 'committee' | 'club', teamId
        );
        break;
      case 'privileged':
        hasPermission = await TeamPermissionManager.hasPrivilegedPermissions(
          userEmail, teamType as 'committee' | 'club', teamId
        );
        break;
    }

    if (!hasPermission) {
      throw new Error(`Insufficient permissions: ${requiredPermission} required`);
    }

    return hasPermission;
  };
}
