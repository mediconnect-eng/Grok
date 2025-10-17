# ✅ GOOGLE OAUTH SETUP - QUICK CHECKLIST

**Current Status:** Setting up NEW OAuth client in Google Cloud Console

---

## 📋 YOUR ACTION ITEMS (In Order)

### **✅ STEP 1: Fill in Google Cloud Console Form**

**You're on this screen now. Fill in these fields:**

#### **Authorised JavaScript origins:**
Click "+ Add URI" and add **3 URLs**:
```
http://localhost:3000
https://healthhubinternational.com
https://www.healthhubinternational.com
```

#### **Authorised redirect URIs:**
Click "+ Add URI" and add **3 URLs**:
```
http://localhost:3000/api/auth/callback/google
https://healthhubinternational.com/api/auth/callback/google
https://www.healthhubinternational.com/api/auth/callback/google
```

**Then click "CREATE" or "SAVE"**

---

### **✅ STEP 2: Copy Your New Credentials**

After clicking Create, you'll see:
```
Client ID: xxxxx-xxxxxxxxx.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxxx
```

**📋 COPY BOTH - You'll need them next!**

---

### **✅ STEP 3: Update Local .env.local File**

**Open:** `.env.local` in your project root

**Find lines 33-34:**
```env
GOOGLE_CLIENT_ID=your-old-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-old-client-secret
```

**Replace with your NEW values:**
```env
GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET_HERE
```

**💾 SAVE the file**

---

### **✅ STEP 4: Restart Your Dev Server**

**In PowerShell terminal:**
```powershell
# Press Ctrl+C to stop current server
# Then restart:
npm run dev
```

---

### **✅ STEP 5: Test Locally**

1. Open: http://localhost:3000/patient/login
2. Click "Continue with Google"
3. Should redirect to Google login
4. Sign in with your Google account
5. Should redirect back to `/patient/home`
6. ✅ **Success!** You're logged in

---

### **✅ STEP 6: Update Vercel**

**Go to:** https://vercel.com/dashboard

1. Click your **HealthHub project**
2. **Settings** → **Environment Variables**
3. Find `GOOGLE_CLIENT_ID`:
   - Click "Edit"
   - Paste NEW Client ID
   - Click "Save"
4. Find `GOOGLE_CLIENT_SECRET`:
   - Click "Edit"
   - Paste NEW Client Secret
   - Click "Save"
5. Go to **Deployments**
6. Click "..." on latest deployment
7. Click **"Redeploy"**

---

### **✅ STEP 7: Test Production**

**After Vercel finishes redeploying (~2-3 minutes):**

1. Open: https://www.healthhubinternational.com/patient/login
2. Click "Continue with Google"
3. Sign in with Google
4. ✅ Should work!

---

## 🚨 IF SOMETHING FAILS

### **Error: "redirect_uri_mismatch"**
→ Go back to Google Console and verify redirect URIs match exactly

### **Error: "Invalid Origin"**
→ Go back to Google Console and verify JavaScript origins are correct

### **Still not working?**
→ See full guide: `GOOGLE_OAUTH_COMPLETE_SETUP.md`

---

## 📞 QUICK HELP

**Old credentials (will be deleted):**
- Client ID: `your-old-client-id...`
- ❌ These will stop working once you delete old OAuth client

**New credentials (you're creating now):**
- Client ID: (you'll get after clicking Create)
- Client Secret: (you'll get after clicking Create)
- ✅ Use these going forward

---

## ✅ SUCCESS CRITERIA

**You're done when:**
- [x] Google Console has new OAuth client with 3 origins + 3 redirect URIs
- [x] `.env.local` updated with new credentials
- [x] Dev server restarted
- [x] Can login with Google locally
- [x] Vercel env vars updated
- [x] Vercel redeployed
- [x] Can login with Google in production

---

**Estimated Time:** 10-15 minutes  
**Difficulty:** Easy (just copy/paste!)

**Full detailed guide:** See `GOOGLE_OAUTH_COMPLETE_SETUP.md`
