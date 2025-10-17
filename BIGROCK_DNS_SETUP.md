# 🔧 BigRock DNS Configuration Guide

**Domain:** healthhubinternational.com  
**Registrar:** BigRock  
**Issue:** No DNS records configured (domain not pointing anywhere)  
**Status:** Requires immediate DNS setup

---

## 🚨 CRITICAL: Domain Has NO DNS Records

### Current Status:
```
❌ healthhubinternational.com - NO A RECORD
❌ www.healthhubinternational.com - NO CNAME RECORD
```

**Your domain isn't pointing to ANYTHING right now.** This is why nobody can access it.

---

## ✅ SOLUTION: Configure DNS in BigRock

### Step-by-Step Instructions for BigRock:

### 1️⃣ **Log in to BigRock**

Go to: **https://www.bigrock.in**
- Click **Login** (top right)
- Enter your email and password
- Complete 2FA if enabled

---

### 2️⃣ **Access DNS Management**

1. After login, go to **My Account**
2. Click **Domains** in the left menu
3. Find **healthhubinternational.com** in the list
4. Click **Manage** or **DNS Management** next to it
5. You'll see "DNS Management" or "Manage DNS" option

**OR:**

1. From dashboard, click **Products**
2. Select **Domains**
3. Click on **healthhubinternational.com**
4. Look for **DNS Management** tab

---

### 3️⃣ **Add DNS Records**

You need to add **TWO records**:

#### **Record 1: Root Domain (A Record)**

Click **Add Record** or **New Record**

| Field | Value |
|-------|-------|
| **Type** | A |
| **Host/Name** | @ (or leave blank) |
| **Points to/Value** | 76.76.21.21 |
| **TTL** | 3600 (or 1 Hour) |

Click **Save** or **Add Record**

#### **Record 2: WWW Subdomain (CNAME Record)**

Click **Add Record** again

| Field | Value |
|-------|-------|
| **Type** | CNAME |
| **Host/Name** | www |
| **Points to/Value** | cname.vercel-dns.com |
| **TTL** | 3600 (or 1 Hour) |

Click **Save** or **Add Record**

---

### 4️⃣ **Alternative: Use Vercel Nameservers (Recommended)**

**If BigRock DNS management is complicated, use Vercel's nameservers instead:**

#### Get Vercel Nameservers:
1. Go to: https://vercel.com
2. Select your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain** → Enter: healthhubinternational.com
5. Vercel will show you nameservers like:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

#### Update in BigRock:
1. In BigRock, go to domain management
2. Look for **Nameservers** or **DNS Servers**
3. Change from BigRock nameservers to:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
4. Save changes
5. Wait 24-48 hours for nameserver propagation

---

## 📸 BigRock DNS Management Screenshots Guide

### Finding DNS Management in BigRock:

**Path 1: Dashboard → Domains**
```
Login → My Account → Domains → Select Domain → DNS Management
```

**Path 2: Products Menu**
```
Login → Products → Domain Names → healthhubinternational.com → Manage DNS
```

**Path 3: Quick Actions**
```
Dashboard → Quick Links → DNS Management → Select Domain
```

---

## 🎯 Recommended Configuration

### Option A: Use BigRock DNS (Easier)

**Step 1:** Add A Record
- Host: @ or leave blank
- Type: A
- Value: 76.76.21.21 (Vercel IP)
- TTL: 3600

**Step 2:** Add CNAME Record
- Host: www
- Type: CNAME
- Value: cname.vercel-dns.com
- TTL: 3600

**Propagation Time:** 30 minutes to 2 hours

---

### Option B: Use Vercel Nameservers (Better for long-term)

**Advantages:**
- Automatic SSL certificate
- Faster propagation
- Better integration with Vercel
- Less manual maintenance

**Steps:**
1. Get nameservers from Vercel (see step 4 above)
2. Change nameservers in BigRock
3. Wait 24-48 hours
4. Domain automatically configured

---

## 🔍 Common BigRock Issues

### Issue 1: Can't Find DNS Management
**Solution:**
- Look for "Advanced DNS" or "DNS Records"
- Try "Manage Order" → DNS section
- Contact BigRock support if still can't find

### Issue 2: DNS Changes Not Saving
**Solution:**
- Make sure you clicked "Save" or "Add Record"
- Check if there are any error messages
- Try using a different browser
- Clear browser cache

### Issue 3: "Domain Locked" Error
**Solution:**
- Go to domain settings
- Look for "Domain Lock" or "Transfer Lock"
- Disable it temporarily
- Make DNS changes
- Re-enable lock

### Issue 4: BigRock UI is Confusing
**Solution:**
- Contact BigRock Support: support@bigrock.in
- Or call: 1800 200 5678 (India toll-free)
- Ask them to add these DNS records for you

---

## 📞 BigRock Support Contact

### If You Need Help:

**Email:** support@bigrock.in  
**Phone (India):** 1800 200 5678 (Toll-free)  
**Phone (Paid):** +91 22 6140 4242  
**Chat:** Available on BigRock website (bottom right)  
**Support Hours:** 24/7

**Tell them:**
> "I need to add DNS records for my domain healthhubinternational.com. I need to add an A record pointing to 76.76.21.21 and a CNAME record for www pointing to cname.vercel-dns.com"

---

## ⏰ How Long Until It Works?

### DNS Propagation Timeline:

| Method | Time |
|--------|------|
| **A/CNAME Records** | 30 mins - 2 hours |
| **Nameserver Change** | 24-48 hours |
| **Globally Available** | Up to 72 hours |

### Speed Up Testing:

**Clear DNS Cache (Windows):**
```powershell
ipconfig /flushdns
```

**Try Mobile Data:**
- Turn off WiFi
- Use mobile data (different DNS servers)
- Test the website

**Use Google DNS:**
1. Go to Network Settings
2. Change DNS to: 8.8.8.8 and 8.8.4.4
3. Test again

---

## 🧪 Verify DNS Configuration

### After Adding Records:

**Test Command:**
```powershell
nslookup healthhubinternational.com
nslookup www.healthhubinternational.com
```

**Should show:**
```
healthhubinternational.com
Address:  76.76.21.21

www.healthhubinternational.com
Address:  76.76.21.21 (or similar)
```

**Online Tools:**
- https://dnschecker.org
- Enter: healthhubinternational.com
- Check: Shows IP addresses globally

---

## 🎯 Quick Reference: What IP to Use?

### Vercel IPs (use any of these for A record):

```
76.76.21.21
76.76.21.22
76.76.21.98
76.76.21.241
```

**Or get your specific IP:**
1. Go to Vercel Dashboard
2. Settings → Domains
3. Add your domain
4. Vercel will show the correct IP/CNAME

---

## 📋 Pre-Configured Values (Copy-Paste Ready)

### For BigRock DNS Panel:

**Record 1:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Record 2:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

---

## ⚠️ Important Notes

### After Adding DNS Records:

1. **Verify in Vercel:**
   - Go to Vercel → Settings → Domains
   - Add both:
     - healthhubinternational.com
     - www.healthhubinternational.com
   - Vercel will verify DNS automatically

2. **SSL Certificate:**
   - Vercel auto-generates SSL (HTTPS)
   - Takes 10-30 minutes after DNS propagates
   - Don't worry if you see "Not Secure" initially

3. **Update Environment Variables:**
   - Update `.env.local` with correct domain
   - Redeploy from Vercel dashboard

---

## 🆘 Still Not Working?

### Troubleshooting Steps:

1. **Wait Longer**
   - DNS can take 24-48 hours
   - Check every 2-4 hours

2. **Verify Records in BigRock**
   - Log back in
   - Check if records are still there
   - Sometimes they don't save properly

3. **Contact BigRock Support**
   - Call or chat with them
   - They can add records for you
   - Usually resolved in 15-30 minutes

4. **Alternative: Change Nameservers**
   - Switch to Vercel nameservers
   - More reliable long-term
   - Takes 24-48 hours but works better

---

## ✅ Final Checklist

- [ ] Logged into BigRock account
- [ ] Found DNS Management section
- [ ] Added A record for root domain
- [ ] Added CNAME record for www subdomain
- [ ] Saved changes
- [ ] Added domains in Vercel dashboard
- [ ] Waited 30+ minutes
- [ ] Cleared DNS cache (`ipconfig /flushdns`)
- [ ] Tested on mobile data
- [ ] Verified with `nslookup`
- [ ] Checked on https://dnschecker.org

---

**NEXT STEP:** Log into BigRock NOW and add those two DNS records. It takes 2-3 minutes!

**Need help?** Contact BigRock support - they're usually very helpful with DNS configuration.
