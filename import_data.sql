-- =============================================================================
-- Data Import Script for Zenith Database
-- =============================================================================
-- This script imports all data from db_export/insert_scripts/ folder
-- Run this as: psql -U zenithpostgres -d zenith < import_data.sql
-- =============================================================================

-- Connect to zenith database as zenithpostgres user
\c zenith zenithpostgres

\echo '======================================================================'
\echo 'Starting data import for Zenith database...'
\echo '======================================================================'

-- Set client encoding to UTF8
SET client_encoding = 'UTF8';

-- Disable notices for cleaner output
SET client_min_messages = warning;

-- Start transaction for data import
BEGIN;

\echo 'Importing data from db_export/insert_scripts/...'

-- Import all data files in order
\echo 'Importing ai_assignment_generations...'
\i db_export/insert_scripts/ai_assignment_generations.sql

\echo 'Importing announcements...'
\i db_export/insert_scripts/announcements.sql

\echo 'Importing assignment_attempts...'
\i db_export/insert_scripts/assignment_attempts.sql

\echo 'Importing assignment_audit_log...'
\i db_export/insert_scripts/assignment_audit_log.sql

\echo 'Importing assignment_questions...'
\i db_export/insert_scripts/assignment_questions.sql

\echo 'Importing assignment_submissions...'
\i db_export/insert_scripts/assignment_submissions.sql

\echo 'Importing assignment_templates...'
\i db_export/insert_scripts/assignment_templates.sql

\echo 'Importing assignment_violations...'
\i db_export/insert_scripts/assignment_violations.sql

\echo 'Importing assignments...'
\i db_export/insert_scripts/assignments.sql

\echo 'Importing audit_logs...'
\i db_export/insert_scripts/audit_logs.sql

\echo 'Importing carousel_slides...'
\i db_export/insert_scripts/carousel_slides.sql

\echo 'Importing chat_attachments...'
\i db_export/insert_scripts/chat_attachments.sql

\echo 'Importing chat_invitations...'
\i db_export/insert_scripts/chat_invitations.sql

\echo 'Importing chat_messages...'
\i db_export/insert_scripts/chat_messages.sql

\echo 'Importing chat_room_members...'
\i db_export/insert_scripts/chat_room_members.sql

\echo 'Importing chat_rooms...'
\i db_export/insert_scripts/chat_rooms.sql

\echo 'Importing club_members...'
\i db_export/insert_scripts/club_members.sql

\echo 'Importing club_statistics...'
\i db_export/insert_scripts/club_statistics.sql

\echo 'Importing clubs...'
\i db_export/insert_scripts/clubs.sql

\echo 'Importing code_results...'
\i db_export/insert_scripts/code_results.sql

\echo 'Importing coding_submissions...'
\i db_export/insert_scripts/coding_submissions.sql

\echo 'Importing comment_likes...'
\i db_export/insert_scripts/comment_likes.sql

\echo 'Importing comments...'
\i db_export/insert_scripts/comments.sql

\echo 'Importing committee_members...'
\i db_export/insert_scripts/committee_members.sql

\echo 'Importing committee_roles...'
\i db_export/insert_scripts/committee_roles.sql

\echo 'Importing committees...'
\i db_export/insert_scripts/committees.sql

\echo 'Importing content_permissions...'
\i db_export/insert_scripts/content_permissions.sql

\echo 'Importing discussion_replies...'
\i db_export/insert_scripts/discussion_replies.sql

\echo 'Importing discussions...'
\i db_export/insert_scripts/discussions.sql

\echo 'Importing email_logs...'
\i db_export/insert_scripts/email_logs.sql

\echo 'Importing email_otps...'
\i db_export/insert_scripts/email_otps.sql

\echo 'Importing event_attendees...'
\i db_export/insert_scripts/event_attendees.sql

\echo 'Importing event_registrations...'
\i db_export/insert_scripts/event_registrations.sql

\echo 'Importing events...'
\i db_export/insert_scripts/events.sql

\echo 'Importing featured_events...'
\i db_export/insert_scripts/featured_events.sql

\echo 'Importing likes...'
\i db_export/insert_scripts/likes.sql

\echo 'Importing media_files...'
\i db_export/insert_scripts/media_files.sql

\echo 'Importing messages...'
\i db_export/insert_scripts/messages.sql

\echo 'Importing migrations...'
\i db_export/insert_scripts/migrations.sql

\echo 'Importing notifications...'
\i db_export/insert_scripts/notifications.sql

\echo 'Importing page_content...'
\i db_export/insert_scripts/page_content.sql

\echo 'Importing post_attachments...'
\i db_export/insert_scripts/post_attachments.sql

\echo 'Importing posts...'
\i db_export/insert_scripts/posts.sql

\echo 'Importing proctoring_sessions...'
\i db_export/insert_scripts/proctoring_sessions.sql

\echo 'Importing project_invitations...'
\i db_export/insert_scripts/project_invitations.sql

\echo 'Importing project_members...'
\i db_export/insert_scripts/project_members.sql

\echo 'Importing projects...'
\i db_export/insert_scripts/projects.sql

\echo 'Importing query_cache...'
\i db_export/insert_scripts/query_cache.sql

\echo 'Importing question_media...'
\i db_export/insert_scripts/question_media.sql

\echo 'Importing question_options...'
\i db_export/insert_scripts/question_options.sql

\echo 'Importing question_responses...'
\i db_export/insert_scripts/question_responses.sql

\echo 'Importing security_events...'
\i db_export/insert_scripts/security_events.sql

\echo 'Importing sessions...'
\i db_export/insert_scripts/sessions.sql

\echo 'Importing submission_attachments...'
\i db_export/insert_scripts/submission_attachments.sql

\echo 'Importing system_statistics...'
\i db_export/insert_scripts/system_statistics.sql

\echo 'Importing task_activity...'
\i db_export/insert_scripts/task_activity.sql

\echo 'Importing tasks...'
\i db_export/insert_scripts/tasks.sql

\echo 'Importing team_cards...'
\i db_export/insert_scripts/team_cards.sql

\echo 'Importing trusted_devices...'
\i db_export/insert_scripts/trusted_devices.sql

\echo 'Importing user_activities...'
\i db_export/insert_scripts/user_activities.sql

\echo 'Importing user_badges...'
\i db_export/insert_scripts/user_badges.sql

\echo 'Importing users...'
\i db_export/insert_scripts/users.sql

-- Commit the transaction
COMMIT;

\echo '======================================================================'
\echo 'Data import completed successfully!'
\echo '======================================================================'

-- Verify the imported data
\echo 'Verification Summary:'
\echo '======================================================================'

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
SELECT 'projects' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'chat_rooms' as table_name, COUNT(*) as record_count FROM chat_rooms
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as record_count FROM notifications
UNION ALL
SELECT 'media_files' as table_name, COUNT(*) as record_count FROM media_files
ORDER BY table_name;

\echo '======================================================================'
\echo 'Database size after import:'
SELECT pg_size_pretty(pg_database_size('zenith')) as database_size;

\echo '======================================================================'
\echo 'Data import script completed successfully!'
\echo 'Database: zenith'
\echo 'User: zenithpostgres'
\echo '======================================================================'
