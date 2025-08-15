// Committee Database Service - uses consolidated database
import { Database } from './database-consolidated';

export interface CommitteeData {
  id: string;
  name: string;
  description: string;
  hierarchy_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  committee_roles?: Array<{
    id: string;
    name: string;
    description: string;
    hierarchy: number;
    permissions: string[];
  }>;
  committee_members?: Array<{
    id: string;
    user_id: string;
    role_id: string;
    status: string;
    joined_at: string;
    term_start: string | null;
    term_end: string | null;
    achievements: any;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      role: string;
    };
  }>;
}

class CommitteeService {
  
  async getMainCommittee(): Promise<CommitteeData | null> {
    try {
      // Use the consolidated database method with views and indexes
      const result = await Database.query('SELECT * FROM committees WHERE name = $1 AND is_active = true', ['Main Committee']);
      const committee = result.rows[0];
      
      if (!committee) {
        return null;
      }

      return committee as CommitteeData;
    } catch (error) {
      console.error('Error fetching main committee:', error);
      throw new Error('Failed to fetch committee data');
    }
  }
  
  async addCommitteeMember(committeeId: string, roleId: string, userId: string, termStart?: string, termEnd?: string): Promise<boolean> {
    try {
      const insertQuery = `
        INSERT INTO committee_members (committee_id, role_id, user_id, status, term_start, term_end)
        VALUES ($1, $2, $3, 'active', $4, $5)
        ON CONFLICT (committee_id, role_id, user_id) 
        DO UPDATE SET status = 'active', term_start = $4, term_end = $5, updated_at = CURRENT_TIMESTAMP
      `;
      
      await Database.query(insertQuery, [committeeId, roleId, userId, termStart || null, termEnd || null]);
      return true;
    } catch (error) {
      console.error('Error adding committee member:', error);
      return false;
    }
  }
  
  async removeCommitteeMember(committeeId: string, userId: string): Promise<boolean> {
    try {
      const updateQuery = `
        UPDATE committee_members 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE committee_id = $1 AND user_id = $2
      `;
      
      await Database.query(updateQuery, [committeeId, userId]);
      return true;
    } catch (error) {
      console.error('Error removing committee member:', error);
      return false;
    }
  }
  
  async getCommitteeRoles(committeeId: string) {
    try {
      const rolesQuery = `
        SELECT * FROM committee_roles 
        WHERE committee_id = $1 
        ORDER BY hierarchy ASC
      `;
      
      const result = await Database.query(rolesQuery, [committeeId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting committee roles:', error);
      return [];
    }
  }
  
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const permissionsQuery = `
        SELECT DISTINCT unnest(cr.permissions) as permission
        FROM committee_members cm
        JOIN committee_roles cr ON cm.role_id = cr.id
        WHERE cm.user_id = $1 AND cm.status = 'active'
      `;
      
      const result = await Database.query(permissionsQuery, [userId]);
      return result.rows.map(row => row.permission);
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }
}

export default new CommitteeService();
