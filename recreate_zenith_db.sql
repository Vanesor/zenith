-- =============================================================================
-- Complete PostgreSQL Database Recreation Script for Zenith
-- =============================================================================
-- This script will:
-- 1. Drop existing database and user
-- 2. Create new database and user with proper permissions
-- 3. Create extensions
-- 4. Import schema
-- 5. Import all data from db_export
-- =============================================================================

-- Connect to postgres database first
\c postgres

-- Terminate any existing connections to zenith database
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'zenith' AND pid <> pg_backend_pid();

-- Drop existing database and user
DROP DATABASE IF EXISTS zenith;
DROP USER IF EXISTS zenithpostgres;

-- Create user with password
CREATE USER zenithpostgres WITH PASSWORD 'AtharvaAyush';

-- Create database
CREATE DATABASE zenith OWNER zenithpostgres;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE zenith TO zenithpostgres;
ALTER USER zenithpostgres CREATEDB;
ALTER USER zenithpostgres SUPERUSER;

-- Connect to the zenith database
\c zenith

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Import schema from complete_schema.sql
-- Note: You'll need to run this after the script or include the schema content here
\echo 'Database setup complete. Now import schema and data...'
\echo 'Run: psql -U postgres -d zenith < complete_schema.sql'
\echo 'Then run the data import commands...'

-- =============================================================================
-- Schema Import (uncomment the line below if running from same directory)
-- =============================================================================
-- \i complete_schema.sql

-- =============================================================================
-- Data Import from db_export/insert_scripts/
-- =============================================================================
-- Note: Uncomment the lines below if running from the project directory
\i db_export/insert_scripts/ai_assignment_generations.sql
\i db_export/insert_scripts/announcements.sql
\i db_export/insert_scripts/assignment_attempts.sql
\i db_export/insert_scripts/assignment_audit_log.sql
\i db_export/insert_scripts/assignment_questions.sql
\i db_export/insert_scripts/assignment_submissions.sql
\i db_export/insert_scripts/assignment_templates.sql
\i db_export/insert_scripts/assignment_violations.sql
\i db_export/insert_scripts/assignments.sql
\i db_export/insert_scripts/audit_logs.sql
\i db_export/insert_scripts/carousel_slides.sql
\i db_export/insert_scripts/chat_attachments.sql
\i db_export/insert_scripts/chat_invitations.sql
\i db_export/insert_scripts/chat_messages.sql
\i db_export/insert_scripts/chat_room_members.sql
\i db_export/insert_scripts/chat_rooms.sql
\i db_export/insert_scripts/club_members.sql
\i db_export/insert_scripts/club_statistics.sql
\i db_export/insert_scripts/clubs.sql
\i db_export/insert_scripts/code_results.sql
\i db_export/insert_scripts/coding_submissions.sql
\i db_export/insert_scripts/comment_likes.sql
\i db_export/insert_scripts/comments.sql
\i db_export/insert_scripts/committee_members.sql
\i db_export/insert_scripts/committee_roles.sql
\i db_export/insert_scripts/committees.sql
\i db_export/insert_scripts/content_permissions.sql
\i db_export/insert_scripts/discussion_replies.sql
\i db_export/insert_scripts/discussions.sql
\i db_export/insert_scripts/email_logs.sql
\i db_export/insert_scripts/email_otps.sql
\i db_export/insert_scripts/event_attendees.sql
\i db_export/insert_scripts/event_registrations.sql
\i db_export/insert_scripts/events.sql
\i db_export/insert_scripts/featured_events.sql
\i db_export/insert_scripts/likes.sql
\i db_export/insert_scripts/media_files.sql
\i db_export/insert_scripts/messages.sql
\i db_export/insert_scripts/migrations.sql
\i db_export/insert_scripts/notifications.sql
\i db_export/insert_scripts/page_content.sql
\i db_export/insert_scripts/post_attachments.sql
\i db_export/insert_scripts/posts.sql
\i db_export/insert_scripts/proctoring_sessions.sql
\i db_export/insert_scripts/project_invitations.sql
\i db_export/insert_scripts/project_members.sql
\i db_export/insert_scripts/projects.sql
\i db_export/insert_scripts/query_cache.sql
\i db_export/insert_scripts/question_media.sql
\i db_export/insert_scripts/question_options.sql
\i db_export/insert_scripts/question_responses.sql
\i db_export/insert_scripts/security_events.sql
\i db_export/insert_scripts/sessions.sql
\i db_export/insert_scripts/submission_attachments.sql
\i db_export/insert_scripts/system_statistics.sql
\i db_export/insert_scripts/task_activity.sql
\i db_export/insert_scripts/tasks.sql
\i db_export/insert_scripts/team_cards.sql
\i db_export/insert_scripts/trusted_devices.sql
\i db_export/insert_scripts/user_activities.sql
\i db_export/insert_scripts/user_badges.sql
\i db_export/insert_scripts/users.sql

-- =============================================================================
-- Verification Queries
-- =============================================================================
\echo 'Database recreation complete!'
\echo 'Verifying data...'

-- Count records in key tables
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'clubs' as table_name, COUNT(*) as record_count FROM clubs
UNION ALL
SELECT 'posts' as table_name, COUNT(*) as record_count FROM posts
UNION ALL
SELECT 'events' as table_name, COUNT(*) as record_count FROM events
UNION ALL
SELECT 'committee_members' as table_name, COUNT(*) as record_count FROM committee_members;

\echo 'Database recreation script completed successfully!'
\echo 'You can now connect to the zenith database with:'
\echo 'psql -U zenithpostgres -d zenith'
