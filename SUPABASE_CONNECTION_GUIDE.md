# Supabase Database Connection Guide

## How Supabase PostgreSQL Connection Works

Supabase provides a managed PostgreSQL database with the following characteristics:
- **SSL Required**: All connections must use SSL
- **Connection Pooling**: Built-in connection pooling (PgBouncer)
- **IPv6 Support**: Supabase supports both IPv4 and IPv6, but some networks may have issues with IPv6

## Steps to Connect to Supabase

### 1. Get Your Connection Details from Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection info**, you'll find:
   - **Host**: `db.{your-project-ref}.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: Your database password

### 2. Connection String Format

```
postgresql://postgres:{your-password}@db.{your-project-ref}.supabase.co:5432/postgres
```

Your current connection string looks correct:
```
DATABASE_URL="postgresql://postgres:ZenithForum@123@db.qpulpytptbwwumicyzwr.supabase.co:5432/postgres"
```

### 3. Proper Node.js/pg Configuration

```typescript
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

**Important Notes:**
- ✅ **DO**: Use the connection string
- ✅ **DO**: Set `ssl: { rejectUnauthorized: false }`
- ❌ **DON'T**: Override individual connection parameters (host, port, user, etc.)
- ❌ **DON'T**: Use `ssl: false` - Supabase requires SSL

### 4. Common Connection Issues and Solutions

#### ENETUNREACH Error (IPv6 Issue)
```
Error: connect ENETUNREACH 2406:da1a:6b0:f60a:8402:48a5:7d0a:cf5b:5432
```

**Cause**: Your system is trying to connect via IPv6 but your network doesn't support it.

**Solutions:**
1. **Use only the connection string** (which we've implemented)
2. **Add retry logic** (which we've implemented)
3. **Force IPv4 if needed** (see below)

#### Force IPv4 Connection (if IPv6 issues persist)
```typescript
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
```

### 5. Test Your Connection

Create a simple test file to verify your connection:

```javascript
// test-db-connection.js
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
```

### 6. Environment Variables Setup

Your `.env.local` should contain:
```bash
# Supabase Database Connection
DATABASE_URL="postgresql://postgres:YourPassword@db.yourprojectref.supabase.co:5432/postgres"

# Other environment variables...
```

### 7. Firewall and Network Considerations

If you're still getting connection errors:
1. **Check your firewall**: Allow outbound connections on port 5432
2. **Corporate networks**: May block external database connections
3. **VPN**: Try connecting with/without VPN
4. **DNS**: Ensure your DNS can resolve Supabase hostnames

### 8. Monitoring Connection Health

```typescript
// Add to your database.ts
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await Database.query('SELECT 1 as test');
    console.log('✅ Database connection healthy');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
```

## Current Implementation Status

Your database configuration has been updated to:
- ✅ Use connection string only
- ✅ Force SSL for Supabase
- ✅ Include retry logic for connection errors
- ✅ Proper error handling

## Next Steps

1. Restart your development server
2. Test the connection
3. Monitor for any remaining connection issues

If you still encounter issues, the problem might be:
- Network/firewall blocking the connection
- Incorrect Supabase credentials
- Supabase instance not running or accessible
