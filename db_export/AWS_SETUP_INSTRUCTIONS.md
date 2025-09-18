# AWS Database Setup Instructions

## Files to Upload to Your AWS Instance

Upload these files to your AWS Lightsail instance:

### Required Files:
1. **setup-aws-database.sh** - Main setup script
2. **schema_only_2025-09-18_14-08-40.sql** - Database schema (118KB)
3. **data_only_2025-09-18_14-08-40.sql** - Database data (553KB)

### Optional Alternative:
- **complete_backup_2025-09-18_14-08-40.sql** - Complete backup (663KB)
- **setup-aws-database-simple.sh** - Alternative script using complete backup

## How to Upload Files

### Option 1: Using SCP
```bash
# From your local machine, upload files to AWS
scp setup-aws-database.sh schema_only_2025-09-18_14-08-40.sql data_only_2025-09-18_14-08-40.sql ubuntu@YOUR_AWS_IP:~/
```

### Option 2: Using AWS Console File Upload
1. Connect to your Lightsail instance via SSH
2. Use the browser-based file upload feature in AWS console

### Option 3: Using SFTP
```bash
sftp ubuntu@YOUR_AWS_IP
put setup-aws-database.sh
put schema_only_2025-09-18_14-08-40.sql
put data_only_2025-09-18_14-08-40.sql
quit
```

## Running the Setup

1. **Connect to your AWS instance:**
   ```bash
   ssh ubuntu@YOUR_AWS_IP
   ```

2. **Make the script executable:**
   ```bash
   chmod +x setup-aws-database.sh
   ```

3. **Install PostgreSQL if not already installed:**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

4. **Run the setup script:**
   ```bash
   sudo ./setup-aws-database.sh
   ```

5. **Follow the prompts and provide the postgres password when asked**

## What the Script Does

✅ Checks PostgreSQL service status
✅ Creates `zenithpostgres` user with password `AtharvaAyush`
✅ Creates `zenith` database
✅ Imports complete schema with all tables, constraints, and indexes
✅ Imports all data including:
   - 263 users with synchronized club_id
   - 4 clubs with current memberships
   - Current academic year data (2025-2026)
   - Leadership hierarchy with mentor/outreach/technical roles
✅ Verifies the setup with data counts

## After Setup

Update your application's DATABASE_URL:
```
DATABASE_URL="postgres://zenithpostgres:AtharvaAyush@localhost:5432/zenith"
```

Or for external connections:
```
DATABASE_URL="postgres://zenithpostgres:AtharvaAyush@YOUR_AWS_PUBLIC_IP:5432/zenith"
```

## Troubleshooting

- If PostgreSQL connection fails, check: `sudo systemctl status postgresql`
- If permission denied, make sure you're running with `sudo`
- If files not found, verify they're uploaded to the correct directory
- For external connections, configure PostgreSQL and firewall appropriately