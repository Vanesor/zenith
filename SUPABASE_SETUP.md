# Zenith - Supabase Database Setup Guide

This guide explains how to set up and configure your Supabase database for the Zenith application.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Node.js 18.x or later installed
4. npm 9.x or later installed

## Setup Steps

### 1. Clone the environment file

```bash
cp env.local.example .env.local
```

### 2. Update environment variables

Edit the `.env.local` file and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

You can find these credentials in your Supabase project dashboard under Project Settings > API.

### 3. Install dependencies

```bash
npm install
```

### 4. Set up required SQL functions

First, set up the necessary SQL functions for the schema migration:

```bash
npm run db:setup:supabase:functions
```

This script will create the SQL functions needed by the migration script. If it fails, follow the on-screen instructions to create the functions manually using the Supabase SQL Editor.

### 5. Set up the database schema

Once the required functions are in place, run the schema setup script:

```bash
npm run db:setup:supabase
```

This will create all the necessary tables and functions in your Supabase database.

### 6. Verify the database schema

To verify that the schema was set up correctly:

```bash
npm run db:verify:supabase
```

This will check that all required tables, columns, and functions exist in your database.

## Schema Structure

The Zenith application uses the following tables:

- `users`: User accounts and profiles
- `clubs`: Forum clubs/groups
- `club_members`: Club membership information
- `posts`: Forum posts
- `comments`: Comments on posts
- `likes`: Likes for posts and comments
- `chat_rooms`: Chat rooms for real-time communication
- `chat_room_members`: Chat room membership information
- `messages`: Chat messages
- `events`: Club events
- `event_attendees`: Event attendance information
- `assignments`: Club assignments
- `assignment_submissions`: Assignment submissions
- `notifications`: User notifications
- `sessions`: User session management

## Data Migration

If you're migrating from a different database system to Supabase, you'll need to:

1. Export your data from the existing database
2. Format the data to match the Supabase schema
3. Import the data into Supabase

We recommend using the Supabase dashboard for importing large data sets.

## Maintenance

To automatically clean up old notifications and sessions, Supabase provides a pg_cron extension that you can enable in your project. After enabling it, you can schedule the cleanup functions to run regularly.

Example cron job configuration:

```sql
SELECT cron.schedule(
  'cleanup-notifications', -- name of the job
  '0 0 * * *',            -- run every day at midnight
  $$SELECT cleanup_old_notifications()$$
);
```

## Troubleshooting

If you encounter issues during setup:

1. Check that your Supabase credentials are correct
2. Ensure that the service key has the necessary permissions
3. Review any error messages from the setup scripts
4. Check your Supabase project logs for more details
5. Make sure the `exec_sql` function is available in your Supabase project

For more help, refer to the [Supabase documentation](https://supabase.com/docs) or create an issue in the project repository.
