# Local Database Setup Guide

## Option 1: PostgreSQL with Docker (Recommended)

### 1. Install Docker Desktop
Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

### 2. Create docker-compose.yml for local PostgreSQL
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: zenith_postgres
    environment:
      POSTGRES_DB: zenith
      POSTGRES_USER: zenith_user
      POSTGRES_PASSWORD: zenith_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

### 3. Start the database
```bash
docker-compose up -d
```

### 4. Update your .env file
```env
DATABASE_URL="postgresql://zenith_user:zenith_password@localhost:5432/zenith"
DIRECT_URL="postgresql://zenith_user:zenith_password@localhost:5432/zenith"
```

### 5. Run migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Option 2: SQLite (Simplest)

### 1. Update prisma/schema.prisma datasource
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 2. Update .env
```env
DATABASE_URL="file:./dev.db"
# Remove DIRECT_URL for SQLite
```

### 3. Run migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Benefits of Local Database

✅ **No Network Issues**: Eliminates connectivity problems
✅ **Faster Development**: Lower latency, faster queries
✅ **Offline Development**: Work without internet
✅ **Better Debugging**: Full control over database
✅ **Cost Effective**: No cloud database costs during development
✅ **Schema Control**: Easy to reset and modify during development

## Migration Commands

```bash
# Reset database and start fresh
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```
