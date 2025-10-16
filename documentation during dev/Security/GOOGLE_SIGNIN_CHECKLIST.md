# 🚀 Google Sign-In Quick Setup Checklist

Follow these steps to enable Google Sign-In on your Health Hub platform.

## ⏱️ Time Required: ~15 minutes

---

## 📝 Checklist

### Phase 1: Google Cloud Setup (5 min)

- [ ] Go to https://console.cloud.google.com/
- [ ] Create new project: "Health Hub"
- [ ] Enable Google+ API
- [ ] Configure OAuth consent screen:
  - [ ] App name: Health Hub
  - [ ] Support email: your-email@healthhubinternational.com
  - [ ] Add authorized domain: healthhubinternational.com
- [ ] Create OAuth credentials (Web application)
- [ ] Copy Client ID (looks like: `xxx.apps.googleusercontent.com`)
- [ ] Copy Client Secret (looks like: `GOCSPX-xxx`)

---

### Phase 2: Configure Redirect URIs (2 min)

In Google Cloud Console → Credentials → Edit OAuth client:

**Authorized JavaScript origins:**
```
- [ ] https://healthhubinternational.com
- [ ] https://www.healthhubinternational.com
```

**Authorized redirect URIs:**
```
- [ ] https://healthhubinternational.com/api/auth/callback/google
- [ ] https://www.healthhubinternational.com/api/auth/callback/google
```

---

### Phase 3: Add to Vercel (3 min)

- [ ] Login to Vercel Dashboard
- [ ] Go to your Health Hub project
- [ ] Settings → Environment Variables
- [ ] Add: `GOOGLE_CLIENT_ID` = (paste Client ID)
- [ ] Add: `GOOGLE_CLIENT_SECRET` = (paste Client Secret)
- [ ] Select: Production, Preview, Development
- [ ] Click "Save"

---

### Phase 4: Deploy & Test (5 min)

- [ ] Go to Deployments tab
- [ ] Click "Redeploy" on latest deployment
- [ ] Wait for deployment to complete (2-3 min)
- [ ] Visit: https://healthhubinternational.com/auth/patient/login
- [ ] Click "Sign in with Google" button
- [ ] Sign in with your Google account
- [ ] ✅ Verify you're redirected to dashboard

---

## 🎯 Quick Test Checklist

Test Google Sign-In on these pages:

- [ ] Patient Login: `/auth/patient/login`
- [ ] Patient Signup: `/auth/patient/signup`
- [ ] GP Login: `/auth/gp/login`
- [ ] Specialist Login: `/auth/specialist/login`
- [ ] Pharmacy Login: `/auth/pharmacy/login`
- [ ] Diagnostics Login: `/auth/diagnostics/login`

---

## ⚠️ Troubleshooting Quick Fixes

**Button not showing?**
→ Check Vercel environment variables are saved
→ Redeploy application

**"redirect_uri_mismatch"?**
→ Copy exact error URL
→ Add to Google Console redirect URIs
→ Try again

**"Access blocked"?**
→ Go to OAuth consent screen
→ Add yourself as test user
→ OR click "Publish App"

---

## 📞 Need Help?

**Detailed Guide:** See `GOOGLE_OAUTH_SETUP.md`

**Support:**
- Google OAuth Docs: https://developers.google.com/identity
- Better Auth Docs: https://www.better-auth.com/docs

---

## ✅ Success Criteria

You're done when:
- ✅ "Sign in with Google" button appears on login pages
- ✅ Clicking it redirects to Google
- ✅ After Google sign-in, user lands on dashboard
- ✅ User account created in database
- ✅ Can log out and log back in with Google

---

**Estimated Setup Time:** 15 minutes
**Difficulty:** Easy
**Cost:** Free (Google OAuth is free)

🎉 **Your Health Hub now supports Google Sign-In!**
