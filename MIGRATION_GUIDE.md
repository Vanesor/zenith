# Supabase to Local PostgreSQL Migration Guide

## Overview
This guide helps you migrate data from your Supabase database to your local PostgreSQL database.

## Prerequisites

1. **Local PostgreSQL Setup**
   ```bash
   # Make sure PostgreSQL is running locally
   sudo systemctl start postgresql
   
   # Verify connection
   psql -h localhost -p 5432 -U zenithpostgres -d zenith
   ```

2. **Environment Configuration**
   - Ensure your `.env` file has the correct local database credentials
   - Supabase credentials should be in `.env.local.example` or environment variables

## Migration Scripts

### 1. Full Migration Script (`migrate-supabase-to-local.js`)
Complete migration with table structure creation and data integrity checks.

**Features:**
- ✅ Automatic table structure creation
- ✅ Dependency-aware table migration order
- ✅ Data validation and error handling
- ✅ Automatic backup creation
- ✅ Sequence reset after migration
- ✅ Batch processing for large tables
- ✅ Detailed progress reporting

**Usage:**
```bash
# Full migration
node migrate-supabase-to-local.js

# Dry run (see what would be migrated)
node migrate-supabase-to-local.js --dry-run

# Migrate specific table only
node migrate-supabase-to-local.js --table users

# Help
node migrate-supabase-to-local.js --help
```

### 2. Simple Data Copy (`simple-data-copy.js`)
Quick migration for essential tables only.

**Features:**
- ✅ Fast migration of core tables
- ✅ Simple error handling
- ✅ Minimal dependencies

**Usage:**
```bash
node simple-data-copy.js
```

## Migration Steps

### Step 1: Backup Your Local Database
```bash
pg_dump -h localhost -p 5432 -U zenithpostgres -d zenith > backup-$(date +%Y%m%d).sql
```

### Step 2: Ensure Database Schema Exists
Make sure your local database has the correct schema. You can:

1. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

2. Or import your existing schema:
   ```bash
   psql -h localhost -p 5432 -U zenithpostgres -d zenith < schema.sql
   ```

### Step 3: Run Migration
```bash
# For comprehensive migration
node migrate-supabase-to-local.js

# For quick essential data only
node simple-data-copy.js
```

### Step 4: Verify Migration
```bash
# Check row counts
psql -h localhost -p 5432 -U zenithpostgres -d zenith -c "
SELECT 
  schemaname,
  tablename,
  n_tup_ins as row_count
FROM pg_stat_user_tables 
ORDER BY n_tup_ins DESC;
"
```

## Table Migration Order

The full migration script migrates tables in dependency order:

1. **Core Tables**
   - `users`
   - `clubs`
   - `committees`

2. **Relationship Tables**
   - `committee_roles`
   - `committee_members`
   - `club_members`

3. **Content Tables**
   - `events`
   - `assignments`
   - `posts`

4. **Activity Tables**
   - `event_attendees`
   - `assignment_submissions`
   - `post_likes`
   - `comments`

5. **System Tables**
   - `notifications`
   - `user_sessions`
   - `email_logs`

## Configuration

### Database Connections

**Supabase (Source):**
```javascript
const SUPABASE_CONFIG = {
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qpulpytptbwwumicyzwr',
  password: 'ascendasterachievers',
  ssl: { rejectUnauthorized: false }
};
```

**Local PostgreSQL (Target):**
```javascript
const LOCAL_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'zenith',
  user: 'zenithpostgres',
  password: 'AtharvaAyush'
};
```

## Troubleshooting

### Common Issues

1. **Connection Errors**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # Check if database exists
   psql -h localhost -p 5432 -U zenithpostgres -l
   ```

2. **Permission Errors**
   ```sql
   -- Grant permissions to user
   ALTER USER zenithpostgres CREATEDB;
   GRANT ALL PRIVILEGES ON DATABASE zenith TO zenithpostgres;
   ```

3. **Table Not Found Errors**
   ```bash
   # Create missing tables with Prisma
   npx prisma db push
   
   # Or run migrations
   npx prisma migrate dev
   ```

4. **Foreign Key Constraint Errors**
   ```sql
   -- Temporarily disable foreign key checks
   SET session_replication_role = replica;
   -- Run migration
   SET session_replication_role = DEFAULT;
   ```

### Manual Data Verification

```sql
-- Compare row counts between databases
-- Run this on both Supabase and local DB

SELECT 
  table_name,
  (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I', table_name), false, true, '')))[1]::text::int AS row_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## Post-Migration Tasks

1. **Update Application Configuration**
   - Ensure your app uses local database URLs
   - Update any hardcoded Supabase references

2. **Test Application Functions**
   - User authentication
   - Data CRUD operations
   - File uploads (if using local storage)

3. **Performance Optimization**
   ```sql
   -- Analyze tables for query optimization
   ANALYZE;
   
   -- Update table statistics
   VACUUM ANALYZE;
   ```

4. **Backup Strategy**
   ```bash
   # Set up automated backups
   crontab -e
   # Add: 0 2 * * * pg_dump -h localhost -p 5432 -U zenithpostgres -d zenith > /backup/zenith-$(date +\%Y\%m\%d).sql
   ```

## Security Notes

- ⚠️ The migration scripts contain database credentials
- 🔒 Ensure these scripts are not committed to version control
- 🛡️ Use environment variables for sensitive information
- 🔐 Change default passwords after migration

## File Upload Migration

If you have files stored in Supabase Storage, you'll need to migrate them separately:

1. **Download from Supabase Storage**
2. **Upload to Local Storage** (using your LocalStorageService)
3. **Update file paths in database records**

This would require a separate file migration script if needed.

## Support

If you encounter issues:
1. Check the migration logs for specific error messages
2. Verify database connections manually
3. Ensure all prerequisites are met
4. Run migrations on smaller table subsets first
