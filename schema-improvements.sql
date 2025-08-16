-- Schema improvements for Zenith platform
-- This file adds database triggers, functions, indexes and views to improve performance and automation

-- 1. TRIGGERS FOR AUTOMATIC MEMBER COUNT UPDATES

-- Function to update club member counts
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When a user joins a club, increment the count
    UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.club_id IS DISTINCT FROM NEW.club_id THEN
    -- When a user changes clubs, decrement old club and increment new club
    IF OLD.club_id IS NOT NULL THEN
      UPDATE clubs SET member_count = member_count - 1 WHERE id = OLD.club_id;
    END IF;
    IF NEW.club_id IS NOT NULL THEN
      UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- When a user leaves a club, decrement the count
    IF OLD.club_id IS NOT NULL THEN
      UPDATE clubs SET member_count = member_count - 1 WHERE id = OLD.club_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on users table for club_id changes
CREATE TRIGGER user_club_membership_trigger
AFTER INSERT OR UPDATE OF club_id OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION update_club_member_count();

-- 2. ANALYTICS TRACKING IMPROVEMENTS

-- Assignment statistics table for caching and quick access
CREATE TABLE assignment_statistics (
  id SERIAL PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  total_attempts INT DEFAULT 0,
  total_submissions INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  passed_count INT DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0.0,
  max_score INT DEFAULT 0,
  min_score INT DEFAULT 0,
  average_time_spent INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_assignment_stats_assignment
    FOREIGN KEY (assignment_id) 
    REFERENCES assignments(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_assignment_stats_assignment ON assignment_statistics(assignment_id);

-- Club activity statistics
CREATE TABLE club_statistics (
  id SERIAL PRIMARY KEY,
  club_id VARCHAR(50) REFERENCES clubs(id) ON DELETE CASCADE,
  total_events INT DEFAULT 0,
  active_events INT DEFAULT 0,
  total_posts INT DEFAULT 0,
  total_assignments INT DEFAULT 0,
  active_members INT DEFAULT 0,
  engagement_score NUMERIC(5,2) DEFAULT 0.0,
  total_interactions INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_club_stats_club
    FOREIGN KEY (club_id)
    REFERENCES clubs(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_club_stats_club ON club_statistics(club_id);

-- User activity tracking
CREATE TABLE user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  entity_type VARCHAR(50),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_user_activity_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_user_activity_user ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX idx_user_activity_entity ON user_activity_log(entity_type, entity_id);
CREATE INDEX idx_user_activity_created ON user_activity_log(created_at);

-- Function to update assignment statistics
CREATE OR REPLACE FUNCTION update_assignment_statistics()
RETURNS TRIGGER AS $$
DECLARE
  _avg_score NUMERIC(5,2);
  _avg_time INT;
  _min_score INT;
  _max_score INT;
BEGIN
  -- Calculate statistics
  SELECT 
    COALESCE(AVG(NULLIF(total_score, 0)), 0)::NUMERIC(5,2),
    COALESCE(AVG(NULLIF(time_spent, 0)), 0)::INT,
    COALESCE(MIN(NULLIF(total_score, 0)), 0),
    COALESCE(MAX(total_score), 0)
  INTO _avg_score, _avg_time, _min_score, _max_score
  FROM assignment_submissions
  WHERE assignment_id = NEW.assignment_id AND status = 'submitted';
  
  -- Update or insert statistics
  INSERT INTO assignment_statistics (
    assignment_id, total_attempts, total_submissions, completed_count,
    passed_count, average_score, average_time_spent, min_score, max_score, last_updated
  )
  SELECT
    NEW.assignment_id,
    (SELECT COUNT(*) FROM assignment_attempts WHERE assignment_id = NEW.assignment_id),
    (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = NEW.assignment_id),
    (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = NEW.assignment_id AND status = 'completed'),
    (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = NEW.assignment_id AND total_score >= 
      (SELECT passing_score FROM assignments WHERE id = NEW.assignment_id)
    ),
    _avg_score,
    _avg_time,
    _min_score,
    _max_score,
    NOW()
  ON CONFLICT (assignment_id) DO UPDATE SET
    total_attempts = (SELECT COUNT(*) FROM assignment_attempts WHERE assignment_id = NEW.assignment_id),
    total_submissions = (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = NEW.assignment_id),
    completed_count = (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = NEW.assignment_id AND status = 'completed'),
    passed_count = (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = NEW.assignment_id AND total_score >= 
      (SELECT passing_score FROM assignments WHERE id = NEW.assignment_id)
    ),
    average_score = _avg_score,
    average_time_spent = _avg_time,
    min_score = _min_score,
    max_score = _max_score,
    last_updated = NOW();
    
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update assignment statistics
CREATE TRIGGER assignment_statistics_update
AFTER INSERT OR UPDATE ON assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION update_assignment_statistics();

-- Function to update club statistics
CREATE OR REPLACE FUNCTION update_club_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert club statistics
  INSERT INTO club_statistics (
    club_id, total_events, active_events, total_posts, 
    total_assignments, active_members, last_updated
  )
  SELECT
    NEW.club_id,
    (SELECT COUNT(*) FROM events WHERE club_id = NEW.club_id),
    (SELECT COUNT(*) FROM events WHERE club_id = NEW.club_id AND event_date >= CURRENT_DATE),
    (SELECT COUNT(*) FROM posts WHERE club_id = NEW.club_id),
    (SELECT COUNT(*) FROM assignments WHERE club_id = NEW.club_id),
    (SELECT COUNT(*) FROM users WHERE club_id = NEW.club_id AND last_activity >= (CURRENT_TIMESTAMP - INTERVAL '30 days')),
    NOW()
  ON CONFLICT (club_id) DO UPDATE SET
    total_events = (SELECT COUNT(*) FROM events WHERE club_id = NEW.club_id),
    active_events = (SELECT COUNT(*) FROM events WHERE club_id = NEW.club_id AND event_date >= CURRENT_DATE),
    total_posts = (SELECT COUNT(*) FROM posts WHERE club_id = NEW.club_id),
    total_assignments = (SELECT COUNT(*) FROM assignments WHERE club_id = NEW.club_id),
    active_members = (SELECT COUNT(*) FROM users WHERE club_id = NEW.club_id AND last_activity >= (CURRENT_TIMESTAMP - INTERVAL '30 days')),
    last_updated = NOW();
    
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for club statistics updates
CREATE TRIGGER club_statistics_event_trigger
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW
EXECUTE FUNCTION update_club_statistics();

CREATE TRIGGER club_statistics_post_trigger
AFTER INSERT OR UPDATE OR DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_club_statistics();

CREATE TRIGGER club_statistics_assignment_trigger
AFTER INSERT OR UPDATE OR DELETE ON assignments
FOR EACH ROW
EXECUTE FUNCTION update_club_statistics();

-- 3. PERFORMANCE OPTIMIZATION

-- Create materialized view for assignment analytics
CREATE MATERIALIZED VIEW mv_assignment_analytics AS
SELECT
  a.id,
  a.title,
  a.club_id,
  a.due_date,
  a.max_points,
  a.is_published,
  a.assignment_type,
  a.status,
  c.name AS club_name,
  COUNT(DISTINCT as_sub.user_id) AS total_submitted_users,
  COUNT(DISTINCT at.id) AS total_attempts,
  AVG(as_sub.total_score) AS average_score,
  MAX(as_sub.total_score) AS highest_score
FROM
  assignments a
LEFT JOIN
  clubs c ON a.club_id = c.id
LEFT JOIN
  assignment_submissions as_sub ON a.id = as_sub.assignment_id
LEFT JOIN
  assignment_attempts at ON a.id = at.assignment_id
GROUP BY
  a.id, a.title, a.club_id, c.name
WITH DATA;

CREATE UNIQUE INDEX idx_mv_assignment_analytics ON mv_assignment_analytics(id);

-- Create materialized view for club analytics
CREATE MATERIALIZED VIEW mv_club_analytics AS
SELECT
  c.id,
  c.name,
  c.type,
  c.member_count,
  COUNT(DISTINCT e.id) AS event_count,
  COUNT(DISTINCT p.id) AS post_count,
  COUNT(DISTINCT a.id) AS assignment_count,
  COUNT(DISTINCT u.id) AS active_users,
  COALESCE(AVG(a_stats.average_score), 0) AS avg_assignment_score
FROM
  clubs c
LEFT JOIN
  events e ON c.id = e.club_id
LEFT JOIN
  posts p ON c.id = p.club_id
LEFT JOIN
  assignments a ON c.id = a.club_id
LEFT JOIN
  users u ON c.id = u.club_id AND u.last_activity > (CURRENT_TIMESTAMP - INTERVAL '30 days')
LEFT JOIN
  assignment_statistics a_stats ON a.id = a_stats.assignment_id
GROUP BY
  c.id, c.name, c.type, c.member_count
WITH DATA;

CREATE UNIQUE INDEX idx_mv_club_analytics ON mv_club_analytics(id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_assignment_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_club_analytics;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to refresh materialized views (every 1 hour)
-- Note: This requires pg_cron extension to be installed
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the refresh function (if pg_cron is available)
SELECT cron.schedule('0 * * * *', 'SELECT refresh_materialized_views()');

-- 4. HANDLING RACE CONDITIONS

-- Create advisory locks for critical operations
CREATE OR REPLACE FUNCTION lock_assignment_submission(assignment_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  lock_key BIGINT;
  success BOOLEAN;
BEGIN
  -- Generate a unique lock key using the hash of assignment_id and user_id
  lock_key := hashtext(assignment_id::text || '-' || user_id::text) % 2147483647;
  
  -- Try to acquire an advisory lock
  success := pg_try_advisory_xact_lock(lock_key);
  
  RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Function to handle assignment submission with race condition prevention
CREATE OR REPLACE FUNCTION safe_submit_assignment(
  p_assignment_id UUID, 
  p_user_id UUID,
  p_submission_text TEXT,
  p_status VARCHAR
) RETURNS UUID AS $$
DECLARE
  submission_id UUID;
  lock_acquired BOOLEAN;
  deadline_passed BOOLEAN;
  attempt_count INT;
  max_attempts INT;
BEGIN
  -- Check if deadline has passed
  SELECT due_date < CURRENT_TIMESTAMP INTO deadline_passed
  FROM assignments WHERE id = p_assignment_id;
  
  IF deadline_passed THEN
    RAISE EXCEPTION 'Assignment deadline has passed';
  END IF;
  
  -- Check if max attempts reached
  SELECT COUNT(*) INTO attempt_count
  FROM assignment_submissions
  WHERE assignment_id = p_assignment_id AND user_id = p_user_id;
  
  SELECT max_attempts INTO max_attempts
  FROM assignments WHERE id = p_assignment_id;
  
  IF attempt_count >= max_attempts THEN
    RAISE EXCEPTION 'Maximum submission attempts reached';
  END IF;
  
  -- Try to acquire lock
  lock_acquired := lock_assignment_submission(p_assignment_id, p_user_id);
  
  IF NOT lock_acquired THEN
    RAISE EXCEPTION 'Another submission is in progress. Please try again.';
  END IF;
  
  -- Create or update submission
  INSERT INTO assignment_submissions (
    assignment_id, 
    user_id, 
    submission_text, 
    status,
    submitted_at
  ) VALUES (
    p_assignment_id,
    p_user_id,
    p_submission_text,
    p_status,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO submission_id;
  
  -- Log activity
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    entity_id,
    entity_type,
    details
  ) VALUES (
    p_user_id,
    'assignment_submission',
    p_assignment_id,
    'assignment',
    jsonb_build_object(
      'submission_id', submission_id,
      'status', p_status
    )
  );
  
  RETURN submission_id;
END;
$$ LANGUAGE plpgsql;

-- 5. CACHE MANAGEMENT TABLES

-- Table for caching expensive queries
CREATE TABLE query_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  cache_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_query_cache_key ON query_cache(cache_key);
CREATE INDEX idx_query_cache_expiry ON query_cache(expires_at);

-- Function to get or set cache
CREATE OR REPLACE FUNCTION get_or_set_cache(
  p_cache_key VARCHAR,
  p_ttl_seconds INT DEFAULT 300
) RETURNS TABLE (
  cache_value JSONB,
  is_fresh BOOLEAN
) AS $$
DECLARE
  _result JSONB;
  _is_fresh BOOLEAN := FALSE;
BEGIN
  -- Try to get from cache
  SELECT qc.cache_value INTO _result
  FROM query_cache qc
  WHERE qc.cache_key = p_cache_key AND qc.expires_at > NOW();
  
  IF FOUND THEN
    -- Update last accessed time
    UPDATE query_cache
    SET last_accessed = NOW()
    WHERE cache_key = p_cache_key;
    
    _is_fresh := FALSE;
  END IF;
  
  cache_value := _result;
  is_fresh := _is_fresh;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to set cache
CREATE OR REPLACE FUNCTION set_cache(
  p_cache_key VARCHAR,
  p_cache_value JSONB,
  p_ttl_seconds INT DEFAULT 300
) RETURNS VOID AS $$
BEGIN
  INSERT INTO query_cache (
    cache_key,
    cache_value,
    expires_at
  ) VALUES (
    p_cache_key,
    p_cache_value,
    NOW() + (p_ttl_seconds * INTERVAL '1 second')
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    cache_value = p_cache_value,
    expires_at = NOW() + (p_ttl_seconds * INTERVAL '1 second'),
    last_accessed = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to invalidate cache by pattern
CREATE OR REPLACE FUNCTION invalidate_cache(p_pattern VARCHAR) RETURNS INT AS $$
DECLARE
  _count INT;
BEGIN
  DELETE FROM query_cache
  WHERE cache_key LIKE p_pattern;
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$ LANGUAGE plpgsql;

-- Job to clean expired cache (runs every 5 minutes)
SELECT cron.schedule('*/5 * * * *', 'DELETE FROM query_cache WHERE expires_at < NOW()');

-- 6. ACCESS CONTROL VIEWS FOR ADMIN DASHBOARD

-- View for club coordinators and committee members
CREATE OR REPLACE VIEW vw_admin_user_access AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.role AS user_role,
  u.club_id,
  c.name AS club_name,
  CASE 
    WHEN u.role = 'admin' THEN TRUE
    WHEN u.id = c.coordinator_id THEN TRUE
    WHEN u.id = c.co_coordinator_id THEN TRUE
    WHEN EXISTS (
      SELECT 1 FROM committee_members cm
      JOIN committee_roles cr ON cm.role_id = cr.id
      WHERE cm.user_id = u.id AND cr.hierarchy <= 2
    ) THEN TRUE
    ELSE FALSE
  END AS has_admin_access,
  CASE
    WHEN u.role = 'admin' THEN 'platform_admin'
    WHEN u.id = c.coordinator_id THEN 'coordinator'
    WHEN u.id = c.co_coordinator_id THEN 'co_coordinator'
    WHEN u.id = c.secretary_id THEN 'secretary'
    WHEN EXISTS (
      SELECT 1 FROM committee_members cm
      JOIN committee_roles cr ON cm.role_id = cr.id
      WHERE cm.user_id = u.id
    ) THEN 'committee_member'
    ELSE 'regular_user'
  END AS access_level,
  ARRAY(
    SELECT DISTINCT cr.committee_id
    FROM committee_members cm
    JOIN committee_roles cr ON cm.role_id = cr.id
    WHERE cm.user_id = u.id
  ) AS committee_ids
FROM 
  users u
LEFT JOIN
  clubs c ON u.club_id = c.id;

-- 7. DATABASE AUDIT LOGGING

-- Create table for audit logs
CREATE TABLE system_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(255),
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user ON system_audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON system_audit_logs(action);
CREATE INDEX idx_audit_logs_table ON system_audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON system_audit_logs(created_at);

-- 8. ADDITIONAL PERFORMANCE IMPROVEMENTS

-- Add indexes for common query patterns
CREATE INDEX idx_events_upcoming ON events(event_date) WHERE event_date >= CURRENT_DATE;
CREATE INDEX idx_posts_recent ON posts(created_at DESC);
CREATE INDEX idx_assignment_due_soon ON assignments(due_date) WHERE due_date >= CURRENT_DATE AND due_date <= CURRENT_DATE + INTERVAL '7 days';
CREATE INDEX idx_user_active ON users(last_activity) WHERE last_activity >= NOW() - INTERVAL '30 days';

-- Optimize for full text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_posts_content_trgm ON posts USING gin(content gin_trgm_ops);
CREATE INDEX idx_assignments_title_trgm ON assignments USING gin(title gin_trgm_ops);

-- 9. SYSTEM HEALTH MONITORING

-- Table for system health metrics
CREATE TABLE system_health_metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  units VARCHAR(50),
  collection_time TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX idx_health_metrics_time ON system_health_metrics(collection_time);

-- Function to record database stats
CREATE OR REPLACE FUNCTION record_db_health_metrics() RETURNS VOID AS $$
BEGIN
  -- Record connection count
  INSERT INTO system_health_metrics (metric_name, metric_value, units, notes)
  SELECT 'active_connections', count(*), 'connections', 'Number of active connections'
  FROM pg_stat_activity;
  
  -- Record database size
  INSERT INTO system_health_metrics (metric_name, metric_value, units, notes)
  SELECT 
    'database_size', 
    pg_database_size(current_database()) / (1024 * 1024), 
    'MB',
    'Current database size';
    
  -- Record table counts
  INSERT INTO system_health_metrics (metric_name, metric_value, units, notes)
  VALUES
    ('user_count', (SELECT COUNT(*) FROM users), 'records', 'Total user count'),
    ('assignment_count', (SELECT COUNT(*) FROM assignments), 'records', 'Total assignment count'),
    ('active_sessions', (SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()), 'sessions', 'Active user sessions');
END;
$$ LANGUAGE plpgsql;

-- Schedule health metrics collection (every 15 minutes)
SELECT cron.schedule('*/15 * * * *', 'SELECT record_db_health_metrics()');

-- 10. DATABASE INITIALIZATION FUNCTION 

-- Function to initialize or reset statistics
CREATE OR REPLACE FUNCTION initialize_statistics() RETURNS VOID AS $$
BEGIN
  -- Update all club member counts
  UPDATE clubs c
  SET member_count = (
    SELECT COUNT(*) FROM users u WHERE u.club_id = c.id
  );
  
  -- Initialize club statistics
  INSERT INTO club_statistics (
    club_id, total_events, active_events, total_posts, 
    total_assignments, active_members, last_updated
  )
  SELECT
    c.id,
    COUNT(DISTINCT e.id),
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_date >= CURRENT_DATE),
    COUNT(DISTINCT p.id),
    COUNT(DISTINCT a.id),
    COUNT(DISTINCT u.id) FILTER (WHERE u.last_activity >= (CURRENT_TIMESTAMP - INTERVAL '30 days')),
    NOW()
  FROM
    clubs c
  LEFT JOIN
    events e ON c.id = e.club_id
  LEFT JOIN
    posts p ON c.id = p.club_id
  LEFT JOIN
    assignments a ON c.id = a.club_id
  LEFT JOIN
    users u ON c.id = u.club_id
  GROUP BY c.id
  ON CONFLICT (club_id) DO UPDATE SET
    total_events = EXCLUDED.total_events,
    active_events = EXCLUDED.active_events,
    total_posts = EXCLUDED.total_posts,
    total_assignments = EXCLUDED.total_assignments,
    active_members = EXCLUDED.active_members,
    last_updated = NOW();
    
  -- Initialize assignment statistics
  INSERT INTO assignment_statistics (
    assignment_id, total_attempts, total_submissions, completed_count,
    passed_count, average_score, average_time_spent, last_updated
  )
  SELECT
    a.id,
    COUNT(DISTINCT att.id),
    COUNT(DISTINCT sub.id),
    COUNT(DISTINCT sub.id) FILTER (WHERE sub.status = 'completed'),
    COUNT(DISTINCT sub.id) FILTER (WHERE sub.total_score >= a.passing_score),
    COALESCE(AVG(sub.total_score) FILTER (WHERE sub.status = 'completed'), 0),
    COALESCE(AVG(sub.time_spent) FILTER (WHERE sub.status = 'completed'), 0),
    NOW()
  FROM
    assignments a
  LEFT JOIN
    assignment_attempts att ON a.id = att.assignment_id
  LEFT JOIN
    assignment_submissions sub ON a.id = sub.assignment_id
  GROUP BY a.id
  ON CONFLICT (assignment_id) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    total_submissions = EXCLUDED.total_submissions,
    completed_count = EXCLUDED.completed_count,
    passed_count = EXCLUDED.passed_count,
    average_score = EXCLUDED.average_score,
    average_time_spent = EXCLUDED.average_time_spent,
    last_updated = NOW();
    
  -- Refresh materialized views
  PERFORM refresh_materialized_views();
  
  -- Clear cache
  DELETE FROM query_cache;
END;
$$ LANGUAGE plpgsql;

-- Run the initialization function
SELECT initialize_statistics();
