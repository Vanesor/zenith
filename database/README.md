# Zenith Forum Database Setup

## Files in this directory:

### `supabase_complete_setup.sql`
**This is the ONLY file you need!**

This single SQL file contains everything needed to set up the complete Zenith Forum database in Supabase:
- All table schemas
- Foreign key constraints
- Performance indexes
- Complete sample data including users, clubs, chat rooms, assignments, events, and posts

## How to use:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `supabase_complete_setup.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the script

## What you get:

- **3 Clubs**: ASCEND (Technical), GENESIS (Entrepreneurship), PHOENIX (Cultural)
- **24+ Users**: Admins, coordinators, faculty, and students with verified password hashes
- **8 Chat Rooms**: Public rooms and club-specific discussion rooms
- **6 Assignments**: 2 assignments per club with realistic content
- **6 Events**: Upcoming events for each club
- **Sample Posts**: Discussion posts in each club
- **All necessary indexes** for optimal performance

## Test Accounts:

All users have the password: **`password123`**

| Email | Role | Club | Purpose |
|-------|------|------|---------|
| `admin@zenith.com` | Admin | ASCEND | Full system access |
| `ascend.coordinator@zenith.com` | Coordinator | ASCEND | Club management |
| `student1.ascend@zenith.com` | Student | ASCEND | Regular user |
| `student1.genesis@zenith.com` | Student | GENESIS | Regular user |
| `student1.phoenix@zenith.com` | Student | PHOENIX | Regular user |

## Ready to test:

After running the setup script, your Zenith Forum application should have:
- ✅ Working authentication with JWT tokens
- ✅ Club management functionality
- ✅ Chat rooms with messages
- ✅ Assignment system
- ✅ Event management
- ✅ Discussion forums
- ✅ Notifications

The database is production-ready with proper relationships, constraints, and indexes.
