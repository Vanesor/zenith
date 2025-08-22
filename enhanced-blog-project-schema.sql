-- Enhanced Database Migration for Blog System and Project Management
-- This script adds missing tables and creates the project management system

BEGIN;

-- First, add the missing tables that are causing errors

-- Posts table (transformed into blog system)
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title character varying NOT NULL,
    content text NOT NULL,
    author_id uuid,
    club_id character varying,
    category character varying DEFAULT 'blog'::character varying, -- blog, announcement, tutorial
    post_type character varying DEFAULT 'blog'::character varying, -- blog, code_snippet, tutorial, video_embed
    tags text[] DEFAULT '{}'::text[],
    
    -- Blog-specific fields
    excerpt text, -- Short description for blog preview
    reading_time_minutes integer DEFAULT 0,
    featured_image_url text,
    post_images jsonb DEFAULT '[]'::jsonb,
    
    -- Content blocks for rich content (code snippets, videos, etc.)
    content_blocks jsonb DEFAULT '[]'::jsonb, -- Array of content blocks
    -- Example content_blocks structure:
    -- [
    --   {"type": "text", "content": "Some text"},
    --   {"type": "code", "language": "javascript", "content": "console.log('hello')", "title": "Example JS"},
    --   {"type": "video", "url": "https://youtube.com/watch?v=...", "title": "Tutorial Video"},
    --   {"type": "link", "url": "https://example.com", "title": "Useful Link", "description": "Link description"}
    -- ]
    
    -- Metadata
    meta_description text, -- SEO description
    meta_keywords text[], -- SEO keywords
    slug character varying UNIQUE, -- URL-friendly slug
    
    -- Status and visibility
    status character varying DEFAULT 'draft'::character varying, -- draft, published, archived
    is_featured boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    
    -- Engagement
    view_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    shares_count integer DEFAULT 0,
    
    -- Publishing
    published_at timestamp with time zone,
    scheduled_publish_at timestamp with time zone,
    
    -- Standard fields
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    edited_by uuid,
    
    -- Search
    search_vector tsvector DEFAULT to_tsvector('english'::regconfig, ''),
    
    CONSTRAINT posts_pkey PRIMARY KEY (id),
    CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
    CONSTRAINT posts_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
    CONSTRAINT posts_edited_by_fkey FOREIGN KEY (edited_by) REFERENCES public.users(id)
);

-- Comments table (removed as per your request, but keeping for reference if needed later)
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    post_id uuid,
    author_id uuid,
    content text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false,
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
    CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id),
    CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);

-- Likes table (for blog posts)
CREATE TABLE IF NOT EXISTS public.likes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    post_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT likes_pkey PRIMARY KEY (id),
    CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
    CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
);

-- Blog Categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying NOT NULL UNIQUE,
    slug character varying NOT NULL UNIQUE,
    description text,
    color character varying DEFAULT '#3B82F6'::character varying,
    icon character varying,
    parent_id uuid,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT blog_categories_pkey PRIMARY KEY (id),
    CONSTRAINT blog_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blog_categories(id)
);

-- Blog Tags table
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying NOT NULL UNIQUE,
    slug character varying NOT NULL UNIQUE,
    description text,
    color character varying DEFAULT '#6B7280'::character varying,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT blog_tags_pkey PRIMARY KEY (id)
);

-- Post Categories junction table
CREATE TABLE IF NOT EXISTS public.post_categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    post_id uuid NOT NULL,
    category_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT post_categories_pkey PRIMARY KEY (id),
    CONSTRAINT post_categories_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
    CONSTRAINT post_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE CASCADE,
    CONSTRAINT unique_post_category UNIQUE (post_id, category_id)
);

-- Post Tags junction table
CREATE TABLE IF NOT EXISTS public.post_tags (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    post_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT post_tags_pkey PRIMARY KEY (id),
    CONSTRAINT post_tags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
    CONSTRAINT post_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    CONSTRAINT unique_post_tag UNIQUE (post_id, tag_id)
);

-- ====================
-- PROJECT MANAGEMENT SYSTEM
-- ====================

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying NOT NULL,
    description text,
    club_id character varying NOT NULL,
    created_by uuid NOT NULL,
    
    -- Project details
    project_key character varying NOT NULL, -- Short key like "PROJ", "WEB", etc.
    project_type character varying DEFAULT 'development'::character varying, -- development, research, event, marketing
    priority character varying DEFAULT 'medium'::character varying, -- low, medium, high, critical
    status character varying DEFAULT 'planning'::character varying, -- planning, active, on_hold, completed, cancelled
    
    -- Dates
    start_date date,
    target_end_date date,
    actual_end_date date,
    
    -- Access control
    access_password character varying, -- Password for joining project (hashed)
    is_public boolean DEFAULT false,
    invite_only boolean DEFAULT true,
    
    -- Project settings
    settings jsonb DEFAULT '{
        "allowGuestView": false,
        "requireApprovalForTasks": false,
        "allowMemberInvites": true,
        "emailNotifications": true,
        "slackIntegration": false
    }'::jsonb,
    
    -- Metadata
    cover_image_url text,
    project_images jsonb DEFAULT '[]'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    
    -- Progress tracking
    progress_percentage numeric DEFAULT 0,
    total_tasks integer DEFAULT 0,
    completed_tasks integer DEFAULT 0,
    
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT projects_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
    CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
    CONSTRAINT unique_project_key_club UNIQUE (club_id, project_key)
);

-- Project Members table
CREATE TABLE IF NOT EXISTS public.project_members (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying DEFAULT 'member'::character varying, -- admin, manager, member, viewer
    
    -- Member details
    title character varying, -- Custom title in project (e.g., "Frontend Developer", "Designer")
    permissions jsonb DEFAULT '{
        "canCreateTasks": true,
        "canEditTasks": true,
        "canDeleteTasks": false,
        "canAssignTasks": true,
        "canInviteMembers": false,
        "canManageProject": false
    }'::jsonb,
    
    -- Status
    status character varying DEFAULT 'active'::character varying, -- active, inactive, pending
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    invited_by uuid,
    invitation_accepted_at timestamp with time zone,
    
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT project_members_pkey PRIMARY KEY (id),
    CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT project_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id),
    CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

-- Task Categories/Lists (like Epic, Story, Bug, etc.)
CREATE TABLE IF NOT EXISTS public.task_categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    name character varying NOT NULL,
    description text,
    color character varying DEFAULT '#6B7280'::character varying,
    icon character varying,
    sort_order integer DEFAULT 0,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT task_categories_pkey PRIMARY KEY (id),
    CONSTRAINT task_categories_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT unique_category_name_project UNIQUE (project_id, name)
);

-- Tasks table (Jira-like functionality)
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    category_id uuid,
    
    -- Task details
    title character varying NOT NULL,
    description text,
    task_key character varying NOT NULL, -- Auto-generated like "PROJ-123"
    task_type character varying DEFAULT 'task'::character varying, -- task, bug, epic, story, subtask
    priority character varying DEFAULT 'medium'::character varying, -- low, medium, high, critical
    status character varying DEFAULT 'todo'::character varying, -- todo, in_progress, in_review, testing, done, cancelled
    
    -- Assignment
    assignee_id uuid,
    reporter_id uuid NOT NULL,
    
    -- Task hierarchy
    parent_task_id uuid, -- For subtasks
    epic_id uuid, -- Link to epic task
    
    -- Estimation and tracking
    story_points integer,
    original_estimate_hours numeric,
    remaining_estimate_hours numeric,
    time_spent_hours numeric DEFAULT 0,
    
    -- Dates
    due_date timestamp with time zone,
    start_date timestamp with time zone,
    completed_date timestamp with time zone,
    
    -- Task details
    acceptance_criteria text,
    labels text[] DEFAULT '{}'::text[],
    
    -- Attachments and links
    attachments jsonb DEFAULT '[]'::jsonb,
    external_links jsonb DEFAULT '[]'::jsonb,
    
    -- Progress
    progress_percentage numeric DEFAULT 0,
    is_completed boolean DEFAULT false,
    
    -- Metadata
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT tasks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.task_categories(id),
    CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id),
    CONSTRAINT tasks_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id),
    CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id),
    CONSTRAINT tasks_epic_id_fkey FOREIGN KEY (epic_id) REFERENCES public.tasks(id),
    CONSTRAINT unique_task_key_project UNIQUE (project_id, task_key)
);

-- Task Comments
CREATE TABLE IF NOT EXISTS public.task_comments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    comment_type character varying DEFAULT 'comment'::character varying, -- comment, system, mention
    
    -- Metadata
    is_internal boolean DEFAULT false, -- Internal comments not visible to clients
    attachments jsonb DEFAULT '[]'::jsonb,
    mentions jsonb DEFAULT '[]'::jsonb, -- Array of mentioned user IDs
    
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT task_comments_pkey PRIMARY KEY (id),
    CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
    CONSTRAINT task_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);

-- Task Watchers (users who want to be notified about task updates)
CREATE TABLE IF NOT EXISTS public.task_watchers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT task_watchers_pkey PRIMARY KEY (id),
    CONSTRAINT task_watchers_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
    CONSTRAINT task_watchers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT unique_task_watcher UNIQUE (task_id, user_id)
);

-- Task Time Logs (for time tracking)
CREATE TABLE IF NOT EXISTS public.task_time_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    
    -- Time tracking
    time_spent_hours numeric NOT NULL,
    log_date date NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    
    -- Description
    description text,
    work_type character varying DEFAULT 'development'::character varying, -- development, testing, design, research, meeting
    
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT task_time_logs_pkey PRIMARY KEY (id),
    CONSTRAINT task_time_logs_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
    CONSTRAINT task_time_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Task History (audit trail for task changes)
CREATE TABLE IF NOT EXISTS public.task_history (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    
    -- Change details
    action character varying NOT NULL, -- created, updated, assigned, status_changed, deleted
    field_name character varying, -- Which field was changed
    old_value text,
    new_value text,
    
    -- Additional context
    description text,
    
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT task_history_pkey PRIMARY KEY (id),
    CONSTRAINT task_history_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
    CONSTRAINT task_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Project Invitations (for email-based invites)
CREATE TABLE IF NOT EXISTS public.project_invitations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    inviter_id uuid NOT NULL,
    
    -- Invitation details
    email character varying NOT NULL,
    role character varying DEFAULT 'member'::character varying,
    title character varying,
    invitation_token character varying NOT NULL UNIQUE,
    
    -- Project access (if password protected)
    project_password character varying,
    
    -- Status
    status character varying DEFAULT 'pending'::character varying, -- pending, accepted, expired, cancelled
    message text,
    
    -- Expiration
    expires_at timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    -- Tracking
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    accepted_at timestamp with time zone,
    accepted_by uuid,
    
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT project_invitations_pkey PRIMARY KEY (id),
    CONSTRAINT project_invitations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT project_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id),
    CONSTRAINT project_invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.users(id)
);

-- Project Sprints (for Agile methodology)
CREATE TABLE IF NOT EXISTS public.sprints (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    name character varying NOT NULL,
    goal text,
    
    -- Sprint details
    sprint_number integer NOT NULL,
    status character varying DEFAULT 'planned'::character varying, -- planned, active, completed, cancelled
    
    -- Dates
    start_date date NOT NULL,
    end_date date NOT NULL,
    completed_date date,
    
    -- Metrics
    planned_points integer DEFAULT 0,
    completed_points integer DEFAULT 0,
    
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT sprints_pkey PRIMARY KEY (id),
    CONSTRAINT sprints_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT unique_sprint_number_project UNIQUE (project_id, sprint_number)
);

-- Sprint Tasks (many-to-many relationship between sprints and tasks)
CREATE TABLE IF NOT EXISTS public.sprint_tasks (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    sprint_id uuid NOT NULL,
    task_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT sprint_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT sprint_tasks_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES public.sprints(id) ON DELETE CASCADE,
    CONSTRAINT sprint_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
    CONSTRAINT unique_sprint_task UNIQUE (sprint_id, task_id)
);

-- ==================
-- INDEXES FOR PERFORMANCE
-- ==================

-- Blog indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_club_id ON public.posts(club_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON public.posts USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING gin(tags);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- Blog categories and tags
CREATE INDEX IF NOT EXISTS idx_blog_categories_parent_id ON public.blog_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags(slug);

-- Project management indexes
CREATE INDEX IF NOT EXISTS idx_projects_club_id ON public.projects(club_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_project_key ON public.projects(project_key);

-- Project members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON public.project_members(role);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_reporter_id ON public.tasks(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_epic_id ON public.tasks(epic_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_key ON public.tasks(task_key);
CREATE INDEX IF NOT EXISTS idx_tasks_labels ON public.tasks USING gin(labels);

-- Task comments and watchers
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON public.task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_watchers_task_id ON public.task_watchers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_watchers_user_id ON public.task_watchers(user_id);

-- Time logs and history
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON public.task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON public.task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_log_date ON public.task_time_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON public.task_history(task_id);

-- Sprints
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON public.sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON public.sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_sprint_id ON public.sprint_tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_task_id ON public.sprint_tasks(task_id);

-- ==================
-- TRIGGERS AND FUNCTIONS
-- ==================

-- Function to update post search vector
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.content, '') || ' ' || 
        COALESCE(NEW.excerpt, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector on posts
DROP TRIGGER IF EXISTS posts_search_vector_update ON public.posts;
CREATE TRIGGER posts_search_vector_update 
    BEFORE INSERT OR UPDATE ON public.posts 
    FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Function to auto-generate task key
CREATE OR REPLACE FUNCTION generate_task_key()
RETURNS TRIGGER AS $$
DECLARE
    project_key_val text;
    next_number integer;
BEGIN
    -- Get project key
    SELECT project_key INTO project_key_val 
    FROM projects 
    WHERE id = NEW.project_id;
    
    -- Get next task number for this project
    SELECT COALESCE(MAX(CAST(SUBSTRING(task_key FROM '[0-9]+$') AS integer)), 0) + 1
    INTO next_number
    FROM tasks 
    WHERE project_id = NEW.project_id;
    
    -- Generate the task key
    NEW.task_key := project_key_val || '-' || next_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate task key
DROP TRIGGER IF EXISTS tasks_generate_key ON public.tasks;
CREATE TRIGGER tasks_generate_key 
    BEFORE INSERT ON public.tasks 
    FOR EACH ROW 
    WHEN (NEW.task_key IS NULL OR NEW.task_key = '')
    EXECUTE FUNCTION generate_task_key();

-- Function to update project progress
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks_count integer;
    completed_tasks_count integer;
    progress_pct numeric;
BEGIN
    -- Count total and completed tasks for the project
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_completed = true) as completed
    INTO total_tasks_count, completed_tasks_count
    FROM tasks 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
    
    -- Calculate progress percentage
    IF total_tasks_count > 0 THEN
        progress_pct := (completed_tasks_count::numeric / total_tasks_count::numeric) * 100;
    ELSE
        progress_pct := 0;
    END IF;
    
    -- Update project
    UPDATE projects 
    SET 
        total_tasks = total_tasks_count,
        completed_tasks = completed_tasks_count,
        progress_percentage = progress_pct,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project progress when tasks change
DROP TRIGGER IF EXISTS tasks_update_project_progress ON public.tasks;
CREATE TRIGGER tasks_update_project_progress 
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Function to log task changes
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if this is an UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, description)
            VALUES (NEW.id, NEW.assignee_id, 'status_changed', 'status', OLD.status, NEW.status, 
                   'Status changed from ' || OLD.status || ' to ' || NEW.status);
        END IF;
        
        -- Log assignee changes
        IF OLD.assignee_id != NEW.assignee_id THEN
            INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, description)
            VALUES (NEW.id, NEW.assignee_id, 'assigned', 'assignee_id', 
                   COALESCE(OLD.assignee_id::text, 'null'), COALESCE(NEW.assignee_id::text, 'null'),
                   'Task assignment changed');
        END IF;
        
        -- Log priority changes
        IF OLD.priority != NEW.priority THEN
            INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, description)
            VALUES (NEW.id, NEW.assignee_id, 'updated', 'priority', OLD.priority, NEW.priority,
                   'Priority changed from ' || OLD.priority || ' to ' || NEW.priority);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log task changes
DROP TRIGGER IF EXISTS tasks_log_changes ON public.tasks;
CREATE TRIGGER tasks_log_changes 
    AFTER UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION log_task_changes();

-- Add triggers for updated_at timestamps on new tables
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_members_updated_at BEFORE UPDATE ON public.project_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON public.sprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default blog categories
INSERT INTO public.blog_categories (name, slug, description, color, icon, is_default) VALUES
('General', 'general', 'General blog posts and announcements', '#3B82F6', 'MessageSquare', true),
('Tutorials', 'tutorials', 'Step-by-step tutorials and guides', '#10B981', 'BookOpen', false),
('Code Snippets', 'code-snippets', 'Useful code snippets and examples', '#8B5CF6', 'Code', false),
('News', 'news', 'Latest news and updates', '#F59E0B', 'Newspaper', false),
('Events', 'events', 'Event announcements and recaps', '#EF4444', 'Calendar', false)
ON CONFLICT (slug) DO NOTHING;

-- Insert default task categories for new projects (will be added via trigger when project is created)
CREATE OR REPLACE FUNCTION create_default_task_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default task categories for new project
    INSERT INTO task_categories (project_id, name, description, color, icon, sort_order, is_default) VALUES
    (NEW.id, 'To Do', 'Tasks that need to be started', '#6B7280', 'Circle', 0, true),
    (NEW.id, 'In Progress', 'Tasks currently being worked on', '#3B82F6', 'Play', 1, true),
    (NEW.id, 'In Review', 'Tasks pending review or approval', '#F59E0B', 'Eye', 2, true),
    (NEW.id, 'Done', 'Completed tasks', '#10B981', 'CheckCircle', 3, true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default task categories for new projects
DROP TRIGGER IF EXISTS projects_create_default_categories ON public.projects;
CREATE TRIGGER projects_create_default_categories 
    AFTER INSERT ON public.projects 
    FOR EACH ROW EXECUTE FUNCTION create_default_task_categories();

COMMIT;

-- Success message
\echo 'Enhanced database schema with blog system and project management created successfully!'
\echo 'Blog Features: Rich content blocks, categories, tags, SEO, scheduling'
\echo 'Project Management Features: Jira-like tasks, sprints, time tracking, invitations'
\echo 'All indexes, triggers, and default data have been set up.'
