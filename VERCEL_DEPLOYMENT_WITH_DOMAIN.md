# 🚀 Vercel Deployment Guide with Custom Domain (BigRock)

**Platform:** Vercel + Neon PostgreSQL  
**Custom Domain:** From BigRock  
**Estimated Time:** 30-45 minutes  
**Date:** October 16, 2025

---

## 📋 Pre-Deployment Checklist

✅ **Build Test**: `npm run build` (currently running)  
✅ **Git Repository**: All changes committed and pushed  
✅ **Database**: Neon PostgreSQL configured  
✅ **Environment Variables**: Ready to configure  
✅ **Domain**: Available from BigRock  

---

## Part 1: Deploy to Vercel (15 minutes)

### Step 1: Sign Up for Vercel

1. Go to **https://vercel.com/signup**
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub repositories
4. Complete your profile

### Step 2: Import Your Project

1. Click **"Add New... → Project"**
2. Select **"Import Git Repository"**
3. Find `mediconnect-eng/Grok` in the list
4. Click **"Import"**

### Step 3: Configure Project Settings

**Framework Preset:** Next.js ✅ (Auto-detected)

**Build & Development Settings:**
- Build Command: `next build` (default)
- Output Directory: `.next` (default)  
- Install Command: `npm install` (default)
- Development Command: `next dev` (default)

**Root Directory:** `./` (leave blank or use root)

Click **"Deploy"** to proceed to environment variables

### Step 4: Add Environment Variables

Click **"Environment Variables"** tab and add these:

```bash
# ========================================
# DATABASE CONFIGURATION
# ========================================
DATABASE_URL
postgresql://neondb_owner:npg_CQMxK4E1lmcL@ep-winter-rice-a9mkk7ue-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require

# ========================================
# AUTHENTICATION
# ========================================
BETTER_AUTH_SECRET
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Paste your generated secret here

BETTER_AUTH_URL
https://your-app.vercel.app
# You'll update this after first deployment

# ========================================
# APPLICATION
# ========================================
NEXT_PUBLIC_APP_URL
https://your-app.vercel.app
# You'll update this after first deployment

NODE_ENV
production

# ========================================
# EMAIL (Optional - Configure Later)
# ========================================
SMTP_HOST
smtp.gmail.com

SMTP_PORT
587

SMTP_USER
your-email@gmail.com

SMTP_PASS
your-app-password

# ========================================
# OPTIONAL: OAuth Providers
# ========================================
GITHUB_CLIENT_ID
(leave blank for now)

GITHUB_CLIENT_SECRET
(leave blank for now)

GOOGLE_CLIENT_ID
(leave blank for now)

GOOGLE_CLIENT_SECRET
(leave blank for now)
```

**Important Settings for Each Variable:**
- Select: **Production, Preview, Development** (all three)
- This ensures they work in all environments

### Step 5: Generate BETTER_AUTH_SECRET

Open PowerShell and run:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and paste it as `BETTER_AUTH_SECRET` value in Vercel.

### Step 6: Deploy!

1. Review all settings
2. Click **"Deploy"**
3. Wait 2-3 minutes for build
4. Watch the build logs for any errors

**Your app will be deployed to:** `https://mediconnect-grok.vercel.app` (or similar)

---

## Part 2: Post-Deployment Setup (10 minutes)

### Step 1: Update Environment Variables with Actual URL

1. Go to Vercel Dashboard
2. Select your project → **Settings** → **Environment Variables**
3. Update these two variables:

```bash
BETTER_AUTH_URL
https://mediconnect-grok.vercel.app
# Replace with your actual Vercel URL

NEXT_PUBLIC_APP_URL
https://mediconnect-grok.vercel.app
# Replace with your actual Vercel URL
```

4. Click **"Save"**
5. Go to **Deployments** tab
6. Click **"... → Redeploy"** on the latest deployment
7. Check **"Use existing Build Cache"**
8. Click **"Redeploy"**

### Step 2: Run Database Migrations

**Option A: From Your Local Machine (Recommended)**

```powershell
# Navigate to project
cd c:\Users\Mediconnect\Desktop\Mediconnect-Grok

# Set production database URL temporarily
$env:DATABASE_URL="postgresql://neondb_owner:npg_CQMxK4E1lmcL@ep-winter-rice-a9mkk7ue-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require"

# Run migrations
node scripts/run-migrations.js

# Clear the environment variable
$env:DATABASE_URL=""
```

**Option B: Using Vercel CLI**

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.vercel

# Run migrations
node scripts/run-migrations.js

# Clean up
Remove-Item .env.vercel
```

### Step 3: Create Admin User

```powershell
# Use production DATABASE_URL
$env:DATABASE_URL="postgresql://neondb_owner:npg_CQMxK4E1lmcL@ep-winter-rice-a9mkk7ue-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require"

# Create admin
node scripts/create-admin-user.js

# Note the admin email displayed
# You'll use this to sign up

# Clear variable
$env:DATABASE_URL=""
```

### Step 4: Complete Admin Setup

1. Go to `https://your-app.vercel.app/auth/signup`
2. Sign up with the admin email from Step 3
3. Create a strong password
4. Go to `https://your-app.vercel.app/admin/login`
5. Login with your admin credentials
6. Test admin access

### Step 5: Verify Deployment

Test these URLs:

- ✅ Homepage: `https://your-app.vercel.app`
- ✅ Health Check: `https://your-app.vercel.app/api/health`
- ✅ Patient Login: `https://your-app.vercel.app/auth/patient/login`
- ✅ GP Login: `https://your-app.vercel.app/auth/gp/login`
- ✅ Admin Login: `https://your-app.vercel.app/admin/login`

---

## Part 3: Connect Custom Domain from BigRock (15 minutes)

### Step 1: Log into BigRock

1. Go to **https://www.bigrock.in/**
2. Login to your account
3. Go to **My Domains** or **Domain Management**
4. Find your domain (e.g., `mediconnect.com`)

### Step 2: Add Domain in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Click **Settings** → **Domains**
4. Click **"Add"** button
5. Enter your domain: `mediconnect.com` (or `yourdomain.com`)
6. Click **"Add"**

Vercel will show you DNS configuration requirements.

### Step 3: Configure DNS in BigRock

**Option A: Using Nameservers (Recommended)**

1. In Vercel, click **"Use Vercel Nameservers"**
2. Vercel will show two nameservers:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

3. In BigRock:
   - Go to Domain Management
   - Click **"Manage DNS"** or **"Nameservers"**
   - Select **"Use Custom Nameservers"**
   - Enter:
     * Nameserver 1: `ns1.vercel-dns.com`
     * Nameserver 2: `ns2.vercel-dns.com`
   - Click **"Save"** or **"Update"**

**Option B: Using DNS Records (Alternative)**

If you want to keep BigRock nameservers:

1. In BigRock, go to **DNS Management**
2. Add these records:

**For Root Domain (`mediconnect.com`):**
```
Type: A
Host: @ (or leave blank)
Value: 76.76.21.21
TTL: 3600
```

**For WWW subdomain (`www.mediconnect.com`):**
```
Type: CNAME
Host: www
Value: cname.vercel-dns.com
TTL: 3600
```

3. Save all changes

### Step 4: Add www Subdomain (Optional)

In Vercel:
1. Click **"Add"** again
2. Enter: `www.mediconnect.com`
3. Click **"Add"**
4. Vercel will automatically redirect www to non-www (or vice versa)

### Step 5: Wait for DNS Propagation

- **Nameservers:** 1-48 hours (usually 2-4 hours)
- **DNS Records:** 30 minutes - 24 hours (usually 1-2 hours)

Check status:
- In Vercel: You'll see "Valid Configuration" when DNS is propagated
- Online tool: https://dnschecker.org/ (enter your domain)

### Step 6: Enable SSL Certificate

Vercel automatically provisions SSL certificates:
1. Once DNS is verified, Vercel issues a Let's Encrypt certificate
2. This happens automatically (no action needed)
3. Your site will be accessible via HTTPS

### Step 7: Update Environment Variables with Custom Domain

Once domain is connected:

1. Go to Vercel → Settings → Environment Variables
2. Update:

```bash
BETTER_AUTH_URL
https://mediconnect.com
# Or your custom domain

NEXT_PUBLIC_APP_URL
https://mediconnect.com
# Or your custom domain
```

3. Redeploy the application

---

## Part 4: Final Configuration (5 minutes)

### Step 1: Test Custom Domain

Visit your custom domain:
- ✅ `https://mediconnect.com` (or your domain)
- ✅ `https://www.mediconnect.com` (should redirect)
- ✅ Test all auth flows
- ✅ Test API endpoints

### Step 2: Configure Email (Optional)

If you want email verification:

1. Set up Gmail App Password:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password
   - Copy the 16-character password

2. Update Vercel environment variables:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

3. Redeploy

### Step 3: Set Up Monitoring

**Vercel Analytics (Built-in)**
- Go to your project → **Analytics**
- Enable Real-time Analytics
- View traffic, performance, errors

**Uptime Monitoring (Free)**
1. Sign up at https://uptimerobot.com
2. Add Monitor:
   - Type: HTTP(s)
   - URL: `https://mediconnect.com`
   - Interval: 5 minutes
3. Get alerts via email if site goes down

### Step 4: Create Demo Accounts

```powershell
# Connect to production database
$env:DATABASE_URL="postgresql://neondb_owner:..."

# Create demo users
node scripts/create-demo-users.js

# Clear variable
$env:DATABASE_URL=""
```

---

## 🎯 Quick Reference Commands

### Build Locally
```powershell
npm run build
```

### Deploy via Git
```powershell
git add .
git commit -m "Your changes"
git push origin main
# Vercel auto-deploys on push
```

### Manual Deploy
```powershell
# Install CLI
npm install -g vercel

# Deploy
vercel --prod
```

### View Logs
```powershell
# Real-time logs
vercel logs --follow

# Or view in dashboard:
# https://vercel.com/your-project/deployments
```

### Rollback Deployment
1. Go to Vercel → **Deployments**
2. Find previous successful deployment
3. Click **"... → Promote to Production"**

---

## 🔧 Troubleshooting

### Issue 1: Build Fails on Vercel
**Error:** `Failed to compile`

**Fix:**
```bash
# Test build locally first
npm run build

# Fix any errors
# Commit and push
git add .
git commit -m "Fix build errors"
git push
```

### Issue 2: Database Connection Error
**Error:** `Connection refused` or `ECONNREFUSED`

**Fix:**
1. Check DATABASE_URL in Vercel env vars
2. Ensure it's the **pooled connection string** from Neon
3. Verify SSL mode is `require`
4. Check Neon database is active

### Issue 3: Domain Not Working
**Error:** `ERR_NAME_NOT_RESOLVED`

**Fix:**
1. Check DNS propagation: https://dnschecker.org
2. Wait up to 48 hours for nameserver changes
3. Verify DNS records are correct
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue 4: SSL Certificate Error
**Error:** `Your connection is not private`

**Fix:**
1. Wait 10-15 minutes after DNS verification
2. Vercel auto-provisions SSL (be patient)
3. Hard refresh: Ctrl+Shift+R
4. Check Vercel domain status shows "Valid"

### Issue 5: Authentication Not Working
**Error:** `Session expired` or can't login

**Fix:**
1. Verify BETTER_AUTH_URL matches your domain
2. Verify BETTER_AUTH_SECRET is set
3. Check cookies are enabled
4. Redeploy after env var changes

### Issue 6: API Routes Return 500
**Error:** `Internal Server Error`

**Fix:**
1. Check Vercel logs: `vercel logs`
2. Look for error details
3. Common causes:
   - Missing environment variables
   - Database connection issues
   - Rate limiter using in-memory storage

---

## 📊 Vercel Deployment Checklist

Before going live:

### Pre-Launch
- [ ] Local build succeeds (`npm run build`)
- [ ] All tests pass
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Admin user created
- [ ] SSL certificate issued
- [ ] Custom domain connected
- [ ] DNS propagated

### Post-Launch
- [ ] Homepage loads correctly
- [ ] All portals accessible (Patient, GP, Specialist, Admin)
- [ ] Login/Signup works
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] Email sending works (if configured)
- [ ] Mobile responsive
- [ ] No console errors

### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Uptime monitoring set up
- [ ] Error tracking (Sentry optional)
- [ ] Performance monitoring
- [ ] Backup strategy (Neon auto-backs up)

---

## 💰 Cost Breakdown

### Free Tier (Testing/MVP)
- **Vercel:** $0/month
  - 100GB bandwidth
  - Unlimited requests
  - Free SSL
  - 1 domain included

- **Neon:** $0/month
  - 0.5GB storage
  - 1 project
  - Automatic backups

- **BigRock Domain:** $10-15/year

**Total:** ~$1-2/month (domain only)

### Production (Recommended)
- **Vercel Pro:** $20/month
  - Better performance
  - Team collaboration
  - Advanced analytics
  - 1TB bandwidth

- **Neon Scale:** $19/month
  - Autoscaling compute
  - 10GB storage
  - Better performance

- **Uptime Monitoring:** $0 (free tier)

**Total:** ~$40/month + domain

---

## 🚀 You're Live!

Once deployment is complete:

**Your URLs:**
- 🌐 **Vercel:** `https://mediconnect-grok.vercel.app`
- 🌐 **Custom:** `https://mediconnect.com` (your domain)
- 📊 **Dashboard:** `https://vercel.com/dashboard`
- 📈 **Analytics:** Vercel project → Analytics tab

**Next Steps:**
1. Test all features thoroughly
2. Share with beta users
3. Monitor for errors
4. Gather feedback
5. Iterate and improve

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **BigRock Support:** https://www.bigrock.in/support
- **Your Docs:**
  - `DEPLOYMENT_GUIDE_VERCEL.md`
  - `PRODUCTION_READINESS.md`
  - `CRITICAL_SECURITY_FIXES_SUMMARY.md`

---

**Status:** Ready to deploy! 🎉  
**Build Status:** Testing...  
**Domain:** Ready to configure  
**Database:** ✅ Connected

Follow the steps above and you'll be live in ~30-45 minutes!

---

*Last Updated: October 16, 2025*  
*For questions, refer to the documentation or Vercel support*
