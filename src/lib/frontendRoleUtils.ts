/**
 * Frontend Role Hierarchy Utilities
 * Client-side role checking for UI components
 */

export interface UserPermissions {
  canManageClubMembers: boolean;
  canManageAllClubs: boolean;
  canManageCommitteeMembers: boolean;
  canManageUserRoles: boolean;
  accessLevel: 'none' | 'club' | 'zenith' | 'admin' | 'super_admin';
  managedClubIds: string[];
}

export class FrontendRoleUtils {
  
  /**
   * Check if user can manage another user based on their roles and club memberships
   */
  static async checkManagementPermissions(
    currentUser: any,
    targetUserId: string,
    targetUserClubId?: string
  ): Promise<{
    canManage: boolean;
    accessLevel: string;
    managedClubId?: string;
  }> {
    try {
      if (!currentUser || currentUser.id === targetUserId) {
        return { canManage: false, accessLevel: 'none' };
      }

      const userRole = currentUser.role?.toLowerCase() || '';

      // Super admin and admin can manage anyone
      if (userRole === 'super_admin') {
        return { 
          canManage: true, 
          accessLevel: 'super_admin',
          managedClubId: targetUserClubId 
        };
      }

      if (userRole === 'admin') {
        return { 
          canManage: true, 
          accessLevel: 'admin',
          managedClubId: targetUserClubId 
        };
      }

      // Check for Zenith committee roles by querying the backend
      const zenithAccess = await this.checkZenithCommitteeAccess(currentUser.id);
      if (zenithAccess.hasAccess) {
        return { 
          canManage: true, 
          accessLevel: 'zenith',
          managedClubId: targetUserClubId 
        };
      }

      // Check for club-level access
      if (targetUserClubId) {
        const clubAccess = await this.checkClubManagementAccess(currentUser.id, targetUserClubId);
        if (clubAccess.hasAccess) {
          return { 
            canManage: true, 
            accessLevel: 'club',
            managedClubId: targetUserClubId 
          };
        }
      }

      return { canManage: false, accessLevel: 'none' };

    } catch (error) {
      console.error('Error checking management permissions:', error);
      return { canManage: false, accessLevel: 'none' };
    }
  }

  /**
   * Check if user has Zenith committee access
   */
  static async checkZenithCommitteeAccess(userId: string): Promise<{
    hasAccess: boolean;
    roles: string[];
  }> {
    try {
      const response = await fetch('/api/user/committee-roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const privilegedRoles = data.roles?.filter((role: any) => role.isPrivileged) || [];
        return {
          hasAccess: privilegedRoles.length > 0,
          roles: privilegedRoles.map((role: any) => role.name)
        };
      }

      return { hasAccess: false, roles: [] };
    } catch (error) {
      console.error('Error checking Zenith committee access:', error);
      return { hasAccess: false, roles: [] };
    }
  }

  /**
   * Check if user can manage a specific club
   */
  static async checkClubManagementAccess(userId: string, clubId: string): Promise<{
    hasAccess: boolean;
    role?: string;
  }> {
    try {
      const response = await fetch('/api/user/club-info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const hasAccess = data.club_id === clubId && 
                         (data.role === 'coordinator' || data.role === 'co_coordinator');
        
        return {
          hasAccess,
          role: data.role
        };
      }

      return { hasAccess: false };
    } catch (error) {
      console.error('Error checking club management access:', error);
      return { hasAccess: false };
    }
  }

  /**
   * Get comprehensive user permissions
   */
  static async getUserPermissions(user: any): Promise<UserPermissions> {
    if (!user) {
      return {
        canManageClubMembers: false,
        canManageAllClubs: false,
        canManageCommitteeMembers: false,
        canManageUserRoles: false,
        accessLevel: 'none',
        managedClubIds: []
      };
    }

    const userRole = user.role?.toLowerCase() || '';

    // Super admin has all permissions
    if (userRole === 'super_admin') {
      return {
        canManageClubMembers: true,
        canManageAllClubs: true,
        canManageCommitteeMembers: true,
        canManageUserRoles: true,
        accessLevel: 'super_admin',
        managedClubIds: []
      };
    }

    // Admin has most permissions except user role management
    if (userRole === 'admin') {
      return {
        canManageClubMembers: true,
        canManageAllClubs: true,
        canManageCommitteeMembers: true,
        canManageUserRoles: false,
        accessLevel: 'admin',
        managedClubIds: []
      };
    }

    // Check Zenith committee access
    const zenithAccess = await this.checkZenithCommitteeAccess(user.id);
    if (zenithAccess.hasAccess) {
      return {
        canManageClubMembers: true,
        canManageAllClubs: true,
        canManageCommitteeMembers: false,
        canManageUserRoles: false,
        accessLevel: 'zenith',
        managedClubIds: []
      };
    }

    // Check club management access
    try {
      const response = await fetch('/api/user/club-info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('zenith-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.club_id && (data.role === 'coordinator' || data.role === 'co_coordinator')) {
          return {
            canManageClubMembers: true,
            canManageAllClubs: false,
            canManageCommitteeMembers: false,
            canManageUserRoles: false,
            accessLevel: 'club',
            managedClubIds: [data.club_id]
          };
        }
      }
    } catch (error) {
      console.error('Error checking club permissions:', error);
    }

    // Default: no management permissions
    return {
      canManageClubMembers: false,
      canManageAllClubs: false,
      canManageCommitteeMembers: false,
      canManageUserRoles: false,
      accessLevel: 'none',
      managedClubIds: []
    };
  }

  /**
   * Format role name for display
   */
  static formatRole(role: string): string {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get available roles for assignment based on current user's permissions
   */
  static getAvailableRoles(currentUserAccessLevel: string): string[] {
    switch (currentUserAccessLevel) {
      case 'super_admin':
        return ['member', 'co_coordinator', 'coordinator'];
      case 'admin':
        return ['member', 'co_coordinator', 'coordinator'];
      case 'zenith':
        return ['member', 'co_coordinator']; // Zenith committee can't assign coordinator role
      case 'club':
        return ['member', 'co_coordinator']; // Club coordinators can't assign coordinator role
      default:
        return [];
    }
  }
}