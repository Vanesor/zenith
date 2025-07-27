# PostgreSQL Setup Guide for Zenith Forum

This guide will help you set up PostgreSQL database for the Zenith forum application on both Windows and Ubuntu.

## Prerequisites

### For Windows:
1. Download PostgreSQL from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user

### For Ubuntu:
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Database Setup

### 1. Access PostgreSQL

#### Windows:
- Open pgAdmin 4 (installed with PostgreSQL)
- Or use Command Prompt: `psql -U postgres`

#### Ubuntu:
```bash
# Switch to postgres user
sudo -u postgres psql
```

### 2. Create Database and User

```sql
-- Create database
CREATE DATABASE zenith_forum;

-- Create user with password
CREATE USER zenith_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zenith_forum TO zenith_user;

-- Connect to the database
\c zenith_forum;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO zenith_user;

-- Exit PostgreSQL
\q
```

### 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Update the `.env.local` file with your database credentials:

```env
# Database
DATABASE_URL="postgresql://zenith_user:your_secure_password@localhost:5432/zenith_forum?schema=public"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here-generate-a-random-string"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret-here-generate-another-random-string"

# Gemini AI (Get from Google AI Studio)
GOOGLE_GEMINI_API_KEY="your-gemini-api-key-here"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Generate Prisma Client and Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create and run database migrations
npx prisma db push

# (Optional) Seed the database with sample data
npx prisma db seed
```

## Getting Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and add it to your `.env.local` file

## Database Management

### Useful Commands:

```bash
# View database in browser (Prisma Studio)
npx prisma studio

# Reset database (careful - this deletes all data!)
npx prisma db push --force-reset

# View database schema
npx prisma db pull

# Format schema file
npx prisma format
```

### Backup and Restore:

#### Backup:
```bash
# Windows
pg_dump -U zenith_user -h localhost zenith_forum > backup.sql

# Ubuntu
sudo -u postgres pg_dump zenith_forum > backup.sql
```

#### Restore:
```bash
# Windows
psql -U zenith_user -h localhost zenith_forum < backup.sql

# Ubuntu
sudo -u postgres psql zenith_forum < backup.sql
```

## Troubleshooting

### Common Issues:

1. **Connection refused**: Make sure PostgreSQL service is running
   ```bash
   # Windows (in Services.msc)
   # Ubuntu
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Authentication failed**: Check username, password, and database name in `.env.local`

3. **Permission denied**: Make sure the user has proper privileges
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE zenith_forum TO zenith_user;
   GRANT ALL ON SCHEMA public TO zenith_user;
   ```

4. **Port conflicts**: Default PostgreSQL port is 5432. Make sure it's not in use by another service

### Testing Connection:

```bash
# Test database connection
npx prisma db ping

# Or use psql directly
psql "postgresql://zenith_user:your_password@localhost:5432/zenith_forum"
```

## Next Steps

After setting up the database:

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000` to see the application
3. Use the demo credentials to test login:
   - Email: `demo@zenith.edu`
   - Password: `demo123`

The application will automatically create the necessary tables when you first run it.
