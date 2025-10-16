# Google OAuth Setup Guide for Health Hub

This guide walks you through setting up Google Sign-In for your Health Hub application.

## 📋 Prerequisites

- Google Account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Your production domain (e.g., `healthhubinternational.com`)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to: **https://console.cloud.google.com/**
2. Click **"Select a project"** (top left)
3. Click **"New Project"**
4. Enter project name: `Health Hub`
5. Click **"Create"**
6. Wait for project creation (10-30 seconds)
7. Select your new project from the dropdown

---

### Step 2: Enable Google+ API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search for: `Google+ API`
3. Click on **"Google+ API"**
4. Click **"Enable"**
5. Wait for activation

---

### Step 3: Configure OAuth Consent Screen

1. Go to: **APIs & Services** → **OAuth consent screen**
2. Select **"External"** (for public users)
3. Click **"Create"**

**App Information:**
```
App name: Health Hub
User support email: your-email@healthhubinternational.com
App logo: (optional - upload your logo)
```

**App domain:**
```
Application home page: https://healthhubinternational.com
Application privacy policy: https://healthhubinternational.com/privacy
Application terms of service: https://healthhubinternational.com/terms
```

**Developer contact information:**
```
Email: your-email@healthhubinternational.com
```

4. Click **"Save and Continue"**

**Scopes:**
- Click **"Add or Remove Scopes"**
- Select these scopes:
  - ✅ `.../auth/userinfo.email` (See your email address)
  - ✅ `.../auth/userinfo.profile` (See your personal info)
  - ✅ `openid`
- Click **"Update"**
- Click **"Save and Continue"**

**Test users (while in testing mode):**
- Click **"Add Users"**
- Add your email address
- Click **"Save and Continue"**

5. Click **"Back to Dashboard"**

---

### Step 4: Create OAuth Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**

**Configuration:**
```
Name: Health Hub Web Client
```

**Authorized JavaScript origins:**
```
http://localhost:3000 (for development)
https://healthhubinternational.com
https://www.healthhubinternational.com
https://your-vercel-url.vercel.app (if using Vercel URL)
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google (for development)
https://healthhubinternational.com/api/auth/callback/google
https://www.healthhubinternational.com/api/auth/callback/google
https://your-vercel-url.vercel.app/api/auth/callback/google (if using Vercel URL)
```

4. Click **"Create"**

**🎉 You'll see a modal with:**
- **Client ID**: `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ`

5. **Copy both values** - you'll need them next!

---

### Step 5: Add Credentials to Vercel

**Method A: Via Vercel Dashboard**

1. Go to your Vercel project
2. **Settings** → **Environment Variables**
3. Add these variables:

```
Name: GOOGLE_CLIENT_ID
Value: 123456789-abcdefg.apps.googleusercontent.com
Environment: Production, Preview, Development
```

```
Name: GOOGLE_CLIENT_SECRET
Value: GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
Environment: Production, Preview, Development
```

4. Click **"Save"**

**Method B: Via Local .env.local (Development)**

Create/edit `.env.local`:
```bash
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

---

### Step 6: Redeploy Application

**In Vercel:**
1. Go to **Deployments**
2. Click on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

### Step 7: Test Google Sign-In

1. Visit: `https://healthhubinternational.com/auth/patient/login`
2. Click **"Sign in with Google"**
3. Select your Google account
4. Grant permissions
5. You should be redirected to `/patient/home` ✅

---

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** The redirect URI doesn't match what's configured in Google Console.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add the exact redirect URI from the error message
4. Save and try again

**Common redirect URIs:**
```
https://healthhubinternational.com/api/auth/callback/google
https://www.healthhubinternational.com/api/auth/callback/google
```

---

### Error: "Access blocked: Health Hub has not completed the Google verification process"

**Problem:** App is still in testing mode and user is not added as a test user.

**Solution:**

**Option 1: Add User as Test User (Quick)**
1. Go to OAuth consent screen
2. Scroll to "Test users"
3. Add the user's email
4. User can now sign in

**Option 2: Publish App (For Production)**
1. Go to OAuth consent screen
2. Click **"Publish App"**
3. Click **"Confirm"**
4. App is now available to all users

**Note:** Publishing doesn't require Google verification if you only use basic scopes (email, profile).

---

### Error: "Invalid Client: The OAuth client was not found"

**Problem:** Client ID or Secret is incorrect.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Copy the Client ID and Secret again
3. Update in Vercel environment variables
4. Redeploy

---

### Google Sign-In Button Not Showing

**Problem:** Environment variables not loaded or auth provider not configured.

**Solution:**
1. Check Vercel environment variables are set
2. Verify variables are available in all environments (Production, Preview)
3. Check `src/lib/auth.ts` - Google provider should be enabled
4. Redeploy application

---

## 🎨 Customizing OAuth Consent Screen

**Branding (Optional but Recommended):**

1. Go to OAuth consent screen
2. Upload **App logo** (120x120px, square)
3. Add **App domain** (your website)
4. Add **Privacy policy** URL
5. Add **Terms of service** URL
6. Click **"Save"**

Users will see this during sign-in!

---

## 📊 Monitoring OAuth Usage

**View sign-in metrics:**

1. Go to Google Cloud Console
2. **APIs & Services** → **Dashboard**
3. Select **Google+ API**
4. View request counts and errors

---

## 🔒 Security Best Practices

✅ **Never commit credentials to Git**
- Use `.env.local` (ignored by Git)
- Use Vercel environment variables

✅ **Use HTTPS in production**
- Google OAuth requires HTTPS for production URIs
- Vercel provides automatic SSL

✅ **Rotate secrets if compromised**
- Generate new Client Secret in Google Console
- Update in Vercel immediately

✅ **Limit redirect URIs**
- Only add trusted domains
- Remove development URIs in production

---

## 📝 What Happens During Google Sign-In?

1. User clicks "Sign in with Google"
2. Redirected to Google sign-in page
3. User selects Google account
4. Google requests permission to share email/profile
5. User grants permission
6. Google redirects to: `/api/auth/callback/google`
7. Better Auth creates/updates user in database
8. User redirected to dashboard

**User data stored:**
- Email address
- Full name
- Profile picture (optional)
- Google account ID

---

## 🆘 Need Help?

**Google OAuth Documentation:**
https://developers.google.com/identity/protocols/oauth2

**Better Auth Documentation:**
https://www.better-auth.com/docs/authentication/social-providers

**Common Issues:**
- Redirect URI mismatch → Check URLs exactly match
- App not verified → Add test users or publish app
- Invalid client → Check Client ID/Secret are correct

---

## ✅ Quick Checklist

Before going live, verify:

- [ ] OAuth consent screen configured
- [ ] App logo uploaded
- [ ] Privacy policy and Terms links added
- [ ] Production redirect URIs added
- [ ] Environment variables set in Vercel
- [ ] Application redeployed
- [ ] Google Sign-In tested with real account
- [ ] App published (if needed for all users)

**Your Google Sign-In is ready! 🎉**

Users can now sign in with their Google accounts across all portals (Patient, GP, Specialist, etc.)
