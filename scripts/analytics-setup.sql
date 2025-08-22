-- SQL Triggers and Functions to automatically update club member counts
-- and track statistics for the analytics dashboard

-- Create statistics tracking tables
CREATE TABLE IF NOT EXISTS club_statistics (
    id SERIAL PRIMARY KEY,
    club_id CHARACTER VARYING REFERENCES clubs(id) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 0,
    event_count INTEGER DEFAULT 0,
    assignment_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    average_engagement NUMERIC(5,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL, 
    target_id TEXT,
    target_name TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_statistics (
    id SERIAL PRIMARY KEY,
    active_users_count INTEGER DEFAULT 0,
    total_users_count INTEGER DEFAULT 0,
    total_clubs_count INTEGER DEFAULT 0,
    total_events_count INTEGER DEFAULT 0,
    total_assignments_count INTEGER DEFAULT 0,
    total_comments_count INTEGER DEFAULT 0,
    daily_active_users INTEGER DEFAULT 0,
    weekly_active_users INTEGER DEFAULT 0,
    monthly_active_users INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cache table for expensive queries
CREATE TABLE IF NOT EXISTS query_cache (
    cache_key TEXT PRIMARY KEY,
    cache_value JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Function to update club member count when a user joins or leaves
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
DECLARE
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update club member count
        UPDATE clubs SET member_count = member_count + 1 
        WHERE id = NEW.club_id;
        
        -- Update club statistics
        UPDATE club_statistics SET 
            member_count = member_count + 1,
            last_updated = NOW()
        WHERE club_id = NEW.club_id;
        
        -- If no statistics record exists, create one
        IF NOT FOUND THEN
            INSERT INTO club_statistics (club_id, member_count)
            VALUES (NEW.club_id, 1);
        END IF;
        
        -- Log user activity
        INSERT INTO user_activities (user_id, action, target_type, target_id, target_name)
        SELECT 
            NEW.user_id, 
            'joined', 
            'club', 
            NEW.club_id, 
            clubs.name
        FROM clubs WHERE id = NEW.club_id;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update club member count
        UPDATE clubs SET member_count = member_count - 1 
        WHERE id = OLD.club_id AND member_count > 0;
        
        -- Update club statistics
        UPDATE club_statistics SET 
            member_count = GREATEST(0, member_count - 1),
            last_updated = NOW()
        WHERE club_id = OLD.club_id;
        
        -- Log user activity
        INSERT INTO user_activities (user_id, action, target_type, target_id, target_name)
        SELECT 
            OLD.user_id, 
            'left', 
            'club', 
            OLD.club_id, 
            clubs.name
        FROM clubs WHERE id = OLD.club_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on club_members table
DROP TRIGGER IF EXISTS club_member_count_trigger ON club_members;
CREATE TRIGGER club_member_count_trigger
AFTER INSERT OR DELETE ON club_members
FOR EACH ROW EXECUTE PROCEDURE update_club_member_count();

-- Function to track event creation and updates
CREATE OR REPLACE FUNCTION track_event_changes()
RETURNS TRIGGER AS $$
DECLARE
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update club statistics for event count
        UPDATE club_statistics SET 
            event_count = event_count + 1,
            last_updated = NOW()
        WHERE club_id = NEW.club_id;
        
        -- If no statistics record exists, create one
        IF NOT FOUND THEN
            INSERT INTO club_statistics (club_id, event_count)
            VALUES (NEW.club_id, 1);
        END IF;
        
        -- Log activity
        INSERT INTO user_activities (user_id, action, target_type, target_id, target_name)
        VALUES (NEW.created_by, 'created', 'event', NEW.id, NEW.title);
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log activity if significant fields changed
        IF NEW.title != OLD.title OR NEW.description != OLD.description OR 
           NEW.event_date != OLD.event_date OR NEW.status != OLD.status THEN
            
            INSERT INTO user_activities (user_id, action, target_type, target_id, target_name)
            VALUES (NEW.updated_by, 'updated', 'event', NEW.id, NEW.title);
        END IF;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update club statistics for event count
        UPDATE club_statistics SET 
            event_count = GREATEST(0, event_count - 1),
            last_updated = NOW()
        WHERE club_id = OLD.club_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on events table
DROP TRIGGER IF EXISTS event_tracking_trigger ON events;
CREATE TRIGGER event_tracking_trigger
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE PROCEDURE track_event_changes();

-- Function to track assignment creation and updates
CREATE OR REPLACE FUNCTION track_assignment_changes()
RETURNS TRIGGER AS $$
DECLARE
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update club statistics for assignment count
        UPDATE club_statistics SET 
            assignment_count = assignment_count + 1,
            last_updated = NOW()
        WHERE club_id = NEW.club_id;
        
        -- If no statistics record exists, create one
        IF NOT FOUND THEN
            INSERT INTO club_statistics (club_id, assignment_count)
            VALUES (NEW.club_id, 1);
        END IF;
        
        -- Log activity
        INSERT INTO user_activities (user_id, action, target_type, target_id, target_name)
        VALUES (NEW.created_by, 'created', 'assignment', NEW.id, NEW.title);
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log activity if significant fields changed
        IF NEW.title != OLD.title OR NEW.description != OLD.description OR 
           NEW.due_date != OLD.due_date OR NEW.status != OLD.status THEN
            
            INSERT INTO user_activities (user_id, action, target_type, target_id, target_name)
            VALUES (COALESCE(NEW.updated_by, NEW.created_by), 'updated', 'assignment', NEW.id, NEW.title);
        END IF;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update club statistics for assignment count
        UPDATE club_statistics SET 
            assignment_count = GREATEST(0, assignment_count - 1),
            last_updated = NOW()
        WHERE club_id = OLD.club_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on assignments table
DROP TRIGGER IF EXISTS assignment_tracking_trigger ON assignments;
CREATE TRIGGER assignment_tracking_trigger
AFTER INSERT OR UPDATE OR DELETE ON assignments
FOR EACH ROW EXECUTE PROCEDURE track_assignment_changes();

-- Function to track comment activity
CREATE OR REPLACE FUNCTION track_comment_activity()
RETURNS TRIGGER AS $$
DECLARE
    target_club_id CHARACTER VARYING;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update comment count in club statistics if the comment is for a club-related item
        IF NEW.target_type = 'club' THEN
            UPDATE club_statistics SET 
                comment_count = comment_count + 1,
                last_updated = NOW()
            WHERE club_id = NEW.target_id;
            
        ELSIF NEW.target_type = 'event' OR NEW.target_type = 'assignment' THEN
            -- For events and assignments, get the club_id first
                IF NEW.target_type = 'event' THEN
                    SELECT club_id INTO target_club_id FROM events WHERE id = NEW.target_id;
                ELSIF NEW.target_type = 'assignment' THEN
                    SELECT club_id INTO target_club_id FROM assignments WHERE id = NEW.target_id;
                END IF;
                
                IF target_club_id IS NOT NULL THEN
                    UPDATE club_statistics SET 
                        comment_count = comment_count + 1,
                        last_updated = NOW()
                    WHERE club_id = target_club_id;
                END IF;
        END IF;
        
        -- Log activity
        INSERT INTO user_activities (user_id, action, target_type, target_id, target_name)
        VALUES (NEW.user_id, 'commented on', NEW.target_type, NEW.target_id, 
                SUBSTRING(NEW.content FROM 1 FOR 30) || CASE WHEN LENGTH(NEW.content) > 30 THEN '...' ELSE '' END);
                
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Similar logic for deletion, but decrement counts
        IF OLD.target_type = 'club' THEN
            UPDATE club_statistics SET 
                comment_count = GREATEST(0, comment_count - 1),
                last_updated = NOW()
            WHERE club_id = OLD.target_id;
            
        ELSIF OLD.target_type = 'event' OR OLD.target_type = 'assignment' THEN
            -- For events and assignments, get the club_id first
                IF OLD.target_type = 'event' THEN
                    SELECT club_id INTO target_club_id FROM events WHERE id = OLD.target_id;
                ELSIF OLD.target_type = 'assignment' THEN
                    SELECT club_id INTO target_club_id FROM assignments WHERE id = OLD.target_id;
                END IF;
                
                IF target_club_id IS NOT NULL THEN
                    UPDATE club_statistics SET 
                        comment_count = GREATEST(0, comment_count - 1),
                        last_updated = NOW()
                    WHERE club_id = target_club_id;
                END IF;
        END IF;
                
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on comments table
DROP TRIGGER IF EXISTS comment_tracking_trigger ON comments;
CREATE TRIGGER comment_tracking_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE PROCEDURE track_comment_activity();

-- Function to prevent race conditions using advisory locks
CREATE OR REPLACE FUNCTION with_advisory_lock(
    lock_key TEXT,
    callback TEXT
) RETURNS VOID AS $$
DECLARE
    lock_id BIGINT;
BEGIN
    -- Generate a stable lock ID from the key string
    lock_id := ('x' || md5(lock_key))::bit(64)::bigint;
    
    -- Acquire the lock
    PERFORM pg_advisory_lock(lock_id);
    
    BEGIN
        -- Execute the callback
        EXECUTE callback;
    EXCEPTION
        WHEN OTHERS THEN
            -- Release the lock and re-raise the exception
            PERFORM pg_advisory_unlock(lock_id);
            RAISE;
    END;
    
    -- Release the lock
    PERFORM pg_advisory_unlock(lock_id);
END;
$$ LANGUAGE plpgsql;

-- Function to update overall system statistics (to be run daily via CRON job)
CREATE OR REPLACE FUNCTION update_system_statistics()
RETURNS VOID AS $$
DECLARE
    daily_active BIGINT;
    weekly_active BIGINT;
    monthly_active BIGINT;
    total_users BIGINT;
    total_clubs BIGINT;
    total_events BIGINT;
    total_assignments BIGINT;
    total_comments BIGINT;
BEGIN
    -- Count active users within different time frames
    SELECT COUNT(DISTINCT id) INTO daily_active
    FROM users
    WHERE last_active >= NOW() - INTERVAL '1 day';
    
    SELECT COUNT(DISTINCT id) INTO weekly_active
    FROM users
    WHERE last_active >= NOW() - INTERVAL '7 days';
    
    SELECT COUNT(DISTINCT id) INTO monthly_active
    FROM users
    WHERE last_active >= NOW() - INTERVAL '30 days';
    
    -- Count total entities
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_clubs FROM clubs;
    SELECT COUNT(*) INTO total_events FROM events;
    SELECT COUNT(*) INTO total_assignments FROM assignments;
    SELECT COUNT(*) INTO total_comments FROM comments;
    
    -- Insert new statistics record
    INSERT INTO system_statistics (
        active_users_count,
        total_users_count,
        total_clubs_count,
        total_events_count,
        total_assignments_count,
        total_comments_count,
        daily_active_users,
        weekly_active_users,
        monthly_active_users,
        timestamp
    ) VALUES (
        weekly_active,
        total_users,
        total_clubs,
        total_events,
        total_assignments,
        total_comments,
        daily_active,
        weekly_active,
        monthly_active,
        NOW()
    );
    
    -- Clean up old statistics records (keep only last 90 days)
    DELETE FROM system_statistics
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create materialized views for expensive queries
DROP MATERIALIZED VIEW IF EXISTS club_engagement_metrics;
CREATE MATERIALIZED VIEW club_engagement_metrics AS
SELECT 
    c.id AS club_id,
    c.name AS club_name,
    c.member_count,
    COALESCE(cs.event_count, 0) AS event_count,
    COALESCE(cs.assignment_count, 0) AS assignment_count,
    COALESCE(cs.comment_count, 0) AS comment_count,
    COALESCE(
        CASE 
            WHEN c.member_count > 0 THEN
                (COALESCE(event_attendance.attendance_count, 0)::FLOAT / 
                (NULLIF(COALESCE(cs.event_count, 0) * c.member_count, 0))::FLOAT * 100)
            ELSE 0
        END, 
        0
    ) AS event_participation_rate,
    COALESCE(
        CASE 
            WHEN c.member_count > 0 THEN
                (COALESCE(assignment_submissions.submission_count, 0)::FLOAT / 
                (NULLIF(COALESCE(cs.assignment_count, 0) * c.member_count, 0))::FLOAT * 100)
            ELSE 0
        END,
        0
    ) AS assignment_completion_rate,
    COALESCE(
        CASE 
            WHEN c.member_count > 0 THEN
                (COALESCE(cs.comment_count, 0)::FLOAT / NULLIF(c.member_count, 0)::FLOAT)
            ELSE 0
        END,
        0
    ) AS comments_per_member,
    -- Calculate overall engagement score (weighted average)
    COALESCE(
        CASE 
            WHEN c.member_count > 0 THEN
                (
                    COALESCE(
                        CASE 
                            WHEN c.member_count > 0 THEN
                                (COALESCE(event_attendance.attendance_count, 0)::FLOAT / 
                                (NULLIF(COALESCE(cs.event_count, 0) * c.member_count, 0))::FLOAT * 100)
                            ELSE 0
                        END, 
                        0
                    ) * 0.4 +
                    COALESCE(
                        CASE 
                            WHEN c.member_count > 0 THEN
                                (COALESCE(assignment_submissions.submission_count, 0)::FLOAT / 
                                (NULLIF(COALESCE(cs.assignment_count, 0) * c.member_count, 0))::FLOAT * 100)
                            ELSE 0
                        END,
                        0
                    ) * 0.4 +
                    COALESCE(
                        CASE 
                            WHEN c.member_count > 0 THEN
                                (COALESCE(cs.comment_count, 0)::FLOAT / NULLIF(c.member_count, 0)::FLOAT) * 10
                            ELSE 0
                        END,
                        0
                    ) * 0.2
                )
            ELSE 0
        END,
        0
    ) AS engagement_score
FROM 
    clubs c
LEFT JOIN 
    club_statistics cs ON c.id = cs.club_id
LEFT JOIN 
    (
        SELECT 
            e.club_id,
            COUNT(ea.user_id) AS attendance_count
        FROM 
            events e
        LEFT JOIN 
            event_attendees ea ON e.id = ea.event_id
        GROUP BY 
            e.club_id
    ) AS event_attendance ON c.id = event_attendance.club_id
LEFT JOIN 
    (
        SELECT 
            a.club_id,
            COUNT(asub.user_id) AS submission_count
        FROM 
            assignments a
        LEFT JOIN 
            assignment_submissions asub ON a.id = asub.assignment_id
        GROUP BY 
            a.club_id
    ) AS assignment_submissions ON c.id = assignment_submissions.club_id;

-- Function to refresh materialized views with proper locking to prevent race conditions
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    -- Use advisory lock to prevent concurrent refreshes
    PERFORM with_advisory_lock(
        'refresh_materialized_views',
        'REFRESH MATERIALIZED VIEW club_engagement_metrics'
    );
    
    -- Update the query cache expiration for any cached queries based on these views
    UPDATE query_cache
    SET expires_at = NOW()
    WHERE cache_key LIKE '%club_engagement%';
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to manage query cache
CREATE OR REPLACE FUNCTION get_or_set_cache(
    p_cache_key TEXT,
    p_query TEXT,
    p_ttl_minutes INTEGER DEFAULT 60
) RETURNS JSONB AS $$
DECLARE
    v_cache_value JSONB;
    v_query_result JSONB;
BEGIN
    -- Try to get from cache first
    SELECT cache_value INTO v_cache_value
    FROM query_cache
    WHERE cache_key = p_cache_key AND expires_at > NOW();
    
    -- If found and not expired, return cached value
    IF FOUND THEN
        RETURN v_cache_value;
    END IF;
    
    -- Execute the query and get the result
    EXECUTE 'SELECT json_agg(q) FROM (' || p_query || ') q' INTO v_query_result;
    
    -- If the query returned NULL, convert to empty array
    IF v_query_result IS NULL THEN
        v_query_result := '[]'::JSONB;
    END IF;
    
    -- Store in cache with expiration
    INSERT INTO query_cache (cache_key, cache_value, expires_at)
    VALUES (p_cache_key, v_query_result, NOW() + (p_ttl_minutes * INTERVAL '1 minute'))
    ON CONFLICT (cache_key)
    DO UPDATE SET 
        cache_value = v_query_result,
        last_updated = NOW(),
        expires_at = NOW() + (p_ttl_minutes * INTERVAL '1 minute');
    
    RETURN v_query_result;
END;
$$ LANGUAGE plpgsql;
