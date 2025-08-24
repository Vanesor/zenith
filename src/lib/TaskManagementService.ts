import db from './database';
import { ProjectPermissionService } from './ProjectPermissionService';

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
  labels?: string[];
  created_at: string;
  updated_at: string;
  assignee?: any;
  reporter?: any;
  subtasks?: Task[];
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  created_at: string;
  user?: any;
}

export class TaskManagementService {
  
  /**
   * Create a new task
   */
  static async createTask(data: {
    project_id: string;
    title: string;
    description?: string;
    task_type?: string;
    priority?: string;
    assignee_id?: string;
    reporter_id: string;
    parent_task_id?: string;
    due_date?: string;
    estimated_hours?: number;
    labels?: string[];
  }): Promise<{ success: boolean; task?: Task; error?: string }> {
    try {
      // Check permissions
      const permissions = await ProjectPermissionService.getUserPermissions(data.reporter_id, data.project_id);
      if (!permissions.canCreateTasks) {
        return { success: false, error: 'Insufficient permissions to create tasks' };
      }
      
      // Generate task key
      const taskKey = await this.generateTaskKey(data.project_id);
      
      const query = `
        INSERT INTO tasks (
          project_id, title, description, task_key, task_type, priority,
          assignee_id, reporter_id, parent_task_id, due_date,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'todo')
        RETURNING *
      `;
      
      const result = await db.query(query, [
        data.project_id,
        data.title,
        data.description,
        taskKey,
        data.task_type || 'task',
        data.priority || 'medium',
        data.assignee_id,
        data.reporter_id,
        data.parent_task_id,
        data.due_date
      ]);
      
      const task = result.rows[0];
      
      // Update project task count
      await this.updateProjectTaskCounts(data.project_id);
      
      // Log activity
      await this.logTaskActivity(task.id, data.reporter_id, 'created', null, null, null, `Created task: ${data.title}`);
      
      return { success: true, task };
      
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: 'Failed to create task' };
    }
  }
  
  /**
   * Get tasks for a project
   */
  static async getProjectTasks(
    projectId: string,
    userId: string,
    filters?: {
      status?: string;
      assignee_id?: string;
      priority?: string;
      task_type?: string;
      search?: string;
    }
  ): Promise<{ success: boolean; tasks?: Task[]; error?: string }> {
    try {
      // Check access
      const canAccess = await ProjectPermissionService.canAccessProject(userId, projectId);
      if (!canAccess) {
        return { success: false, error: 'Access denied to this project' };
      }
      
      let query = `
        SELECT t.*,
          assignee.name as assignee_name,
          assignee.email as assignee_email,
          reporter.name as reporter_name,
          reporter.email as reporter_email,
          (SELECT COUNT(*) FROM tasks WHERE parent_task_id = t.id) as subtask_count,
          p.project_key
        FROM tasks t
        LEFT JOIN users assignee ON t.assignee_id = assignee.id
        LEFT JOIN users reporter ON t.reporter_id = reporter.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.project_id = $1
      `;
      
      const conditions = [];
      const params = [projectId];
      let paramCount = 1;
      
      if (filters?.status) {
        conditions.push(`t.status = $${++paramCount}`);
        params.push(filters.status);
      }
      
      if (filters?.assignee_id) {
        conditions.push(`t.assignee_id = $${++paramCount}`);
        params.push(filters.assignee_id);
      }
      
      if (filters?.priority) {
        conditions.push(`t.priority = $${++paramCount}`);
        params.push(filters.priority);
      }
      
      if (filters?.task_type) {
        conditions.push(`t.task_type = $${++paramCount}`);
        params.push(filters.task_type);
      }
      
      if (filters?.search) {
        conditions.push(`(
          t.title ILIKE $${++paramCount} OR 
          t.description ILIKE $${paramCount} OR
          t.task_key ILIKE $${paramCount}
        )`);
        params.push(`%${filters.search}%`);
      }
      
      if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY 
        CASE t.priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        t.created_at DESC
      `;
      
      const result = await db.query(query, params);
      return { success: true, tasks: result.rows };
      
    } catch (error) {
      console.error('Error getting project tasks:', error);
      return { success: false, error: 'Failed to get tasks' };
    }
  }
  
  /**
   * Get task details with subtasks and activity
   */
  static async getTaskDetails(taskId: string, userId: string): Promise<{
    success: boolean;
    task?: Task & { subtasks: Task[]; activity: TaskActivity[] };
    error?: string;
  }> {
    try {
      // Get task details
      const taskQuery = `
        SELECT t.*,
          assignee.name as assignee_name, assignee.email as assignee_email, assignee.avatar_url as assignee_avatar,
          reporter.name as reporter_name, reporter.email as reporter_email, reporter.avatar_url as reporter_avatar,
          p.project_key, p.name as project_name
        FROM tasks t
        LEFT JOIN users assignee ON t.assignee_id = assignee.id
        LEFT JOIN users reporter ON t.reporter_id = reporter.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = $1
      `;
      
      const taskResult = await db.query(taskQuery, [taskId]);
      
      if (taskResult.rows.length === 0) {
        return { success: false, error: 'Task not found' };
      }
      
      const task = taskResult.rows[0];
      
      // Check project access
      const canAccess = await ProjectPermissionService.canAccessProject(userId, task.project_id);
      if (!canAccess) {
        return { success: false, error: 'Access denied to this task' };
      }
      
      // Get subtasks
      const subtasksQuery = `
        SELECT t.*,
          assignee.name as assignee_name,
          reporter.name as reporter_name
        FROM tasks t
        LEFT JOIN users assignee ON t.assignee_id = assignee.id
        LEFT JOIN users reporter ON t.reporter_id = reporter.id
        WHERE t.parent_task_id = $1
        ORDER BY t.created_at ASC
      `;
      
      const subtasksResult = await db.query(subtasksQuery, [taskId]);
      
      // Get task activity (if table exists)
      let activity = [];
      try {
        const activityQuery = `
          SELECT ta.*, u.name as user_name, u.avatar_url
          FROM task_activity ta
          LEFT JOIN users u ON ta.user_id = u.id
          WHERE ta.task_id = $1
          ORDER BY ta.created_at DESC
          LIMIT 20
        `;
        
        const activityResult = await db.query(activityQuery, [taskId]);
        activity = activityResult.rows;
      } catch (err) {
        // Task activity table might not exist yet
        console.log('Task activity table not found, skipping activity history');
      }
      
      return {
        success: true,
        task: {
          ...task,
          subtasks: subtasksResult.rows,
          activity
        }
      };
      
    } catch (error) {
      console.error('Error getting task details:', error);
      return { success: false, error: 'Failed to get task details' };
    }
  }
  
  /**
   * Update task status
   */
  static async updateTaskStatus(
    taskId: string,
    newStatus: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current task
      const currentTask = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      
      if (currentTask.rows.length === 0) {
        return { success: false, error: 'Task not found' };
      }
      
      const task = currentTask.rows[0];
      const oldStatus = task.status;
      
      // Check permissions
      const permissions = await ProjectPermissionService.getUserPermissions(userId, task.project_id);
      if (!permissions.canEditTasks) {
        return { success: false, error: 'Insufficient permissions to update task' };
      }
      
      // Update task
      const updateQuery = `
        UPDATE tasks 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      await db.query(updateQuery, [newStatus, taskId]);
      
      // Update project task counts
      await this.updateProjectTaskCounts(task.project_id);
      
      // Log activity
      await this.logTaskActivity(taskId, userId, 'status_changed', 'status', oldStatus, newStatus);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error updating task status:', error);
      return { success: false, error: 'Failed to update task status' };
    }
  }
  
  /**
   * Assign task to user
   */
  static async assignTask(
    taskId: string,
    assigneeId: string | null,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current task
      const currentTask = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      
      if (currentTask.rows.length === 0) {
        return { success: false, error: 'Task not found' };
      }
      
      const task = currentTask.rows[0];
      const oldAssignee = task.assignee_id;
      
      // Check permissions
      const permissions = await ProjectPermissionService.getUserPermissions(userId, task.project_id);
      if (!permissions.canAssignTasks) {
        return { success: false, error: 'Insufficient permissions to assign task' };
      }
      
      // Update task
      const updateQuery = `
        UPDATE tasks 
        SET assignee_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      await db.query(updateQuery, [assigneeId, taskId]);
      
      // Log activity
      const oldAssigneeName = oldAssignee ? (await db.query('SELECT name FROM users WHERE id = $1', [oldAssignee])).rows[0]?.name : 'Unassigned';
      const newAssigneeName = assigneeId ? (await db.query('SELECT name FROM users WHERE id = $1', [assigneeId])).rows[0]?.name : 'Unassigned';
      
      await this.logTaskActivity(taskId, userId, 'assignee_changed', 'assignee', oldAssigneeName, newAssigneeName);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error assigning task:', error);
      return { success: false, error: 'Failed to assign task' };
    }
  }
  
  /**
   * Get task statistics for dashboard
   */
  static async getTaskStatistics(projectId: string): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'todo') as todo_tasks,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
          COUNT(*) FILTER (WHERE status = 'in_review') as in_review_tasks,
          COUNT(*) FILTER (WHERE status = 'done') as done_tasks,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical_tasks,
          COUNT(*) FILTER (WHERE priority = 'high') as high_priority_tasks,
          COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done') as overdue_tasks,
          ROUND(
            COALESCE(
              COUNT(*) FILTER (WHERE status = 'done') * 100.0 / NULLIF(COUNT(*), 0),
              0
            ), 1
          ) as completion_percentage
        FROM tasks 
        WHERE project_id = $1
      `;
      
      const result = await db.query(query, [projectId]);
      return result.rows[0];
      
    } catch (error) {
      console.error('Error getting task statistics:', error);
      return null;
    }
  }
  
  /**
   * Generate unique task key for project
   */
  private static async generateTaskKey(projectId: string): Promise<string> {
    // Get project key
    const projectResult = await db.query('SELECT project_key FROM projects WHERE id = $1', [projectId]);
    const projectKey = projectResult.rows[0]?.project_key || 'TASK';
    
    // Get next task number
    const countResult = await db.query(
      'SELECT COUNT(*) + 1 as next_number FROM tasks WHERE project_id = $1',
      [projectId]
    );
    
    const nextNumber = countResult.rows[0].next_number;
    
    return `${projectKey}-${nextNumber}`;
  }
  
  /**
   * Update project task counts
   */
  private static async updateProjectTaskCounts(projectId: string): Promise<void> {
    try {
      const query = `
        UPDATE projects 
        SET 
          total_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = $1),
          completed_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = 'done'),
          progress_percentage = ROUND(
            COALESCE(
              (SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = 'done') * 100.0 / 
              NULLIF((SELECT COUNT(*) FROM tasks WHERE project_id = $1), 0),
              0
            ), 1
          )
        WHERE id = $1
      `;
      
      await db.query(query, [projectId]);
    } catch (error) {
      console.error('Error updating project task counts:', error);
    }
  }
  
  /**
   * Log task activity
   */
  private static async logTaskActivity(
    taskId: string,
    userId: string,
    action: string,
    fieldChanged?: string | null,
    oldValue?: string | null,
    newValue?: string | null,
    comment?: string | null
  ): Promise<void> {
    try {
      // Check if task_activity table exists, if not create it
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS task_activity (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          task_id uuid NOT NULL,
          user_id uuid NOT NULL,
          action character varying NOT NULL,
          field_changed character varying,
          old_value text,
          new_value text,
          comment text,
          created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT task_activity_pkey PRIMARY KEY (id),
          CONSTRAINT task_activity_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          CONSTRAINT task_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `;
      
      await db.query(createTableQuery);
      
      const query = `
        INSERT INTO task_activity (task_id, user_id, action, field_changed, old_value, new_value, comment)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await db.query(query, [taskId, userId, action, fieldChanged, oldValue, newValue, comment]);
    } catch (error) {
      console.error('Error logging task activity:', error);
      // Don't fail the main operation if activity logging fails
    }
  }

  /**
   * Update task with multiple fields
   */
  static async updateTask(
    taskId: string,
    userId: string,
    updateData: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assignee_id?: string;
      due_date?: string;
    }
  ): Promise<{ success: boolean; task?: any; error?: string }> {
    try {
      // Get current task
      const currentTask = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      
      if (currentTask.rows.length === 0) {
        return { success: false, error: 'Task not found' };
      }
      
      const task = currentTask.rows[0];
      
      // Check permissions
      const permissions = await ProjectPermissionService.getUserPermissions(userId, task.project_id);
      if (!permissions.canEditTasks) {
        return { success: false, error: 'Insufficient permissions to update task' };
      }
      
      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;
      
      if (updateData.title !== undefined) {
        updateFields.push(`title = $${paramCounter}`);
        updateValues.push(updateData.title);
        paramCounter++;
      }
      
      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCounter}`);
        updateValues.push(updateData.description);
        paramCounter++;
      }
      
      if (updateData.status !== undefined) {
        updateFields.push(`status = $${paramCounter}`);
        updateValues.push(updateData.status);
        paramCounter++;
      }
      
      if (updateData.priority !== undefined) {
        updateFields.push(`priority = $${paramCounter}`);
        updateValues.push(updateData.priority);
        paramCounter++;
      }
      
      if (updateData.assignee_id !== undefined) {
        updateFields.push(`assignee_id = $${paramCounter}`);
        updateValues.push(updateData.assignee_id);
        paramCounter++;
      }
      
      if (updateData.due_date !== undefined) {
        updateFields.push(`due_date = $${paramCounter}`);
        updateValues.push(updateData.due_date);
        paramCounter++;
      }
      
      if (updateFields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(taskId);
      
      const updateQuery = `
        UPDATE tasks 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;
      
      const result = await db.query(updateQuery, updateValues);
      const updatedTask = result.rows[0];
      
      // Update project task counts if status changed
      if (updateData.status !== undefined) {
        await this.updateProjectTaskCounts(task.project_id);
      }
      
      // Log activities for changed fields
      if (updateData.status !== undefined && updateData.status !== task.status) {
        await this.logTaskActivity(taskId, userId, 'status_changed', 'status', task.status, updateData.status);
      }
      
      if (updateData.assignee_id !== undefined && updateData.assignee_id !== task.assignee_id) {
        const oldAssigneeName = task.assignee_id ? (await db.query('SELECT name FROM users WHERE id = $1', [task.assignee_id])).rows[0]?.name : 'Unassigned';
        const newAssigneeName = updateData.assignee_id ? (await db.query('SELECT name FROM users WHERE id = $1', [updateData.assignee_id])).rows[0]?.name : 'Unassigned';
        await this.logTaskActivity(taskId, userId, 'assignee_changed', 'assignee', oldAssigneeName, newAssigneeName);
      }
      
      if (updateData.priority !== undefined && updateData.priority !== task.priority) {
        await this.logTaskActivity(taskId, userId, 'priority_changed', 'priority', task.priority, updateData.priority);
      }
      
      return { success: true, task: updatedTask };
      
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: 'Failed to update task' };
    }
  }

  /**
   * Delete task
   */
  static async deleteTask(
    taskId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current task
      const currentTask = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      
      if (currentTask.rows.length === 0) {
        return { success: false, error: 'Task not found' };
      }
      
      const task = currentTask.rows[0];
      
      // Check permissions
      const permissions = await ProjectPermissionService.getUserPermissions(userId, task.project_id);
      if (!permissions.canDeleteTasks) {
        return { success: false, error: 'Insufficient permissions to delete task' };
      }
      
      // Log activity before deleting the task to avoid foreign key constraint errors
      try {
        await this.logTaskActivity(taskId, userId, 'task_deleted', null, null, null, `Task "${task.title}" was deleted`);
      } catch (error) {
        console.error('Error logging task activity:', error);
        // Continue with deletion even if logging fails
      }
      
      // Delete task (cascading will handle related records)
      await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
      
      // Update project task counts
      await this.updateProjectTaskCounts(task.project_id);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: 'Failed to delete task' };
    }
  }
}
