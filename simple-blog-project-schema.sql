-- Simple Blog and Project Management Schema
-- This script adds the missing posts table and creates a basic project management system

-- Posts table (enhanced blog system)
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title character varying NOT NULL,
    content text NOT NULL,
    author_id uuid,
    club_id character varying,
    category character varying DEFAULT 'blog'::character varying,
    post_type character varying DEFAULT 'blog'::character varying,
    tags text[] DEFAULT '{}'::text[],
    
    -- Blog-specific fields
    excerpt text,
    reading_time_minutes integer DEFAULT 0,
    featured_image_url text,
    post_images jsonb DEFAULT '[]'::jsonb,
    
    -- Content blocks for rich content
    content_blocks jsonb DEFAULT '[]'::jsonb,
    
    -- SEO
    meta_description text,
    slug character varying UNIQUE,
    
    -- Status
    status character varying DEFAULT 'draft'::character varying,
    is_featured boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    
    -- Engagement
    view_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    
    -- Publishing
    published_at timestamp with time zone,
    
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

-- Comments table (keeping simple for now)
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    post_id uuid,
    author_id uuid,
    content text NOT NULL,
    parent_id uuid,
    likes_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
    CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id),
    CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying NOT NULL,
    description text,
    club_id character varying NOT NULL,
    created_by uuid NOT NULL,
    
    -- Project details
    project_key character varying NOT NULL,
    project_type character varying DEFAULT 'development'::character varying,
    priority character varying DEFAULT 'medium'::character varying,
    status character varying DEFAULT 'planning'::character varying,
    
    -- Dates
    start_date date,
    target_end_date date,
    actual_end_date date,
    
    -- Access control
    access_password character varying,
    is_public boolean DEFAULT false,
    
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
    role character varying DEFAULT 'member'::character varying,
    
    -- Status
    status character varying DEFAULT 'active'::character varying,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    invited_by uuid,
    
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT project_members_pkey PRIMARY KEY (id),
    CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT project_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id),
    CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

-- Tasks table (Jira-like functionality)
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    
    -- Task details
    title character varying NOT NULL,
    description text,
    task_key character varying NOT NULL,
    task_type character varying DEFAULT 'task'::character varying,
    priority character varying DEFAULT 'medium'::character varying,
    status character varying DEFAULT 'todo'::character varying,
    
    -- Assignment
    assignee_id uuid,
    reporter_id uuid NOT NULL,
    
    -- Task hierarchy
    parent_task_id uuid,
    
    -- Estimation
    story_points integer,
    time_spent_hours numeric DEFAULT 0,
    
    -- Dates
    due_date timestamp with time zone,
    completed_date timestamp with time zone,
    
    -- Progress
    is_completed boolean DEFAULT false,
    
    -- Metadata
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id),
    CONSTRAINT tasks_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id),
    CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id),
    CONSTRAINT unique_task_key_project UNIQUE (project_id, task_key)
);

-- Project Invitations table
CREATE TABLE IF NOT EXISTS public.project_invitations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    inviter_id uuid NOT NULL,
    
    -- Invitation details
    email character varying NOT NULL,
    role character varying DEFAULT 'member'::character varying,
    invitation_token character varying NOT NULL UNIQUE,
    
    -- Project access
    project_password character varying,
    
    -- Status
    status character varying DEFAULT 'pending'::character varying,
    message text,
    
    -- Expiration
    expires_at timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    -- Tracking
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    accepted_at timestamp with time zone,
    
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT project_invitations_pkey PRIMARY KEY (id),
    CONSTRAINT project_invitations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT project_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_club_id ON public.posts(club_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON public.posts USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);

CREATE INDEX IF NOT EXISTS idx_projects_club_id ON public.projects(club_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Create functions and triggers
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

DROP TRIGGER IF EXISTS tasks_update_project_progress ON public.tasks;
CREATE TRIGGER tasks_update_project_progress 
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo 'Blog and Project Management schema created successfully!'
\echo 'Added: posts, likes, comments, projects, project_members, tasks, project_invitations'
\echo 'Features: Rich blog content, project management with Jira-like tasks, email invitations'
