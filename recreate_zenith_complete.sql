-- =============================================================================
-- Complete PostgreSQL Database Recreation Script for Zenith (With Data Import)
-- =============================================================================
-- This script will recreate the entire database with schema and data
-- Run this from your project directory: psql -U postgres < recreate_zenith_complete.sql
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

\echo 'Database and user created successfully!'
\echo 'Importing schema...'

-- Import schema from complete_schema.sql
\i complete_schema.sql

\echo 'Schema imported successfully!'
\echo 'Importing data from db_export...'

-- Import all data from db_export/insert_scripts/
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

\echo 'Data import completed!'
\echo 'Verifying database...'

-- Verification queries
SELECT 'Database Recreation Summary' as info;
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'clubs' as table_name, COUNT(*) as record_count FROM clubs
UNION ALL
SELECT 'posts' as table_name, COUNT(*) as record_count FROM posts
UNION ALL
SELECT 'events' as table_name, COUNT(*) as record_count FROM events
UNION ALL
SELECT 'committee_members' as table_name, COUNT(*) as record_count FROM committee_members
UNION ALL
SELECT 'assignments' as table_name, COUNT(*) as record_count FROM assignments
UNION ALL
SELECT 'projects' as table_name, COUNT(*) as record_count FROM projects;

-- Show database size
SELECT pg_size_pretty(pg_database_size('zenith')) as database_size;

\echo '======================================================================'
\echo 'Database recreation completed successfully!'
\echo '======================================================================'
\echo 'Database: zenith'
\echo 'User: zenithpostgres'
\echo 'Password: AtharvaAyush'
\echo '======================================================================'
\echo 'You can now connect with:'
\echo 'psql -U zenithpostgres -d zenith'
\echo '======================================================================'
