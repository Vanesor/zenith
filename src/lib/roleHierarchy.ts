/**
 * Role Hierarchy and Permissions Management
 * Handles the unified permission system for Zenith Forum
 */

import { db } from './database';

export interface UserRoles {
  userId: string;
  email: string;
  baseRole: string; // From users.role (student, admin, super_admin)
  clubRoles: ClubRole[];
  committeeRoles: CommitteeRole[];
  effectivePermissions: string[];
}

export interface ClubRole {
  clubId: string;
  clubName: string;
  role: string; // coordinator, co_coordinator, member
  hierarchy: number;
  isCurrentTerm: boolean;
}

export interface CommitteeRole {
  committeeId: string;
  committeeName: string;
  roleName: string; // president, vice_president, innovation_head, etc.
  hierarchy: number;
  permissions: string[];
  isPrivileged: boolean;
  isCurrentTerm: boolean;
}

export interface AccessLevel {
  level: 'none' | 'club' | 'zenith' | 'admin' | 'super_admin';
  clubId?: string;
  permissions: string[];
}

export interface ClubManagementAccess {
  canManageMembers: boolean;
  canViewSubmissions: boolean;
  managedClubs: string[];
  level: 'none' | 'club' | 'zenith' | 'admin' | 'super_admin';
}

export class RoleHierarchy {
  // Role hierarchy levels (higher number = higher authority)
  static readonly ROLE_HIERARCHY = {
    'student': 1,
    'member': 2,
    'secretary': 3,
    'media': 4,
    'co_coordinator': 5,
    'coordinator': 6,
    'joint_secretary': 7,
    'joint_treasurer': 8,
    'outreach_head': 9,
    'media_head': 10,
    'secretary_committee': 11,
    'treasurer': 12,
    'innovation_head': 13,
    'vice_president': 14,
    'president': 15,
    'admin': 16,
    'super_admin': 17
  } as const;

  /**
   * Get hierarchy level for a role
   */
  static getRoleHierarchyLevel(role: string): number {
    return this.ROLE_HIERARCHY[role as keyof typeof this.ROLE_HIERARCHY] || 1;
  }

  /**
   * Check if role is privileged (committee-level)
   */
  static isPrivilegedRole(role: string): boolean {
    if (!role) return false;
    
    const privilegedRoles = [
      'joint_secretary', 'joint_treasurer', 'outreach_head', 'media_head',
      'secretary_committee', 'treasurer', 'innovation_head', 'vice_president', 
      'president', 'admin', 'super_admin'
    ];
    
    const roleLower = role.toLowerCase();
    console.log(`🔍 PRIVILEGE CHECK: Role "${role}" is privileged: ${privilegedRoles.includes(roleLower)}`);
    
    return privilegedRoles.includes(roleLower);
  }

  /**
   * Get permissions for a role
   */
  static getRolePermissions(role: string): string[] {
    const permissions: string[] = [];
    
    if (role === 'super_admin') {
      permissions.push('*');
      return permissions;
    }
    
    if (role === 'admin') {
      permissions.push('admin:*', 'zenith:*', 'club:*');
      return permissions;
    }
    
    if (this.isPrivilegedRole(role)) {
      permissions.push('zenith:*', 'club:*');
    }
    
    if (['coordinator', 'co_coordinator'].includes(role)) {
      permissions.push('club:manage_members', 'club:view_submissions');
    }
    
    return permissions;
  }

  /**
   * Get comprehensive role information for a user
   */
  static async getUserRoles(userId: string): Promise<UserRoles | null> {
    try {
      // Get user basic info
      const userResult = await db.query(
        `SELECT id, email, role, name FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return null;
      }

      const user = userResult.rows[0];

      // Get club memberships (for context, but role comes from users.role)
      const clubRolesResult = await db.query(`
        SELECT 
          cm.club_id,
          c.name as club_name,
          cm.hierarchy,
          cm.is_current_term
        FROM club_members cm
        JOIN clubs c ON cm.club_id = c.id
        WHERE cm.user_id = $1
        ORDER BY cm.hierarchy ASC, c.name
      `, [userId]);

      const clubRoles: ClubRole[] = clubRolesResult.rows.map((row: any) => ({
        clubId: row.club_id,
        clubName: row.club_name,
        role: user.role, // Use role from users table
        hierarchy: row.hierarchy,
        isCurrentTerm: row.is_current_term
      }));

      // Get committee memberships (for context, but role comes from users.role)
      const committeeRolesResult = await db.query(`
        SELECT 
          cm.committee_id,
          c.name as committee_name,
          cm.is_current_term
        FROM committee_members cm
        JOIN committees c ON cm.committee_id = c.id
        WHERE cm.user_id = $1
        ORDER BY c.name
      `, [userId]);

      const committeeRoles: CommitteeRole[] = committeeRolesResult.rows.map((row: any) => ({
        committeeId: row.committee_id,
        committeeName: row.committee_name,
        roleName: user.role, // Use role from users table
        hierarchy: this.getRoleHierarchyLevel(user.role),
        permissions: this.getRolePermissions(user.role),
        isPrivileged: this.isPrivilegedRole(user.role),
        isCurrentTerm: row.is_current_term
      }));

      // Calculate effective permissions
      const effectivePermissions = this.calculateEffectivePermissions(
        user.role,
        clubRoles,
        committeeRoles
      );

      return {
        userId: user.id,
        email: user.email,
        baseRole: user.role,
        clubRoles,
        committeeRoles,
        effectivePermissions
      };

    } catch (error) {
      console.error('Error getting user roles:', error);
      return null;
    }
  }

  /**
   * Calculate effective permissions based on all roles
   */
  private static calculateEffectivePermissions(
    baseRole: string,
    clubRoles: ClubRole[],
    committeeRoles: CommitteeRole[]
  ): string[] {
    const permissions = new Set<string>();

    // Base role permissions
    if (baseRole === 'super_admin') {
      permissions.add('*'); // All permissions
      return Array.from(permissions);
    }

    if (baseRole === 'admin') {
      permissions.add('admin:*');
      permissions.add('zenith:*');
      permissions.add('club:*');
    }

    // Add permissions based on role
    this.getRolePermissions(baseRole).forEach(perm => permissions.add(perm));

    return Array.from(permissions);
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: string, permission: string, context?: any): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    if (!userRoles) return false;

    // Super admin has all permissions
    if (userRoles.effectivePermissions.includes('*')) {
      return true;
    }

    // Check exact permission match
    if (userRoles.effectivePermissions.includes(permission)) {
      return true;
    }

    // Check wildcard permissions
    const permissionParts = permission.split(':');
    if (permissionParts.length > 1) {
      const wildcardPerm = `${permissionParts[0]}:*`;
      if (userRoles.effectivePermissions.includes(wildcardPerm)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has Zenith committee access (admin portal)
   */
  static async hasZenithAccess(userId: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    if (!userRoles) return false;

    // Check if user has a privileged role
    return this.isPrivilegedRole(userRoles.baseRole);
  }

  /**
   * Get user's access level for system navigation
   */
  static async getUserAccessLevel(userId: string): Promise<AccessLevel> {
    const userRoles = await this.getUserRoles(userId);
    
    if (!userRoles) {
      return { level: 'none', permissions: [] };
    }

    const baseRole = userRoles.baseRole;

    if (baseRole === 'super_admin') {
      return { level: 'super_admin', permissions: ['*'] };
    }

    if (baseRole === 'admin') {
      return { level: 'admin', permissions: ['admin:*', 'zenith:*', 'club:*'] };
    }

    if (this.isPrivilegedRole(baseRole)) {
      return { level: 'zenith', permissions: ['zenith:*', 'club:*'] };
    }

    if (['coordinator', 'co_coordinator'].includes(baseRole) && userRoles.clubRoles.length > 0) {
      return { 
        level: 'club', 
        clubId: userRoles.clubRoles[0].clubId,
        permissions: ['club:manage_members', 'club:view_submissions'] 
      };
    }

    return { level: 'none', permissions: [] };
  }

  /**
   * Get club management access for user
   */
  static async getClubManagementAccess(userId: string, clubId?: string): Promise<ClubManagementAccess> {
    const userRoles = await this.getUserRoles(userId);
    
    if (!userRoles) {
      return { 
        canManageMembers: false, 
        canViewSubmissions: false, 
        managedClubs: [],
        level: 'none'
      };
    }

    // Super admin access
    if (userRoles.baseRole === 'super_admin') {
      return { 
        canManageMembers: true, 
        canViewSubmissions: true, 
        managedClubs: ['*'],
        level: 'super_admin'
      };
    }

    // Admin access
    if (userRoles.baseRole === 'admin') {
      return { 
        canManageMembers: true, 
        canViewSubmissions: true, 
        managedClubs: ['*'],
        level: 'admin'
      };
    }

    // Committee members can manage all clubs
    if (this.isPrivilegedRole(userRoles.baseRole)) {
      console.log(`✅ ROLE_HIERARCHY: User ${userId} with role ${userRoles.baseRole} has zenith committee access`);
      return { 
        canManageMembers: true, 
        canViewSubmissions: true, 
        managedClubs: ['*'],
        level: 'zenith'
      };
    }

    // Club coordinators can manage their clubs
    const managedClubs = userRoles.clubRoles
      .filter((role: any) => ['coordinator', 'co_coordinator'].includes(role.role) && role.isCurrentTerm)
      .map((role: any) => role.clubId);

    const canManageSpecificClub = !clubId || managedClubs.includes(clubId);
    const hasClubAccess = canManageSpecificClub && managedClubs.length > 0;

    return {
      canManageMembers: hasClubAccess,
      canViewSubmissions: hasClubAccess,
      managedClubs,
      level: hasClubAccess ? 'club' : 'none'
    };
  }

  /**
   * Check if user can view another user's submissions
   */
  static async canViewUserSubmissions(viewerId: string, targetUserId: string): Promise<boolean> {
    // Users can always view their own submissions
    if (viewerId === targetUserId) return true;

    const viewerRoles = await this.getUserRoles(viewerId);
    if (!viewerRoles) return false;

    // Super admin and admin can view all submissions
    if (['super_admin', 'admin'].includes(viewerRoles.baseRole)) {
      return true;
    }

    // Committee members can view all submissions
    if (this.isPrivilegedRole(viewerRoles.baseRole)) {
      return true;
    }

    // Club coordinators can view submissions from their club members
    if (['coordinator', 'co_coordinator'].includes(viewerRoles.baseRole)) {
      const targetUserRoles = await this.getUserRoles(targetUserId);
      if (!targetUserRoles) return false;

      // Check if target user is in any of the clubs managed by viewer
      const viewerClubIds = viewerRoles.clubRoles
        .filter((role: any) => role.isCurrentTerm)
        .map((role: any) => role.clubId);
      
      const targetClubIds = targetUserRoles.clubRoles
        .filter((targetRole: any) => viewerClubIds.includes(targetRole.clubId) && targetRole.isCurrentTerm)
        .map((targetRole: any) => targetRole.clubId);

      return targetClubIds.length > 0;
    }

    return false;
  }
}