# 🚀 Production Deployment Checklist

**Current Status:** 71% Ready (12/17 Phase 1 tasks complete)  
**Next Critical:** PostgreSQL migration

---

## ⚠️ BLOCKING ISSUES (Must fix now)

### 🗄️ 1. PostgreSQL Migration (20 minutes)

**Why:** SQLite won't handle 100+ concurrent users. Will crash/corrupt.

**Steps:**

1. **Sign up for Neon** (recommended - free tier, no credit card)
   - Go to: https://neon.tech
   - Click "Sign up" → Use GitHub login
   - Create new project: "mediconnect"
   - Select region closest to users

2. **Get connection string**
   - Copy the connection string shown
   - Should look like: `postgresql://username:password@ep-xxx.region.aws.neon.tech/mediconnect?sslmode=require`

3. **Update .env.local**
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/mediconnect?sslmode=require
   ```

4. **Install PostgreSQL driver**
   ```bash
   npm install pg @types/pg
   ```

5. **Update src/lib/auth.ts**
   - Remove: `import Database from "better-sqlite3";`
   - Remove: `const db = new Database("./sqlite.db");`
   - Add:
   ```typescript
   import { Pool } from "pg";
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
     max: 20, // connection pool size
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```
   - Replace `database: db,` with `database: pool,`

6. **Test connection**
   ```bash
   npm run dev
   ```
   - Check console for "Connected to database"
   - Visit: http://localhost:3000/api/health
   - Should show: `"database": "ok"`

7. **Re-seed accounts** (IMPORTANT!)
   ```bash
   npm run seed
   ```
   - ⚠️ **SAVE THE PASSWORDS!** They're randomly generated
   - Copy/paste them to a secure location
   - You'll need them to login

**Full guide:** See `POSTGRESQL_SETUP.md`

---

## ✅ READY FOR TESTING (After PostgreSQL)

Once database is migrated, you can:

1. **Test authentication**
   - Login with new demo accounts
   - Test password validation (try weak passwords)
   - Verify rate limiting (5 failed attempts)

2. **Test health check**
   - Visit: http://localhost:3000/api/health
   - Should return 200 OK with all checks passing

3. **Check security**
   - Verify HTTPS redirect works
   - Test security headers (use securityheaders.com)
   - Confirm rate limiting blocks brute force

---

## 📋 Phase 2 Tasks (After PostgreSQL)

### 1. Email Configuration (1.5 hours)

**Choose provider:**
- SendGrid (free tier: 100 emails/day)
- AWS SES (pay-as-you-go, very cheap)
- Resend (developer-friendly, free tier)

**Setup steps:**
1. Sign up for provider
2. Get SMTP credentials
3. Add to `.env.local`:
   ```env
   EMAIL_SERVER=smtp://user:pass@smtp.provider.com:587
   EMAIL_FROM=noreply@yourdomain.com
   ```
4. Enable email verification in Better Auth
5. Test email delivery

### 2. Load Testing (1 hour)

**Install Artillery:**
```bash
npm install -g artillery
```

**Create test:**
```yaml
# load-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 180
      arrivalRate: 100
      name: "Sustained load"

scenarios:
  - name: "Login flow"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "patient@mediconnect.com"
            password: "{{ password }}"
```

**Run test:**
```bash
artillery run load-test.yml
```

**Watch for:**
- Response times > 2 seconds
- Error rate > 1%
- Database connection errors
- Memory leaks

### 3. Production Build (30 minutes)

```bash
# Build for production
npm run build

# Test production build locally
npm start
```

**Verify:**
- All pages load
- Authentication works
- Security headers present
- Rate limiting active
- Health check responds

---

## 🎯 Launch Readiness Criteria

Before inviting 100+ users:

- [ ] PostgreSQL configured and tested
- [ ] Email verification working
- [ ] Load test passed (100 concurrent users)
- [ ] Production build tested locally
- [ ] Health check endpoint responding
- [ ] Rate limiting verified
- [ ] Security headers validated
- [ ] Monitoring/logging active
- [ ] Backup strategy in place
- [ ] Rollback plan documented

---

## 📞 Quick Commands

```bash
# Development
npm run dev                 # Start dev server

# Database
npm run seed               # Seed demo accounts (save passwords!)

# Testing
npm run build              # Build for production
npm start                  # Run production build
artillery run load-test.yml # Load test

# Monitoring
curl http://localhost:3000/api/health  # Check health
```

---

## 🆘 Common Issues

**"Database connection failed"**
- Check DATABASE_URL in .env.local
- Verify PostgreSQL is running
- Check firewall allows connections
- Confirm SSL mode is correct

**"Rate limit too strict"**
- Edit `src/lib/rate-limit.ts`
- Increase `maxRequests` or `windowMs`
- Restart server

**"Email not sending"**
- Verify SMTP credentials
- Check spam folder
- Test with: `curl -X POST http://localhost:3000/api/auth/send-verification-email`

**"Load test failing"**
- Check database connection pool size
- Increase max connections in DATABASE_URL
- Monitor memory usage
- Add Redis for session storage

---

## 📚 Documentation

- `PRODUCTION_FIX_TRACKER.md` - Detailed progress tracker
- `PHASE_1_SUMMARY.md` - What's been completed
- `POSTGRESQL_SETUP.md` - Database migration guide
- `SENTRY_SETUP.md` - Error monitoring setup
- `PRODUCTION_ISSUES_ANALYSIS.md` - Gap analysis

---

**Ready to continue?** Start with PostgreSQL migration above! 🚀
