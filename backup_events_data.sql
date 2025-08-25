-- =============================================================================
-- Backup Current Events Data (run before inserting new events)
-- =============================================================================

\echo 'Creating backup of current events data...'

-- Backup current events
CREATE TABLE IF NOT EXISTS events_backup AS 
SELECT * FROM events;

\echo 'Backup created: events_backup table'

-- Backup current clubs data  
CREATE TABLE IF NOT EXISTS clubs_backup AS 
SELECT * FROM clubs;

\echo 'Backup created: clubs_backup table'

-- Show current data before changes
\echo ''
\echo 'Current clubs:'
SELECT id, name, type FROM clubs ORDER BY name;

\echo ''
\echo 'Current events:'
SELECT e.title, c.name as club_name, e.status, e.event_date 
FROM events e 
LEFT JOIN clubs c ON e.club_id = c.id 
ORDER BY c.name, e.event_date;

\echo ''
\echo 'Backup completed. You can now run insert_dummy_events.sql'
