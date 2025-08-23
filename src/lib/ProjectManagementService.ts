import db from './database';
import { ProjectPermissionService } from './ProjectPermissionService';
import crypto from 'crypto';

export interface Project {
  id: string;
  name: string;
  description: string;
  project_key: string;
  club_id: string;
  created_by: string;
  project_type: string;
  priority: string;
  status: string;
  start_date?: string;
  target_end_date?: string;
  actual_end_date?: string;
  access_password?: string;
  is_public: boolean;
  progress_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
  creator?: any;
  members?: ProjectMember[];
  club?: any;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  invited_by?: string;
  user?: any;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  task_key: string;
  task_type: string;
  priority: string;
  status: string;
  assignee_id?: string;
  reporter_id: string;
  parent_task_id?: string;
  due_date?: string;
  estimated_hours?: number;
  logged_hours?: number;
  created_at: string;
  updated_at: string;
  assignee?: any;
  reporter?: any;
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  inviter_id: string;
  email: string;
  role: string;
  invitation_token: string;
  project_password?: string;
  status: string;
  message?: string;
  expires_at: string;
  sent_at: string;
  accepted_at?: string;
}

export class ProjectManagementService {
  
  /**
   * Create a new project
   */
  static async createProject(data: {
    name: string;
    description: string;
    club_id: string;
    created_by: string;
    project_type?: string;
    priority?: string;
    start_date?: string;
    target_end_date?: string;
    is_public?: boolean;
  }): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      // Validate project name length
      if (data.name.length < 5) {
        return { success: false, error: 'Project name must be at least 5 characters long' };
      }

      // Check permissions
      const permissions = await ProjectPermissionService.getUserPermissions(data.created_by);
      if (!permissions.canCreateProject) {
        return { success: false, error: 'Insufficient permissions to create projects' };
      }
      
      // Check if project name is unique within the club
      const nameCheckQuery = `
        SELECT 1 FROM projects 
        WHERE LOWER(name) = LOWER($1) AND club_id = $2
      `;
      const nameCheckResult = await db.query(nameCheckQuery, [data.name, data.club_id]);
      
      if (nameCheckResult.rows.length > 0) {
        return { success: false, error: 'A project with this name already exists in your club. Please choose a different name.' };
      }
      
      // Generate unique project key and access password
      const projectKey = await this.generateProjectKey(data.name, data.club_id);
      const accessPassword = await this.generateAccessPassword(data.name, data.created_by);
      
      const query = `
        INSERT INTO projects (
          name, description, club_id, created_by, project_key,
          project_type, priority, start_date, target_end_date, 
          is_public, access_password, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'planning')
        RETURNING *
      `;
      
      const result = await db.query(query, [
        data.name,
        data.description,
        data.club_id,
        data.created_by,
        projectKey,
        data.project_type || 'development',
        data.priority || 'medium',
        data.start_date,
        data.target_end_date,
        data.is_public || false,
        accessPassword
      ]);
      
      const project = result.rows[0];
      
      // Add creator as admin member
      await this.addProjectMember(project.id, data.created_by, 'admin', data.created_by);
      
      return { success: true, project };
      
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error: 'Failed to create project' };
    }
  }
  
  /**
   * Get projects for a user
   */
  static async getUserProjects(userId: string, filters?: {
    status?: string;
    club_id?: string;
    role?: string;
  }): Promise<Project[]> {
    try {
      const permissions = await ProjectPermissionService.getUserPermissions(userId);
      
      let query = `
        SELECT DISTINCT p.*,
          u.name as creator_name,
          u.email as creator_email,
          c.name as club_name,
          COUNT(pm.id) as member_count
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN clubs c ON p.club_id = c.id
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.status = 'active'
      `;
      
      const conditions = [];
      const params: any[] = [];
      let paramCount = 0;
      
      // If user can manage all projects, show all; otherwise show only their projects
      if (!permissions.canManageAllProjects) {
        conditions.push(`(
          p.id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = $${++paramCount} AND status = 'active'
          ) OR p.is_public = true
        )`);
        params.push(userId);
      }
      
      if (filters?.status) {
        conditions.push(`p.status = $${++paramCount}`);
        params.push(filters.status);
      }
      
      if (filters?.club_id) {
        conditions.push(`p.club_id = $${++paramCount}`);
        params.push(filters.club_id);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` GROUP BY p.id, u.name, u.email, c.name ORDER BY p.updated_at DESC`;
      
      const result = await db.query(query, params);
      return result.rows;
      
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }
  
  /**
   * Get project details with members and tasks
   */
  static async getProjectDetails(projectId: string, userId: string): Promise<{
    success: boolean;
    project?: Project & { members: ProjectMember[]; recent_tasks: Task[] };
    error?: string;
  }> {
    try {
      // Check access
      const canAccess = await ProjectPermissionService.canAccessProject(userId, projectId);
      if (!canAccess) {
        return { success: false, error: 'Access denied to this project' };
      }
      
      // Get project details
      const projectQuery = `
        SELECT p.*, 
          u.name as creator_name, u.email as creator_email,
          c.name as club_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN clubs c ON p.club_id = c.id
        WHERE p.id = $1
      `;
      
      const projectResult = await db.query(projectQuery, [projectId]);
      
      if (projectResult.rows.length === 0) {
        return { success: false, error: 'Project not found' };
      }
      
      const project = projectResult.rows[0];
      
      // Get project members
      const membersQuery = `
        SELECT pm.*, 
          u.name as user_name, u.email as user_email,
          inv.name as inviter_name
        FROM project_members pm
        LEFT JOIN users u ON pm.user_id = u.id
        LEFT JOIN users inv ON pm.invited_by = inv.id
        WHERE pm.project_id = $1
        ORDER BY 
          CASE pm.role 
            WHEN 'admin' THEN 1 
            WHEN 'manager' THEN 2 
            ELSE 3 
          END,
          pm.joined_at ASC
      `;
      
      const membersResult = await db.query(membersQuery, [projectId]);
      
      // Get recent tasks
      const tasksQuery = `
        SELECT t.*,
          assignee.name as assignee_name,
          reporter.name as reporter_name
        FROM tasks t
        LEFT JOIN users assignee ON t.assignee_id = assignee.id
        LEFT JOIN users reporter ON t.reporter_id = reporter.id
        WHERE t.project_id = $1
        ORDER BY t.updated_at DESC
        LIMIT 10
      `;
      
      const tasksResult = await db.query(tasksQuery, [projectId]);
      
      return {
        success: true,
        project: {
          ...project,
          members: membersResult.rows,
          recent_tasks: tasksResult.rows
        }
      };
      
    } catch (error) {
      console.error('Error getting project details:', error);
      return { success: false, error: 'Failed to get project details' };
    }
  }
  
  /**
   * Add member to project
   */
  static async addProjectMember(
    projectId: string,
    userId: string,
    role: string = 'member',
    invitedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const query = `
        INSERT INTO project_members (project_id, user_id, role, invited_by, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (project_id, user_id) 
        DO UPDATE SET role = $3, status = 'active', invited_by = $4
      `;
      
      await db.query(query, [projectId, userId, role, invitedBy]);
      return { success: true };
      
    } catch (error) {
      console.error('Error adding project member:', error);
      return { success: false, error: 'Failed to add project member' };
    }
  }
  
  /**
   * Create project invitation
   */
  static async createInvitation(data: {
    project_id: string;
    inviter_id: string;
    email: string;
    role: string;
    message?: string;
  }): Promise<{ success: boolean; invitation?: ProjectInvitation; error?: string }> {
    try {
      // Check permissions
      const permissions = await ProjectPermissionService.getUserPermissions(data.inviter_id, data.project_id);
      if (!permissions.canInviteMembers) {
        return { success: false, error: 'Insufficient permissions to invite members' };
      }
      
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      // Get project access password
      const projectQuery = `SELECT access_password FROM projects WHERE id = $1`;
      const projectResult = await db.query(projectQuery, [data.project_id]);
      const projectPassword = projectResult.rows[0]?.access_password;
      
      const query = `
        INSERT INTO project_invitations (
          project_id, inviter_id, email, role, invitation_token,
          project_password, message, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const result = await db.query(query, [
        data.project_id,
        data.inviter_id,
        data.email,
        data.role,
        invitationToken,
        projectPassword,
        data.message,
        expiresAt
      ]);
      
      return { success: true, invitation: result.rows[0] };
      
    } catch (error) {
      console.error('Error creating invitation:', error);
      return { success: false, error: 'Failed to create invitation' };
    }
  }
  
  /**
   * Invite multiple users to a project
   */
  static async inviteMembers(
    projectId: string, 
    userIds: string[], 
    inviterId: string
  ): Promise<{ success: boolean; invitedCount?: number; failedCount?: number; error?: string }> {
    try {
      let invitedCount = 0;
      let failedCount = 0;
      
      for (const userId of userIds) {
        try {
          // Check if user is already a member
          const memberCheckQuery = `
            SELECT 1 FROM project_members 
            WHERE project_id = $1 AND user_id = $2
          `;
          const memberCheck = await db.query(memberCheckQuery, [projectId, userId]);
          
          if (memberCheck.rows.length > 0) {
            failedCount++;
            continue;
          }
          
          // Add user as project member
          const addMemberResult = await this.addProjectMember(projectId, userId, 'member', inviterId);
          
          if (addMemberResult.success) {
            invitedCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Error inviting user ${userId}:`, error);
          failedCount++;
        }
      }
      
      return { 
        success: true, 
        invitedCount, 
        failedCount 
      };
      
    } catch (error) {
      console.error('Error inviting members:', error);
      return { success: false, error: 'Failed to invite members' };
    }
  }
  
  /**
   * Generate secure project key using advanced cryptographic methods
   * Format: First 2 chars from project name + 6 secure chars = 8 total
   */
  private static async generateProjectKey(projectName: string, clubId: string): Promise<string> {
    // Get first 2 characters from project name
    const nameBase = projectName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 2)
      .padEnd(2, 'X');
    
    let projectKey: string;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      // Generate cryptographically secure random nonce
      const nonce = crypto.randomBytes(32);
      
      // Get 5 characters from project name for XOR operation
      const nameChars = projectName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 5)
        .padEnd(5, 'Z');
      
      // Convert name chars to bytes
      const nameBytes = Buffer.from(nameChars, 'utf8');
      
      // Multi-stage XOR operation for enhanced security
      const stage1 = Buffer.alloc(5);
      for (let i = 0; i < 5; i++) {
        stage1[i] = nameBytes[i] ^ nonce[i] ^ nonce[i + 8] ^ nonce[i + 16];
      }
      
      // Create HMAC-SHA256 with club-specific salt
      const hmac = crypto.createHmac('sha256', Buffer.concat([nonce.slice(0, 16), Buffer.from(clubId)]));
      hmac.update(stage1);
      hmac.update(projectName);
      hmac.update(Date.now().toString());
      if (!process.env.NEXTAUTH_SECRET) {
        throw new Error('NEXTAUTH_SECRET not configured for project key generation');
      }
      hmac.update(process.env.NEXTAUTH_SECRET);
      
      const hashResult = hmac.digest('hex');
      
      // Take 6 characters from hash (ensuring alphanumeric)
      const hashPart = hashResult
        .toUpperCase()
        .replace(/[^A-F0-9]/g, '')
        .substring(0, 6);
      
      projectKey = nameBase + hashPart;
      attempts++;
      
    } while (await this.isProjectKeyExists(projectKey, clubId) && attempts < maxAttempts);
    
    // Fallback if all attempts failed (very unlikely)
    if (attempts >= maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      projectKey = nameBase + timestamp;
    }
    
    return projectKey;
  }
  
  private static async isProjectKeyExists(projectKey: string, clubId: string): Promise<boolean> {
    const result = await db.query(
      'SELECT 1 FROM projects WHERE project_key = $1 AND club_id = $2',
      [projectKey, clubId]
    );
    return result.rows.length > 0;
  }
  
  /**
   * Generate highly secure access password using advanced cryptographic algorithms
   * Format: First 2 chars from project name + 12 secure characters = 14 total (upgraded from 12)
   */
  private static async generateAccessPassword(projectName: string, creatorId: string): Promise<string> {
    // Get creator's information for additional entropy
    const userQuery = 'SELECT name, email FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [creatorId]);
    const creatorData = userResult.rows[0] || { name: 'USER', email: 'user@zenith.edu' };
    
    // Generate multiple cryptographically secure nonces
    const nonce1 = crypto.randomBytes(64); // Increased size
    const nonce2 = crypto.randomBytes(64);
    const nonce3 = crypto.randomBytes(32);
    const nonce4 = crypto.randomBytes(16);
    
    // Get first 2 characters from project name for prefix
    const projectPrefix = projectName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 2)
      .padEnd(2, 'P');
    
    // Prepare project name (5 chars) for cryptographic operations
    const projectChars = projectName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 5)
      .padEnd(5, 'P');
    
    // Prepare creator data (6 chars total: 4 from name + 2 from email domain)
    const creatorChars = creatorData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4)
      .padEnd(4, 'U');
    
    const emailDomain = creatorData.email.split('@')[1] || 'zenith.edu';
    const domainChars = emailDomain
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 2)
      .padEnd(2, 'Z');
    
    // Convert to bytes for XOR operations
    const projectBytes = Buffer.from(projectChars, 'utf8');
    const creatorBytes = Buffer.from(creatorChars + domainChars, 'utf8');
    
    // Multi-stage XOR operations with different nonces
    const stage1 = Buffer.alloc(5);
    const stage2 = Buffer.alloc(6);
    
    // Stage 1: Project name XOR with multiple nonces
    for (let i = 0; i < 5; i++) {
      stage1[i] = projectBytes[i] ^ 
                   nonce1[i] ^ 
                   nonce2[i + 10] ^ 
                   nonce3[i % 32] ^
                   nonce4[i % 16];
    }
    
    // Stage 2: Creator data XOR with different nonce combinations  
    for (let i = 0; i < 6; i++) {
      stage2[i] = creatorBytes[i] ^ 
                   nonce2[i] ^ 
                   nonce1[i + 20] ^ 
                   nonce3[(i + 5) % 32] ^
                   nonce4[(i + 3) % 16];
    }
    
    // Create PBKDF2 key derivation for maximum security
    const salt = Buffer.concat([nonce3, nonce4, Buffer.from(creatorId)]);
    const iterations = 150000; // High iteration count
    
    const derivedKey = crypto.pbkdf2Sync(
      Buffer.concat([stage1, stage2]), 
      salt, 
      iterations, 
      32, 
      'sha512'
    );
    
    // Create HMAC-SHA512 for final hash
    const hmac = crypto.createHmac('sha512', nonce4);
    hmac.update(derivedKey);
    hmac.update(stage1);
    hmac.update(stage2);
    hmac.update(creatorId);
    hmac.update(projectName);
    hmac.update(Date.now().toString());
    hmac.update(process.env.NEXTAUTH_SECRET || 'zenith-ultimate-secret');
    
    const hmacResult = hmac.digest('hex');
    
    // Create final secure password (12 characters after 2 prefix chars)
    const securePassword = projectPrefix + hmacResult
      .toUpperCase()
      .replace(/[^A-F0-9]/g, '')
      .substring(0, 12);
    
    // Verify uniqueness with exponential backoff
    let attempts = 0;
    let finalPassword = securePassword;
    
    while (attempts < 5) {
      const existsQuery = 'SELECT 1 FROM projects WHERE access_password = $1';
      const existsResult = await db.query(existsQuery, [finalPassword]);
      
      if (existsResult.rows.length === 0) {
        break; // Password is unique
      }
      
      // Generate alternative using different nonce if collision occurs
      const altNonce = crypto.randomBytes(32);
      const altHmac = crypto.createHmac('sha512', altNonce);
      altHmac.update(securePassword);
      altHmac.update(attempts.toString());
      altHmac.update(Date.now().toString());
      
      finalPassword = projectPrefix + altHmac.digest('hex')
        .toUpperCase()
        .replace(/[^A-F0-9]/g, '')
        .substring(0, 12);
      
      attempts++;
    }
    
    return finalPassword;
  }

  /**
   * Delete a project and all associated data
   */
  static async deleteProject(projectId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Start a transaction
      await db.query('BEGIN');

      // Check if project exists
      const projectQuery = 'SELECT * FROM projects WHERE id = $1';
      const projectResult = await db.query(projectQuery, [projectId]);
      
      if (projectResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return { success: false, error: 'Project not found' };
      }

      // Delete project activities
      await db.query('DELETE FROM project_activities WHERE project_id = $1', [projectId]);

      // Delete project tasks
      await db.query('DELETE FROM tasks WHERE project_id = $1', [projectId]);

      // Delete project members
      await db.query('DELETE FROM project_members WHERE project_id = $1', [projectId]);

      // Delete project invitations
      await db.query('DELETE FROM project_invitations WHERE project_id = $1', [projectId]);

      // Delete the project itself
      await db.query('DELETE FROM projects WHERE id = $1', [projectId]);

      // Log the deletion activity
      await db.query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description, created_at)
         VALUES ($1, 'delete', 'project', $2, 'Project deleted', NOW())`,
        [userId, projectId]
      );

      await db.query('COMMIT');
      
      return { success: true };
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error deleting project:', error);
      return { success: false, error: 'Failed to delete project' };
    }
  }

  /**
   * Get project by ID
   */
  static async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const query = `
        SELECT 
          p.*,
          u.name as creator_name,
          u.email as creator_email,
          c.name as club_name
        FROM projects p
        JOIN users u ON p.created_by = u.id
        JOIN clubs c ON p.club_id = c.id
        WHERE p.id = $1
      `;
      
      const result = await db.query(query, [projectId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting project by ID:', error);
      return null;
    }
  }
}
