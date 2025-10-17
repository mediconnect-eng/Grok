# 🔐 GOOGLE OAUTH SETUP GUIDE - HealthHub
**Complete Step-by-Step Guide for New OAuth Client**

---

## 📋 WHAT YOU'LL DO

You're setting up a **NEW Google OAuth 2.0 Client** to replace the old one. This guide covers:
1. ✅ Creating new OAuth credentials in Google Cloud
2. ✅ Updating your application code
3. ✅ Updating environment variables (local + Vercel)
4. ✅ Testing the integration
5. ✅ Troubleshooting common issues

---

## 🚀 STEP-BY-STEP SETUP

### **STEP 1: Complete Google Cloud OAuth Setup**

You're on the right screen! Here's what to fill in:

#### **1.1 Application Type**
- ✅ Already selected: **"Web application"**

#### **1.2 Name**
- ✅ Already filled: **"HealthHub"**
- This is just an internal name for you to identify the client

#### **1.3 Authorised JavaScript origins** ⚠️ CRITICAL

**Add these URLs (click "+ Add URI" for each):**

```
http://localhost:3000
https://healthhubinternational.com
https://www.healthhubinternational.com
```

**⚠️ IMPORTANT:** 
- Must include **http://** or **https://**
- No trailing slashes
- Add ALL three URLs

**Your screenshot shows:** "Invalid Origin: URI must not be empty" - You need to fill this in!

---

#### **1.4 Authorised redirect URIs** ⚠️ CRITICAL

**Add these URLs (click "+ Add URI" for each):**

```
http://localhost:3000/api/auth/callback/google
https://healthhubinternational.com/api/auth/callback/google
https://www.healthhubinternational.com/api/auth/callback/google
```

**⚠️ IMPORTANT:**
- Must end with `/api/auth/callback/google`
- Exact paths - no variations
- Add ALL three URLs

**Your screenshot shows:** "Invalid Redirect: URI must not be empty" - You need to fill this in!

---

### **STEP 2: Get Your Credentials**

After clicking "Create" or "Save", you'll see a modal with:

```
Your Client ID
469954274153-xxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

Your Client Secret
GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

**📋 COPY BOTH VALUES - YOU'LL NEED THEM!**

---

### **STEP 3: Update Local Environment Variables**

**File:** `.env.local` (in your project root)

**Find these lines:**
```env
GOOGLE_CLIENT_ID=your-old-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-old-client-secret
```

**Replace with your NEW credentials:**
```env
GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET_HERE
```

**💾 SAVE THE FILE**

---

### **STEP 4: Update Vercel Environment Variables**

**Go to:** https://vercel.com/dashboard

1. Click your **HealthHub project**
2. Go to **Settings** → **Environment Variables**
3. Find `GOOGLE_CLIENT_ID` and click "Edit"
   - Update with your NEW Client ID
   - Click "Save"
4. Find `GOOGLE_CLIENT_SECRET` and click "Edit"
   - Update with your NEW Client Secret
   - Click "Save"

**⚠️ IMPORTANT:** After updating, you MUST redeploy:
- Go to **Deployments** tab
- Click "..." on latest deployment
- Click "Redeploy"

---

### **STEP 5: Restart Local Development Server**

**In your terminal:**
```powershell
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

This ensures the new environment variables are loaded.

---

### **STEP 6: Test OAuth Flow**

#### **Test Locally:**

1. **Open:** http://localhost:3000/patient/login
2. Click **"Continue with Google"** button
3. **Expected:** Redirected to Google login
4. **Sign in** with your Google account
5. **Expected:** Redirected back to `/patient/home`
6. ✅ **Success!** You're logged in

**If it fails:** Check browser console (F12) for errors

---

#### **Test Production (After Vercel Redeploy):**

1. **Open:** https://www.healthhubinternational.com/patient/login
2. Click **"Continue with Google"**
3. **Expected:** Redirected to Google login
4. **Sign in** with your Google account
5. **Expected:** Redirected back to `/patient/home`
6. ✅ **Success!** You're logged in

---

## 📁 FILES THAT USE GOOGLE OAUTH

### **No Code Changes Needed! ✅**

Your application already uses Google OAuth through Better Auth. The only changes are:
1. Google Cloud Console settings (Steps 1-2)
2. Environment variables (Steps 3-4)

### **Files Using OAuth (For Reference):**

#### **1. Auth Configuration**
**File:** `src/lib/auth.ts`
```typescript
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// ... later in file ...
if (googleClientId && googleClientSecret) {
  socialProviders.google = {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
  };
}
```
**Status:** ✅ No changes needed

---

#### **2. Auth Client**
**File:** `src/lib/auth-client.ts`
```typescript
export const authClient = createAuthClient({
  baseURL: resolveBaseUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
```
**Status:** ✅ No changes needed

---

#### **3. Patient Login Page**
**File:** `src/app/patient/login/page.tsx`
```typescript
const handleGoogleSignIn = async () => {
  await signIn.social({
    provider: 'google',
    callbackURL: '/patient/home',
  });
};
```
**Status:** ✅ No changes needed

---

#### **4. Patient Signup Page**
**File:** `src/app/patient/signup/page.tsx`
```typescript
const handleGoogleSignUp = async () => {
  await signIn.social({
    provider: 'google',
    callbackURL: '/patient/home',
  });
};
```
**Status:** ✅ No changes needed

---

#### **5. Auth Route Handler**
**File:** `src/app/api/auth/[...all]/route.ts`
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const authHandlers = toNextJsHandler(auth);

export const GET = withRateLimit(authHandlers.GET);
export const POST = withRateLimit(authHandlers.POST);
```
**Status:** ✅ No changes needed (already excludes OAuth from rate limiting)

---

## 🔍 VERIFICATION CHECKLIST

After completing all steps, verify:

### **Google Cloud Console:**
- [ ] OAuth client named "HealthHub" exists
- [ ] Authorised JavaScript origins has 3 URLs:
  - [ ] http://localhost:3000
  - [ ] https://healthhubinternational.com
  - [ ] https://www.healthhubinternational.com
- [ ] Authorised redirect URIs has 3 URLs:
  - [ ] http://localhost:3000/api/auth/callback/google
  - [ ] https://healthhubinternational.com/api/auth/callback/google
  - [ ] https://www.healthhubinternational.com/api/auth/callback/google
- [ ] Client ID and Secret copied

### **Local Environment:**
- [ ] `.env.local` has new GOOGLE_CLIENT_ID
- [ ] `.env.local` has new GOOGLE_CLIENT_SECRET
- [ ] Dev server restarted (`npm run dev`)
- [ ] Can login with Google at http://localhost:3000/patient/login

### **Vercel Environment:**
- [ ] GOOGLE_CLIENT_ID updated in Vercel
- [ ] GOOGLE_CLIENT_SECRET updated in Vercel
- [ ] Project redeployed
- [ ] Can login with Google at https://www.healthhubinternational.com/patient/login

---

## ⚠️ COMMON ERRORS & SOLUTIONS

### **Error 1: "redirect_uri_mismatch"**

**Problem:** Redirect URI doesn't match Google Console

**Solution:**
1. Check the exact error message - it shows the URI Google received
2. Go to Google Console → Edit OAuth client
3. Add the EXACT URI from error message
4. Wait 5 minutes for changes to propagate
5. Try again

**Example:**
```
Error: redirect_uri_mismatch
The redirect URI in the request: https://www.healthhubinternational.com/api/auth/callback/google
does not match the ones authorized for the OAuth client.
```
→ Add this exact URL to your redirect URIs

---

### **Error 2: "Invalid Origin"**

**Problem:** JavaScript origin not authorized

**Solution:**
1. Check which domain you're accessing (localhost vs production)
2. Add that domain to "Authorised JavaScript origins"
3. Format: `https://yourdomain.com` (no trailing slash)
4. Wait 5 minutes
5. Try again

---

### **Error 3: "Access blocked: This app's request is invalid"**

**Problem:** OAuth consent screen not configured

**Solution:**
1. Go to: **APIs & Services** → **OAuth consent screen**
2. Fill in required fields:
   - App name: HealthHub
   - User support email: your@email.com
   - Developer contact: your@email.com
3. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
4. Save and continue
5. Add test users (if app is in testing mode)

---

### **Error 4: "This app hasn't been verified"**

**Problem:** Google shows security warning

**Solutions:**

**Option A:** Add test users (for testing)
1. OAuth consent screen → Test users
2. Add your Google accounts
3. Those users can sign in without verification

**Option B:** Publish app (for production)
1. OAuth consent screen → Publishing status
2. Click "Publish app"
3. May require verification process

**Option C:** Click "Advanced" → "Go to HealthHub (unsafe)"
- Only do this during development
- Not suitable for production

---

### **Error 5: OAuth Still Not Working After Updates**

**Checklist:**
1. [ ] Cleared browser cache and cookies
2. [ ] Tried incognito/private window
3. [ ] Waited 5-10 minutes after Google Console changes
4. [ ] Verified environment variables are loaded (`console.log(process.env.GOOGLE_CLIENT_ID)`)
5. [ ] Checked that BETTER_AUTH_URL matches your domain
6. [ ] Restarted dev server (local) or redeployed (Vercel)

---

## 🔒 SECURITY BEST PRACTICES

### **1. Keep Secrets Secret**
- ❌ Never commit `.env.local` to git
- ❌ Never share Client Secret publicly
- ✅ Use environment variables only
- ✅ Rotate secrets if exposed

### **2. Limit Redirect URIs**
- ✅ Only add URIs you actually use
- ❌ Don't add wildcard domains
- ❌ Don't add insecure HTTP for production

### **3. Monitor OAuth Usage**
- Check Google Cloud Console → OAuth consent screen → Analytics
- Review which users are signing in
- Monitor for suspicious activity

### **4. Test Users (If App in Testing)**
- Add specific test user emails
- They can bypass verification warnings
- Remove when going to production

---

## 📊 EXPECTED BEHAVIOR

### **Successful OAuth Flow:**

```
1. User clicks "Continue with Google"
   ↓
2. Redirected to: accounts.google.com/signin
   ↓
3. User selects Google account
   ↓
4. Google requests permission (first time only)
   ↓
5. User clicks "Allow"
   ↓
6. Redirected to: /api/auth/callback/google
   ↓
7. Better Auth processes callback
   ↓
8. User account created/updated in database
   ↓
9. Session created
   ↓
10. Redirected to: /patient/home
    ↓
11. ✅ User logged in!
```

### **User Data Stored:**
- Email address (from Google)
- Full name (from Google)
- Profile picture URL (optional)
- Google account ID (for linking)
- Email verified: true (Google verifies)

---

## 🧪 TESTING SCRIPT

Want to test OAuth programmatically? Use this:

**File:** `scripts/test-oauth.js`
```javascript
require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 OAuth Configuration Check\n');
console.log('='.repeat(60));
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 
  '✅ Set (' + process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...)' : 
  '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
  '✅ Set (' + process.env.GOOGLE_CLIENT_SECRET.substring(0, 10) + '...)' : 
  '❌ Missing');
console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL || '❌ Not set');
console.log('='.repeat(60));

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('\n❌ OAuth will NOT work - credentials missing!\n');
} else {
  console.log('\n✅ OAuth credentials configured!\n');
  console.log('Test by visiting:');
  console.log('  - http://localhost:3000/patient/login');
  console.log('  - Click "Continue with Google"');
  console.log('  - Should redirect to Google login\n');
}
```

**Run it:**
```powershell
node scripts/test-oauth.js
```

---

## 📞 NEED HELP?

### **Google Cloud Issues:**
- **Documentation:** https://developers.google.com/identity/protocols/oauth2
- **Support:** https://support.google.com/cloud

### **Better Auth Issues:**
- **Documentation:** https://www.better-auth.com/docs/authentication/social-providers
- **GitHub:** https://github.com/better-auth/better-auth

### **Application Issues:**
- Check browser console (F12 → Console tab)
- Check server logs (`npm run dev` output)
- Check Vercel logs (Vercel Dashboard → Your Project → Logs)

---

## ✅ QUICK REFERENCE

**What you need from Google Cloud:**
1. Client ID (starts with numbers, ends with `.apps.googleusercontent.com`)
2. Client Secret (starts with `GOCSPX-`)

**Where to put them:**
1. Local: `.env.local` file
2. Production: Vercel Environment Variables

**Required URLs in Google Console:**

**JavaScript Origins:**
- `http://localhost:3000`
- `https://healthhubinternational.com`
- `https://www.healthhubinternational.com`

**Redirect URIs:**
- `http://localhost:3000/api/auth/callback/google`
- `https://healthhubinternational.com/api/auth/callback/google`
- `https://www.healthhubinternational.com/api/auth/callback/google`

**After changes:**
1. Save in Google Console
2. Wait 5 minutes
3. Restart dev server (local)
4. Redeploy (Vercel)
5. Test!

---

**Last Updated:** October 18, 2025  
**Status:** Ready to implement ✅
