-- Performance Optimization: Critical Database Indexes
-- This script adds ess-- =============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERING CONDITIONS
-- =============================================================================

-- Active users only (most queries filter for active users)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_profile 
ON users(id, name, avatar, role) WHERE active = true;

-- Published posts only (public queries)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_feed 
ON posts(club_id, created_at DESC, title, excerpt) WHERE published = true;

-- Upcoming events only (dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_upcoming_list 
ON events(event_date ASC, title, location, max_attendees) 
WHERE event_date >= CURRENT_DATE AND status = 'upcoming';

-- =============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================================================

-- User profile with club information (dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_complete 
ON users(id, email, name, role, club_id, created_at) WHERE active = true;

-- Post analytics (admin dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_analytics 
ON posts(club_id, author_id, created_at, published) WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Assignment analytics (performance tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_performance 
ON assignments(club_id, created_by, due_date, max_points) WHERE status = 'published';

-- =============================================================================
-- TEXT SEARCH OPTIMIZATION  
-- =============================================================================

-- Full-text search indexes for posts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_search 
ON posts USING gin(to_tsvector('english', title || ' ' || content)) 
WHERE published = true;

-- Full-text search for user names (member search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_search 
ON users USING gin(to_tsvector('english', name)) WHERE active = true;

-- =============================================================================
-- UNIQUE CONSTRAINTS WITH PERFORMANCE BENEFITS
-- =============================================================================

-- Ensure unique event attendees (prevents duplicates and adds index)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_unique 
ON event_attendees(event_id, user_id);

-- Unique assignment submissions per user (academic integrity)  
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_unique_attempt 
ON assignment_submissions(assignment_id, user_id, attempt_number);o improve query performance
-- All indexes are designed to accelerate frequently used queries

-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction
-- Each index is created individually to avoid blocking operations

-- =============================================================================
-- CRITICAL PERFORMANCE INDEXES
-- =============================================================================

-- Users table indexes (Most frequently queried table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users(email) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_club_id_role 
ON users(club_id, role) WHERE club_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_updated_at_desc 
ON users(updated_at DESC);

-- Posts table indexes (Heavy traffic table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_club_id_created 
ON posts(club_id, created_at DESC) WHERE published = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_created 
ON posts(author_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_pinned 
ON posts(published, pinned, created_at DESC);

-- Comments table indexes (High volume queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_created 
ON comments(post_id, created_at ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author_created 
ON comments(author_id, created_at DESC);

-- Events table indexes (Time-sensitive queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_club 
ON events(event_date, club_id) WHERE status = 'upcoming';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_upcoming 
ON events(event_date ASC) WHERE event_date >= CURRENT_DATE AND status = 'upcoming';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_club_date_range 
ON events(club_id, event_date, event_time);

-- Assignments table indexes (Academic performance critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_due_club 
ON assignments(due_date ASC, club_id) WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_created_by_due 
ON assignments(created_by, due_date DESC);

-- Assignment submissions indexes (Grading performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_assignment_user 
ON assignment_submissions(assignment_id, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_submitted_at 
ON assignment_submissions(submitted_at DESC) WHERE submitted_at IS NOT NULL;

-- Notifications table indexes (Real-time performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, read, created_at DESC) WHERE read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_expires_cleanup 
ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Chat messages indexes (Real-time chat performance)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_room_time 
ON chat_messages(room_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_sender_time 
ON chat_messages(sender_id, created_at DESC);

-- Event attendees indexes (Event management)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_composite 
ON event_attendees(event_id, user_id, attendance_status);-- =============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERING CONDITIONS
-- =============================================================================

-- Active users only (most queries filter for active users)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_profile 
ON users(id, name, avatar, role) WHERE active = true;

-- Published posts only (public queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_feed 
ON posts(club_id, created_at DESC, title, excerpt) WHERE published = true;

-- Upcoming events only (dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_upcoming_list 
ON events(event_date ASC, title, location, max_attendees) 
WHERE event_date >= CURRENT_DATE AND status = 'upcoming';

-- =============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================================================

-- User profile with club information (dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_complete 
ON users(id, email, name, role, club_id, created_at) WHERE active = true;

-- Post analytics (admin dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_analytics 
ON posts(club_id, author_id, created_at, published) WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Assignment analytics (performance tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_performance 
ON assignments(club_id, created_by, due_date, max_points) WHERE status = 'published';

-- =============================================================================
-- TEXT SEARCH OPTIMIZATION
-- =============================================================================

-- Full-text search indexes for posts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_search 
ON posts USING gin(to_tsvector('english', title || ' ' || content)) 
WHERE published = true;

-- Full-text search for user names (member search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_search 
ON users USING gin(to_tsvector('english', name)) WHERE active = true;

-- =============================================================================
-- UNIQUE CONSTRAINTS WITH PERFORMANCE BENEFITS
-- =============================================================================

-- Ensure unique event attendees (prevents duplicates and adds index)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_unique 
ON event_attendees(event_id, user_id);

-- Unique assignment submissions per user (academic integrity)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_unique_attempt 
ON assignment_submissions(assignment_id, user_id, attempt_number);

-- =============================================================================
-- STATISTICS UPDATE FOR QUERY PLANNER
-- =============================================================================

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE posts;
ANALYZE comments;
ANALYZE events;
ANALYZE assignments;
ANALYZE assignment_submissions;
ANALYZE notifications;
ANALYZE chat_messages;
ANALYZE event_attendees;
ANALYZE clubs;

-- =============================================================================
-- STATISTICS UPDATE FOR QUERY PLANNER (Non-concurrent operations)
-- =============================================================================

-- Update table statistics for better query planning  
ANALYZE users;
ANALYZE posts;
ANALYZE comments;
ANALYZE events;
ANALYZE assignments;
ANALYZE assignment_submissions;
ANALYZE notifications;
ANALYZE chat_messages;
ANALYZE event_attendees;
ANALYZE clubs;

-- =============================================================================
-- PERFORMANCE VERIFICATION
-- =============================================================================

-- Verify indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check index sizes (monitor space usage)
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Success message
SELECT 'Database performance indexes created successfully! ✅' as status;
