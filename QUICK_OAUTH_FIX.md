# 🎯 QUICK FIX - Google OAuth for Production

## What You Need to Do RIGHT NOW:

### 1️⃣ **Go to Google Cloud Console** (where you took the screenshot)

### 2️⃣ **Add These 2 Lines to "Authorised JavaScript origins":**

**Currently you only have:**
```
http://localhost:3000
```

**Add these (click "+ Add URI" button):**
```
https://healthhubinternational.com
https://www.healthhubinternational.com
```

---

### 3️⃣ **Add These 2 Lines to "Authorised redirect URIs":**

**Currently you only have:**
```
http://localhost:3000/api/auth/callback/google
```

**Add these (click "+ Add URI" button):**
```
https://healthhubinternational.com/api/auth/callback/google
https://www.healthhubinternational.com/api/auth/callback/google
```

---

### 4️⃣ **Click SAVE**

⚠️ **Important:** Wait 5 minutes after saving for changes to take effect!

---

### 5️⃣ **Update Vercel Environment Variables**

Go to: **https://vercel.com/dashboard** → Your Project → **Settings** → **Environment Variables**

**Add/Update these 3 critical variables:**

```
BETTER_AUTH_URL = https://www.healthhubinternational.com
NEXT_PUBLIC_APP_URL = https://www.healthhubinternational.com  
NEXT_PUBLIC_BETTER_AUTH_URL = https://www.healthhubinternational.com
```

Then click **"Redeploy"** on your latest deployment.

---

### 6️⃣ **Test It**

After 5 minutes, go to:
```
https://www.healthhubinternational.com/patient/login
```

Click **"Continue with Google"** and it should work! ✅

---

## 🚨 **Why It Broke:**

Your Google OAuth was ONLY configured for `localhost:3000`, so when users visit `www.healthhubinternational.com`, Google rejects the login because the domain doesn't match.

By adding your production domain to Google Cloud Console, you're telling Google: "Yes, this domain is allowed to use OAuth."

---

## ✅ **After This Works:**

Both will work:
- ✅ Local development: `http://localhost:3000` 
- ✅ Production: `https://www.healthhubinternational.com`

