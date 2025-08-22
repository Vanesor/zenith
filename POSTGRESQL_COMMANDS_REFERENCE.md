# PostgreSQL Commands Reference Guide

A comprehensive reference for PostgreSQL commands for the Zenith project database.

## Database Connection & Basic Commands

### Connect to Database
```bash
# Connect to PostgreSQL as zenith user
psql -h localhost -U ZenithPostgres -d zenith

# Connect with password prompt
PGPASSWORD=AtharvaAyush psql -h localhost -U ZenithPostgres -d zenith

# Connect as postgres superuser
sudo -u postgres psql
```

### Basic Database Information
```sql
-- Show current database
SELECT current_database();

-- Show current user
SELECT current_user;

-- Show PostgreSQL version
SELECT version();

-- Show current date and time
SELECT now();

-- List all databases
\l

-- Connect to specific database
\c zenith

-- Show current connection info
\conninfo
```

## Schema & Table Management

### List Tables and Schema
```sql
-- List all tables
\dt

-- List all tables with size
\dt+

-- Show table structure
\d table_name

-- Show detailed table info
\d+ table_name

-- List all schemas
\dn

-- List all indexes
\di

-- Show all constraints
\d+ table_name
```

### Table Information
```sql
-- Show table columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Show table size
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Show all foreign keys for a table
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'users';
```

## Data Querying

### Basic Queries
```sql
-- Count records in table
SELECT COUNT(*) FROM users;

-- Show recent records
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- Show specific columns
SELECT id, name, email, role FROM users;

-- Filter by condition
SELECT * FROM users WHERE role = 'admin';

-- Search by pattern
SELECT * FROM users WHERE name ILIKE '%john%';
```

### Advanced Queries
```sql
-- Join tables
SELECT u.name, c.name as club_name 
FROM users u 
LEFT JOIN clubs c ON u.club_id = c.id;

-- Group by and count
SELECT role, COUNT(*) 
FROM users 
GROUP BY role 
ORDER BY COUNT(*) DESC;

-- Find duplicates
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Get table statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables;
```

## User & Permission Management

### User Management
```sql
-- List all users/roles
\du

-- Create new user
CREATE USER new_user WITH PASSWORD 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zenith TO new_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO new_user;

-- Change password
ALTER USER ZenithPostgres WITH PASSWORD 'new_password';

-- Drop user
DROP USER username;
```

### Check Current Permissions
```sql
-- Show current user permissions
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = 'ZenithPostgres';

-- Show table permissions
SELECT grantor, grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public';
```

## Database Maintenance

### Backup & Restore
```bash
# Create backup
pg_dump -h localhost -U ZenithPostgres -d zenith > zenith_backup.sql

# Create compressed backup
pg_dump -h localhost -U ZenithPostgres -d zenith | gzip > zenith_backup.sql.gz

# Restore from backup
psql -h localhost -U ZenithPostgres -d zenith < zenith_backup.sql

# Restore compressed backup
gunzip -c zenith_backup.sql.gz | psql -h localhost -U ZenithPostgres -d zenith
```

### Performance & Maintenance
```sql
-- Analyze table statistics
ANALYZE;

-- Vacuum table (cleanup)
VACUUM;

-- Full vacuum with analyze
VACUUM FULL ANALYZE;

-- Check database size
SELECT pg_size_pretty(pg_database_size('zenith'));

-- Show active connections
SELECT * FROM pg_stat_activity WHERE datname = 'zenith';

-- Kill connection
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'zenith' AND pid <> pg_backend_pid();
```

## Index Management

### Index Operations
```sql
-- List all indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Create index
CREATE INDEX idx_users_email ON users(email);

-- Create partial index
CREATE INDEX idx_active_users ON users(id) WHERE role = 'active';

-- Drop index
DROP INDEX idx_users_email;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Monitoring & Debugging

### Query Performance
```sql
-- Enable query timing
\timing

-- Show slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Show table access statistics
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- Check for unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public';
```

### Lock Information
```sql
-- Show current locks
SELECT l.locktype, l.database, l.relation, l.page, l.tuple, l.virtualxid, l.transactionid, l.classid, l.objid, l.objsubid, l.virtualtransaction, l.pid, l.mode, l.granted
FROM pg_locks l;

-- Show blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## Useful psql Commands

### Navigation & Help
```bash
# List all psql commands
\?

# Help for SQL commands
\h CREATE TABLE

# Show command history
\s

# Execute command from file
\i filename.sql

# Output query results to file
\o output.txt

# Turn off output to file
\o

# Quit psql
\q
```

### Display Settings
```bash
# Toggle extended display (vertical format)
\x

# Set null display
\pset null 'NULL'

# Set field separator
\pset fieldsep ','

# Show only data (no headers)
\t

# Show timing for commands
\timing
```

## Transaction Management

### Basic Transactions
```sql
-- Start transaction
BEGIN;

-- Commit transaction
COMMIT;

-- Rollback transaction
ROLLBACK;

-- Savepoint
SAVEPOINT sp1;

-- Rollback to savepoint
ROLLBACK TO sp1;

-- Release savepoint
RELEASE SAVEPOINT sp1;
```

## Environment Variables

### Common PostgreSQL Environment Variables
```bash
# Set default connection parameters
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=zenith
export PGUSER=ZenithPostgres
export PGPASSWORD=AtharvaAyush

# Use in commands
psql  # Will use above defaults
```

## Troubleshooting

### Common Issues
```sql
-- Check if PostgreSQL is running
SELECT 1;

-- Check connection limits
SHOW max_connections;

-- Show current connections
SELECT count(*) FROM pg_stat_activity;

-- Check log file location
SHOW log_directory;
SHOW log_filename;

-- Check configuration
SHOW ALL;

-- Find configuration file
SHOW config_file;
```

### Reset Database
```sql
-- Drop all tables (careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO ZenithPostgres;
GRANT ALL ON SCHEMA public TO public;
```

## Quick Reference Commands

### Most Used Commands
```bash
# Connect to database
psql -h localhost -U ZenithPostgres -d zenith

# List tables
\dt

# Describe table
\d users

# Count records
SELECT COUNT(*) FROM users;

# Show recent activity
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

# Backup database
pg_dump -h localhost -U ZenithPostgres zenith > backup.sql

# Restore database
psql -h localhost -U ZenithPostgres zenith < backup.sql
```

### Performance Monitoring
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Top 10 largest tables
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Index usage statistics
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

This reference guide covers the most important PostgreSQL commands you'll need for managing the Zenith database. Keep it handy for quick reference!
