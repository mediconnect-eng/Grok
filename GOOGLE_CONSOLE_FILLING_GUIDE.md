# 🎯 GOOGLE CLOUD CONSOLE - EXACT STEPS TO FILL

**You're on this screen right now. Here's exactly what to do:**

---

## 📝 STEP-BY-STEP FORM FILLING

### **Field 1: Application type**
✅ **Already selected:** Web application  
**Action:** Leave as is

---

### **Field 2: Name**
✅ **Already filled:** HealthHub  
**Action:** Leave as is (or change if you want)

---

### **Field 3: Authorised JavaScript origins**

**Current status:** ❌ "Invalid Origin: URI must not be empty"

**What to do:**

1. **Click the "+ Add URI" button** (under "URIs 1")

2. **First URL** - Type exactly:
   ```
   http://localhost:3000
   ```
   ⚠️ Must start with `http://` (not https for localhost)
   ⚠️ No trailing slash

3. **Click "+ Add URI" again**

4. **Second URL** - Type exactly:
   ```
   https://healthhubinternational.com
   ```
   ⚠️ Must start with `https://`
   ⚠️ No trailing slash
   ⚠️ No `www.` prefix

5. **Click "+ Add URI" again**

6. **Third URL** - Type exactly:
   ```
   https://www.healthhubinternational.com
   ```
   ⚠️ Must start with `https://`
   ⚠️ No trailing slash
   ⚠️ Includes `www.` prefix

**Result:** You should now have 3 URLs listed

---

### **Field 4: Authorised redirect URIs**

**Current status:** ❌ "Invalid Redirect: URI must not be empty"

**What to do:**

1. **Scroll down** to "Authorised redirect URIs" section

2. **Click the "+ Add URI" button** (under "URIs 1")

3. **First redirect URL** - Type exactly:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   ⚠️ Must start with `http://` (not https for localhost)
   ⚠️ Must end with `/api/auth/callback/google`
   ⚠️ No spaces, no typos

4. **Click "+ Add URI" again**

5. **Second redirect URL** - Type exactly:
   ```
   https://healthhubinternational.com/api/auth/callback/google
   ```
   ⚠️ Must start with `https://`
   ⚠️ No `www.` prefix
   ⚠️ Must end with `/api/auth/callback/google`

6. **Click "+ Add URI" again**

7. **Third redirect URL** - Type exactly:
   ```
   https://www.healthhubinternational.com/api/auth/callback/google
   ```
   ⚠️ Must start with `https://`
   ⚠️ Includes `www.` prefix
   ⚠️ Must end with `/api/auth/callback/google`

**Result:** You should now have 3 redirect URLs listed

---

## ✅ VERIFICATION BEFORE CLICKING CREATE

**Check your screen shows:**

### **Authorised JavaScript origins (3 total):**
- [ ] `http://localhost:3000`
- [ ] `https://healthhubinternational.com`
- [ ] `https://www.healthhubinternational.com`

### **Authorised redirect URIs (3 total):**
- [ ] `http://localhost:3000/api/auth/callback/google`
- [ ] `https://healthhubinternational.com/api/auth/callback/google`
- [ ] `https://www.healthhubinternational.com/api/auth/callback/google`

**If everything matches ✅ Click "CREATE" button**

---

## 🎉 AFTER CLICKING CREATE

You'll see a modal popup with:

```
OAuth client created

Your Client ID
[Long string ending in .apps.googleusercontent.com]

Your Client Secret
[String starting with GOCSPX-]
```

### **📋 COPY BOTH VALUES!**

**Client ID:** Click the copy icon 📋 or select and copy
**Client Secret:** Click the copy icon 📋 or select and copy

**⚠️ IMPORTANT:** You need BOTH values for the next steps!

---

## 🔄 WHAT HAPPENS NEXT

After you have both values:

1. Open your project's `.env.local` file
2. Replace the old `GOOGLE_CLIENT_ID` with new one
3. Replace the old `GOOGLE_CLIENT_SECRET` with new one
4. Save the file
5. Restart your dev server
6. Test by visiting http://localhost:3000/patient/login

---

## ❓ COMMON MISTAKES TO AVOID

### ❌ **DON'T:**
- Add URLs with trailing slashes (e.g., `http://localhost:3000/`)
- Forget the `http://` or `https://` prefix
- Use `https://` for localhost (use `http://`)
- Add only 1 or 2 URLs (need all 3 of each)
- Miss the `/api/auth/callback/google` path on redirect URIs
- Have typos in domain name

### ✅ **DO:**
- Copy exact URLs from this guide
- Double-check spelling before clicking Create
- Keep the Client ID and Secret safe
- Update both local (.env.local) and Vercel env vars

---

## 📱 QUICK COPY REFERENCE

**JavaScript Origins (copy one at a time):**
```
http://localhost:3000
https://healthhubinternational.com
https://www.healthhubinternational.com
```

**Redirect URIs (copy one at a time):**
```
http://localhost:3000/api/auth/callback/google
https://healthhubinternational.com/api/auth/callback/google
https://www.healthhubinternational.com/api/auth/callback/google
```

---

## 🆘 IF YOU GET ERRORS

**"URI must not be empty"**
→ You forgot to click "+ Add URI" and type the URL

**"Invalid URI format"**
→ Check you included `http://` or `https://` prefix

**After creating, OAuth still doesn't work:**
→ Wait 5 minutes for Google to propagate changes
→ Make sure you updated `.env.local` with NEW credentials
→ Restart your dev server

---

**Ready?** Follow the steps above and you'll have OAuth working in 10 minutes! 🚀
