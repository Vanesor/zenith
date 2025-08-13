-- Safe Performance Optimization: Critical Database Indexes
-- This script adds essential indexes based on actual schema structure
-- Indexes are created individually to avoid transaction conflicts

-- =============================================================================
-- USERS TABLE INDEXES (High Priority)
-- =============================================================================

-- Email lookup (authentication)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);

-- Club membership queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_club_id 
ON users(club_id) WHERE club_id IS NOT NULL;

-- User role filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users(role);

-- Recent user activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_updated_at 
ON users(updated_at DESC);

-- =============================================================================  
-- POSTS TABLE INDEXES (High Traffic)
-- =============================================================================

-- Club posts with publication status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_club_created 
ON posts(club_id, created_at DESC);

-- Author's posts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author 
ON posts(author_id, created_at DESC);

-- Pinned posts priority
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_pinned 
ON posts(is_pinned, created_at DESC);

-- =============================================================================
-- ASSIGNMENTS TABLE INDEXES (Academic Critical)
-- =============================================================================

-- Club assignments by due date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_club_due 
ON assignments(club_id, due_date ASC);

-- Assignment status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_status 
ON assignments(status);

-- Created by instructor
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_created_by 
ON assignments(created_by);

-- =============================================================================
-- ASSIGNMENT_SUBMISSIONS TABLE INDEXES (Performance Critical)
-- =============================================================================

-- User submissions lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user 
ON assignment_submissions(user_id, submitted_at DESC);

-- Assignment submissions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_assignment 
ON assignment_submissions(assignment_id);

-- Grading workflow
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_status 
ON assignment_submissions(status);

-- =============================================================================
-- EVENTS TABLE INDEXES (Time-sensitive)
-- =============================================================================

-- Upcoming events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date 
ON events(event_date ASC);

-- Club events  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_club 
ON events(club_id, event_date ASC);

-- Event status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status 
ON events(status);

-- =============================================================================
-- COMMENTS TABLE INDEXES (Real-time)
-- =============================================================================

-- Post comments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post 
ON comments(post_id, created_at ASC);

-- User's comments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author 
ON comments(author_id, created_at DESC);

-- =============================================================================
-- CHAT_MESSAGES TABLE INDEXES (Real-time Chat)
-- =============================================================================

-- Room messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_room 
ON chat_messages(room_id, created_at DESC);

-- User messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_user 
ON chat_messages(user_id, created_at DESC);

-- =============================================================================
-- NOTIFICATIONS TABLE INDEXES (Real-time Updates)
-- =============================================================================

-- User notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user 
ON notifications(user_id, created_at DESC);

-- Unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, read) WHERE read = false;

-- =============================================================================
-- EVENT_ATTENDEES TABLE INDEXES (Event Management)
-- =============================================================================

-- Event attendee list
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_event 
ON event_attendees(event_id);

-- User's event registrations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_user 
ON event_attendees(user_id);

-- =============================================================================
-- CLUBS TABLE INDEXES (Organization)
-- =============================================================================

-- Club type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clubs_type 
ON clubs(type);

-- Club coordinator lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clubs_coordinator 
ON clubs(coordinator_id) WHERE coordinator_id IS NOT NULL;

-- =============================================================================
-- UPDATE STATISTICS
-- =============================================================================

-- Refresh table statistics for query planner
ANALYZE users;
ANALYZE posts; 
ANALYZE assignments;
ANALYZE assignment_submissions;
ANALYZE events;
ANALYZE comments;
ANALYZE chat_messages;
ANALYZE notifications;
ANALYZE event_attendees;
ANALYZE clubs;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Check created indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
    AND tablename IN ('users', 'posts', 'assignments', 'assignment_submissions', 
                      'events', 'comments', 'chat_messages', 'notifications',
                      'event_attendees', 'clubs')
ORDER BY tablename, indexname;
