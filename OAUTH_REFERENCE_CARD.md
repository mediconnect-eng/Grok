# 🎯 OAUTH SETUP - COPY/PASTE REFERENCE CARD

## 📋 URLs TO ADD IN GOOGLE CLOUD CONSOLE

### **Authorised JavaScript origins (Add 3):**
```
http://localhost:3000
```
```
https://healthhubinternational.com
```
```
https://www.healthhubinternational.com
```

### **Authorised redirect URIs (Add 3):**
```
http://localhost:3000/api/auth/callback/google
```
```
https://healthhubinternational.com/api/auth/callback/google
```
```
https://www.healthhubinternational.com/api/auth/callback/google
```

---

## 📝 .env.local UPDATE

**Find in `.env.local`:**
```env
GOOGLE_CLIENT_ID=your-old-client-id
GOOGLE_CLIENT_SECRET=your-old-secret
```

**Replace with new credentials from Google Console**

---

## 🔄 AFTER UPDATING

1. Save `.env.local`
2. Restart dev server: `npm run dev`
3. Test: http://localhost:3000/patient/login
4. Update Vercel env vars
5. Redeploy on Vercel
6. Test production: https://www.healthhubinternational.com/patient/login

---

## ✅ TEST COMMAND

```powershell
node scripts/test-oauth-config.js
```

Shows if credentials are loaded correctly.

---

**That's it!** Simple copy/paste setup. 🚀
