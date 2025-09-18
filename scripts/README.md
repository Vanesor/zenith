# Dummy Users Generator for Zenith Clubs

This script generates realistic dummy users and assigns them to clubs with the specified member counts:

- **Ascend**: 98 members
- **Aster**: 67 members  
- **Achievers**: 82 members
- **Artovert**: 50 members

## 🚀 Quick Start

### Option 1: Interactive Script (Recommended)
```bash
./scripts/dummy-users.sh
```

### Option 2: Direct Node.js Execution
```bash
# Create dummy users
node scripts/create-dummy-users.js

# Cleanup dummy users (created in last 24 hours)
node scripts/create-dummy-users.js --cleanup
```

### Option 3: SQL Script (Database Direct)
```bash
psql -d zenith -f scripts/create-dummy-users.sql
```

### Option 4: NPM Scripts
```bash
# Create dummy users
npm run create:dummy-users

# Cleanup dummy users
npm run cleanup:dummy-users

# Interactive menu
npm run dummy-users
```

## 📋 What It Does

### User Generation
- Creates realistic Indian names using common first and last names
- Generates unique email addresses: `firstname.lastname.branch.year@stvincentngp.edu.in`
- Assigns random academic years (2024, 2023, grad, 2022)
- Assigns random branches (CSE, ECE, EEE, MECH, CIVIL, CHEM, IT, AIDS, CSBS)
- Sets default password: `DummyUser123!` for all dummy users
- Marks all users as verified

### Club Membership
- Assigns random club roles: `member`, `active_member`, `core_member`
- Updates club member counts automatically
- Only creates users needed to reach target counts
- Skips clubs that already have enough members

### Safety Features
- Handles email conflicts by adding timestamps
- Uses database transactions for data integrity
- Provides detailed progress logging
- Allows cleanup of recently created dummy users

## 📊 Generated User Examples

```
Email: aarav.sharma.cse.2024@stvincentngp.edu.in
Name: Aarav Sharma
Branch: CSE
Academic Year: 2024
Role: student
Club Role: active_member
```

## 🧹 Cleanup

To remove dummy users created in the last 24 hours:

```bash
# Interactive cleanup
./scripts/dummy-users.sh

# Direct cleanup
node scripts/create-dummy-users.js --cleanup

# SQL cleanup (uncomment the cleanup section in the SQL file)
```

## ⚠️ Important Notes

1. **Prerequisites**: Ensure your database is running and `.env.local` is configured
2. **Backup**: Consider backing up your database before running the script
3. **Email Uniqueness**: The script handles email conflicts automatically
4. **Password**: All dummy users have the same default password
5. **Club Existence**: Clubs must exist in the database before running the script

## 🔧 Customization

You can modify the script to:
- Change target member counts by editing `clubConfigs` array
- Add more realistic names to the `firstNames` and `lastNames` arrays
- Adjust academic years, branches, or club roles
- Change the default password

## 📈 Verification

After running the script, you can verify the results:

```sql
SELECT 
    c.name,
    c.member_count,
    COUNT(cm.id) as actual_members
FROM clubs c
LEFT JOIN club_members cm ON c.id = cm.club_id AND cm.is_active = true
WHERE c.id IN ('ascend', 'aster', 'achievers', 'artovert')
GROUP BY c.id, c.name, c.member_count
ORDER BY c.name;
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` in `.env.local`
   - Ensure PostgreSQL is running

2. **Club Not Found**
   - Verify club IDs exist in the database
   - Check club names in the database

3. **Permission Errors**
   - Make the bash script executable: `chmod +x scripts/dummy-users.sh`
   - Check database user permissions

4. **Out of Memory**
   - The script processes users in batches of 50 to avoid memory issues
   - For very large numbers, consider running multiple times

### Debug Mode

Add debug logging by setting environment variable:
```bash
DEBUG=true node scripts/create-dummy-users.js
```