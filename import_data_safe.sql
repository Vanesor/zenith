-- =============================================================================
-- Safe Data Import Script for Zenith Database
-- =============================================================================
-- This script imports data from db_export/insert_scripts/ without using 
-- a single large transaction, so individual failures don't abort everything
-- =============================================================================

\set QUIET on
\set ON_ERROR_CONTINUE on
SET client_min_messages TO WARNING;
\encoding UTF8

\echo '======================================================================'
\echo 'Starting Safe Data Import for Zenith Database'
\echo 'Database: zenith | User: zenithpostgres'
\echo '======================================================================'

-- First, let's see what we're starting with
\echo 'Current database state before import:'
SELECT 
    schemaname,
    tablename,
    COALESCE((
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = schemaname 
        AND table_name = tablename
    ), 0) as column_count
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

\echo ''
\echo '======================================================================'
\echo 'Beginning Data Import Process...'
\echo '======================================================================'

-- Import each table individually with error handling
\echo 'Importing admins...'
\i db_export/insert_scripts/admins.sql

\echo 'Importing admin_logs...'
\i db_export/insert_scripts/admin_logs.sql

\echo 'Importing assignments...'
\i db_export/insert_scripts/assignments.sql

\echo 'Importing chat_attachments...'
\i db_export/insert_scripts/chat_attachments.sql

\echo 'Importing chat_rooms...'
\i db_export/insert_scripts/chat_rooms.sql

\echo 'Importing clubs...'
\i db_export/insert_scripts/clubs.sql

\echo 'Importing committee_members...'
\i db_export/insert_scripts/committee_members.sql

\echo 'Importing email_logs...'
\i db_export/insert_scripts/email_logs.sql

\echo 'Importing events...'
\i db_export/insert_scripts/events.sql

\echo 'Importing exam_questions...'
\i db_export/insert_scripts/exam_questions.sql

\echo 'Importing exam_submissions...'
\i db_export/insert_scripts/exam_submissions.sql

\echo 'Importing exams...'
\i db_export/insert_scripts/exams.sql

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

\echo ''
\echo '======================================================================'
\echo 'Import process completed! Generating verification report...'
\echo '======================================================================'

-- Show final verification
\echo 'Final table record counts:'
SELECT 
    t.table_name,
    COALESCE(s.n_tup_ins, 0) as inserted_rows,
    COALESCE(s.n_tup_upd, 0) as updated_rows,
    COALESCE(s.n_tup_del, 0) as deleted_rows
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

\echo ''
\echo 'Database size after import:'
SELECT pg_size_pretty(pg_database_size('zenith')) AS database_size;

\echo ''
\echo '======================================================================'
\echo 'Safe Data Import Complete!'
\echo 'Note: Individual table imports may have failed, but the process continued.'
\echo 'Check the output above for any specific error messages.'
\echo '======================================================================'

\set ON_ERROR_CONTINUE off
\set QUIET off
