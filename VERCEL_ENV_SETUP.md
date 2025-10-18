# 🚀 Vercel Environment Variables Setup

## ⚠️ CRITICAL ISSUE IDENTIFIED

Your local environment works but **Vercel production is missing or has incorrect environment variables**. This causes authentication to fail.

## 📋 Required Environment Variables

Go to: https://vercel.com/your-project/settings/environment-variables

Add these EXACTLY as shown:

### 1. Better Auth Configuration

```bash
BETTER_AUTH_SECRET=bbd525987b8ce5f33398237092bec577fc985a8e431115edd8b0429555e25140
```

```bash
BETTER_AUTH_URL=https://www.healthhubinternational.com
```

```bash
NEXT_PUBLIC_BETTER_AUTH_URL=https://www.healthhubinternational.com
```

### 2. Database Configuration

```bash
DATABASE_URL=postgresql://neondb_owner:npg_CQMxK4E1lmcL@ep-winter-rice-a9mkk7ue-pooler.gwc.azure.neon.tech/neondb?sslmode=require
```

### 3. Google OAuth Configuration

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
```

```bash
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 4. Agora (Video Consultation)

```bash
AGORA_APP_ID=62b6f0185aa04ff1844417e44e85914a
```

```bash
AGORA_APP_CERTIFICATE=y10bf0cb0f3d44e318ea48d612b659e9c
```

### 5. Other Settings

```bash
NODE_ENV=production
```

```bash
PRODUCTION_MODE=true
```

```bash
ENABLE_OAUTH=true
```

```bash
ENABLE_SIGNUPS=true
```

```bash
ENABLE_EMAIL_VERIFICATION=false
```

## 🔄 After Adding Variables

1. **Click "Save"** for each variable
2. **Redeploy** from Vercel Dashboard:
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - Select "Use existing build cache" (faster)
   - Click "Redeploy"

3. **Wait 2-3 minutes** for deployment to complete

## ✅ Test Login After Deployment

### Test GP Login:
- URL: https://www.healthhubinternational.com/gp/login
- Email: `doctor@healthhub.com`
- Password: `Doctor@2024`

### Test Google OAuth:
- URL: https://www.healthhubinternational.com/patient/login
- Click: "Continue with Google"
- Use: `anuraagsaisampath@gmail.com`

## 🐛 If Still Not Working

1. **Clear Browser Cache & Cookies**
   - Open DevTools (F12)
   - Application tab → Storage → Clear site data
   - Restart browser

2. **Check Browser Console**
   - F12 → Console tab
   - Look for red error messages
   - Screenshot and share

3. **Verify Vercel Deployment**
   - Check deployment logs for errors
   - Ensure environment variables are in "Production" scope

## 📊 Working Test Accounts

| Email | Password | Role | Status |
|-------|----------|------|--------|
| doctor@healthhub.com | Doctor@2024 | GP | ✅ Works |
| anuraagsaisampath@gmail.com | N/A (OAuth) | Patient | ✅ Works (Google only) |

## ⚠️ Important Notes

1. **anuraagsaisampath@gmail.com** is a Google OAuth account - it CANNOT use email/password login
2. Must click "Continue with Google" button for OAuth accounts
3. GP accounts login at `/gp/login`, Patient accounts at `/patient/login`
4. After changing environment variables, ALWAYS redeploy

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com
- **Neon Database**: https://console.neon.tech

---

**Next Steps:**
1. ✅ Add all environment variables to Vercel
2. ✅ Redeploy from Vercel dashboard
3. ✅ Test login at https://www.healthhubinternational.com
