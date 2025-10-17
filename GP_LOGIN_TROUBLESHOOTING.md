# GP Login Troubleshooting Guide

## ✅ DATABASE STATUS: VERIFIED WORKING

**Credentials (CONFIRMED WORKING):**
- Email: `doctor@healthhub.com`
- Password: `Doctor@2024`
- Role: `gp`
- Email Verified: `true`

**Database Status:**
- ✅ User exists in `user` table
- ✅ Password hash correct in `account` table
- ✅ Password test: VALID (Doctor@2024 matches hash)
- ✅ No duplicate accounts
- ✅ Better Auth simulation: LOGIN WOULD SUCCEED

---

## 🚨 REAL ISSUE IDENTIFIED

Based on "I can login once after creating account, but not again" - this is a **session/cookie/environment** issue, NOT a database issue.

### Possible Causes:

1. **Vercel Environment Variables Missing**
   - `BETTER_AUTH_SECRET` might be different in production
   - `BETTER_AUTH_URL` might be incorrect
   - `DATABASE_URL` might point to different database

2. **Cookie Domain Mismatch**
   - Cookies set for wrong domain
   - HTTPS/HTTP mismatch
   - SameSite cookie issues

3. **Session Not Persisting**
   - Cookies being cleared
   - Browser privacy settings
   - Incognito mode issues

---

## 🔧 FIXES TO APPLY

### Fix 1: Update Vercel Environment Variables

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
```
BETTER_AUTH_SECRET=bbd525987b8ce5f33398237092bec577fc985a8e431115edd8b0429555e25140
BETTER_AUTH_URL=https://www.healthhubinternational.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://www.healthhubinternational.com
DATABASE_URL=postgresql://neondb_owner:npg_CQMxK4E1lmcL@ep-winter-rice-a9mkk7ue-pooler.gwc.azure.neon.tech/neondb?sslmode=require
```

**After updating, click "Redeploy" for changes to take effect!**

### Fix 2: Clear Browser Data

1. Open DevTools (F12)
2. Application tab → Storage → Clear site data
3. Or use Incognito mode to test

### Fix 3: Check Auth Configuration

The auth baseURL must match production:
- Local: `http://localhost:3000`
- Production: `https://www.healthhubinternational.com`

---

## 🧪 TESTING STEPS

### Test 1: Direct Database Login (WORKS ✅)
```
Email: doctor@healthhub.com
Password: Doctor@2024
This is VERIFIED to work in database
```

### Test 2: Check Vercel Logs
1. Go to Vercel Dashboard
2. Click on your deployment
3. Go to "Runtime Logs"
4. Look for Better Auth errors during login

### Test 3: Browser Console
1. Open https://www.healthhubinternational.com/gp/login
2. Open DevTools → Console tab
3. Try to login
4. Look for errors (red messages)
5. Check Network tab → Filter by "auth"
6. See what the API returns

---

## 💡 QUICK WORKAROUND

**If you need to test NOW:**

1. **Use the patient account that works:**
   - Email: `1234@gm.com` (we changed this to GP role)
   - Password: (whatever you set when creating it)

2. **Or create a fresh GP account:**
   - Go to: `/gp/signup`
   - Create new account
   - Will work once immediately

---

## 📊 VERIFICATION COMMANDS

Run these to verify database:
```bash
# Test login credentials
node scripts/test-better-auth-login.js

# Check GP users
node scripts/check-gp-users.js

# Debug login
node scripts/debug-gp-login.js
```

All should show ✅ VALID credentials.

---

## 🎯 MOST LIKELY FIX

**The issue is probably Vercel environment variables!**

1. Go to Vercel Dashboard
2. Check if `BETTER_AUTH_SECRET` is set in production
3. Check if `BETTER_AUTH_URL` matches `https://www.healthhubinternational.com`
4. After updating, click **"Redeploy"**
5. Wait 2 minutes for deployment
6. Try logging in again with cleared cache

---

## 📞 IF STILL NOT WORKING

Send me:
1. Screenshot of browser console errors
2. Screenshot of Network tab showing /api/auth response
3. Screenshot of Vercel environment variables (hide sensitive values)
4. Tell me exactly what error message appears

The database is 100% correct. The issue is in session/cookie/environment configuration.
