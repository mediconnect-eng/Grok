# PostgreSQL Setup Guide

**Task:** Migrate from SQLite to PostgreSQL for production  
**Why:** SQLite won't handle 100+ concurrent users (database locks)  
**Time:** 15-20 minutes

---

## Option 1: Neon (Recommended - Serverless PostgreSQL)

### Step 1: Create Neon Account (2 min)
1. Go to: https://neon.tech
2. Sign up with GitHub/Google/Email
3. Verify email if needed

### Step 2: Create Database (3 min)
1. Click "Create a project"
2. Project name: `mediconnect`
3. Database name: `mediconnect`
4. Region: Choose closest to your users
5. Click "Create project"

### Step 3: Get Connection String (1 min)
1. After creation, you'll see "Connection Details"
2. Copy the "Connection string" (starts with `postgresql://`)
3. It will look like:
```
postgresql://username:password@ep-xxx.region.aws.neon.tech/mediconnect?sslmode=require
```

### Step 4: Update .env.local (1 min)
Replace the DATABASE_URL in your `.env.local`:

```bash
# Old (SQLite):
# DATABASE_URL=file:./sqlite.db

# New (PostgreSQL):
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/mediconnect?sslmode=require
```

### Step 5: Install PostgreSQL Adapter (2 min)
```bash
npm install pg
npm install --save-dev @types/pg
```

### Step 6: Update Auth Config (5 min)
We need to change from SQLite to PostgreSQL in `src/lib/auth.ts`

Replace:
```typescript
import Database from "better-sqlite3";
const databasePath = process.env.BETTER_AUTH_DB_PATH ?? "./sqlite.db";
const database = new Database(databasePath);
```

With:
```typescript
import { Pool } from "pg";

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

And update the auth config to use the pool.

### Step 7: Test Connection (3 min)
```bash
# Clear old build
Remove-Item -Recurse -Force ".next"

# Start dev server
npm run dev
```

Visit `http://localhost:3000` - if no database errors, you're good!

### Step 8: Seed Demo Accounts (2 min)
```bash
npm run seed
```

**Done! PostgreSQL is configured.** ✅

---

## Option 2: Supabase (Alternative)

### Step 1: Create Supabase Project (3 min)
1. Go to: https://supabase.com
2. Sign up with GitHub
3. Click "New project"
4. Project name: `mediconnect`
5. Database password: Generate strong password
6. Region: Choose closest to users
7. Click "Create new project" (takes 2-3 min)

### Step 2: Get Connection String (2 min)
1. Go to Project Settings → Database
2. Scroll to "Connection string"
3. Select "Connection pooling" mode (important!)
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

### Step 3: Same as Neon
Follow steps 4-8 from Neon instructions above.

---

## Option 3: Local PostgreSQL (Development)

### Step 1: Install PostgreSQL (5 min)
**Windows:**
```powershell
# Using Chocolatey
choco install postgresql

# Or download from:
# https://www.postgresql.org/download/windows/
```

### Step 2: Create Database (2 min)
```bash
# Open PostgreSQL shell (psql)
psql -U postgres

# In psql:
CREATE DATABASE mediconnect;
\q
```

### Step 3: Connection String (1 min)
```bash
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mediconnect
```

### Step 4: Same as Neon
Follow steps 5-8 from Neon instructions.

---

## Troubleshooting

### "Cannot connect to database"
- Check connection string format
- Ensure no spaces in connection string
- Verify database was created
- Check firewall/network settings

### "SSL required" error
- Add `?sslmode=require` to connection string (Neon/Supabase)
- Or set `ssl: false` in local development

### "Better Auth tables not found"
- Better Auth will auto-create tables on first connection
- If issues, run: `npm run dev` and visit any auth page

### Migration from SQLite
- Demo accounts need to be re-seeded: `npm run seed`
- Old SQLite data won't transfer automatically
- For production: export/import data if needed

---

## Connection Pooling (Production)

Add to `src/lib/auth.ts`:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum 20 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

This ensures efficient connection reuse for 100+ concurrent users.

---

## Next Steps After PostgreSQL Setup

Once PostgreSQL is working:
- [ ] Test signup/login
- [ ] Verify demo accounts
- [ ] Check for any database errors
- [ ] Move to Task 4: Demo cleanup

---

**Recommended:** Use Neon (free tier, no credit card, perfect for testing)
