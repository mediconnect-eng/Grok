# 🔧 DNS Fix Guide - www Subdomain Not Working

**Issue:** `DNS_PROBE_FINISHED_NXDOMAIN` for www.healthhubinternational.com  
**Root Cause:** Missing DNS record for `www` subdomain  
**Status:** Requires DNS configuration update

---

## 🔍 Problem Analysis

### Current DNS Status:
- ✅ `healthhubinternational.com` - **Works** (has A/CNAME record)
- ❌ `www.healthhubinternational.com` - **Does NOT work** (no DNS record)

### Error Explanation:
- **NXDOMAIN** = "Non-Existent Domain"
- DNS cannot find any record for `www.healthhubinternational.com`
- The subdomain `www` is not configured in your DNS settings

---

## ✅ Solution: Add WWW Subdomain to DNS

### Where to Fix This:

**You need to add DNS records in your domain registrar** (where you bought the domain):

Common registrars:
- GoDaddy
- Namecheap
- Google Domains
- Cloudflare
- HostGator
- Others

---

## 📋 Step-by-Step DNS Configuration

### Option 1: CNAME Record (Recommended for Vercel)

**Add this DNS record:**

| Type  | Name | Value/Target | TTL  |
|-------|------|--------------|------|
| CNAME | www  | cname.vercel-dns.com | 3600 |

**OR** if Vercel gave you a specific subdomain:

| Type  | Name | Value/Target | TTL  |
|-------|------|--------------|------|
| CNAME | www  | your-project.vercel.app | 3600 |

### Option 2: A Record (Alternative)

If root domain uses A record, add same IP for www:

| Type | Name | Value/IP Address | TTL  |
|------|------|------------------|------|
| A    | www  | (same as root domain) | 3600 |

---

## 🎯 Detailed Instructions by Registrar

### If Using **GoDaddy:**

1. Log in to GoDaddy account
2. Go to **My Products** → **DNS** (next to your domain)
3. Click **Add** under DNS Records
4. Select **CNAME** from Type dropdown
5. Enter:
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 1 Hour (or default)
6. Click **Save**
7. Wait 5-30 minutes for propagation

### If Using **Namecheap:**

1. Log in to Namecheap
2. Go to **Domain List** → Click **Manage** next to your domain
3. Go to **Advanced DNS** tab
4. Click **Add New Record**
5. Enter:
   - **Type:** CNAME Record
   - **Host:** `www`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** Automatic
6. Click **Save Changes**
7. Wait 5-30 minutes

### If Using **Cloudflare:**

1. Log in to Cloudflare
2. Select your domain
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Enter:
   - **Type:** CNAME
   - **Name:** `www`
   - **Target:** `cname.vercel-dns.com`
   - **Proxy status:** Proxied (orange cloud) OR DNS only
   - **TTL:** Auto
6. Click **Save**
7. Wait 5-30 minutes

---

## 🔍 Finding Your Vercel Target

### Check Vercel Dashboard:

1. Go to: https://vercel.com
2. Select your project: **Grok** (or mediconnect-eng)
3. Go to **Settings** → **Domains**
4. Look for the **CNAME target** value
5. Use that exact value in your DNS

### Common Vercel CNAME Targets:
- `cname.vercel-dns.com` (most common)
- `cname-china.vercel-dns.com` (for China)
- Or your specific project: `your-project-name.vercel.app`

---

## ⏰ Propagation Time

### How Long Until It Works:

- **Minimum:** 5-10 minutes (if lucky)
- **Typical:** 30 minutes to 2 hours
- **Maximum:** Up to 48 hours (rare)

### Speed Up Propagation:
1. Use lower TTL values (e.g., 300 seconds)
2. Clear your DNS cache:
   ```powershell
   ipconfig /flushdns
   ```
3. Try on mobile data (different DNS servers)
4. Use Google DNS (8.8.8.8) in network settings

---

## 🧪 Testing DNS Propagation

### Check if WWW Record Exists:

**Windows PowerShell:**
```powershell
nslookup www.healthhubinternational.com
```

**Should return:**
```
Name:    www.healthhubinternational.com
Address:  76.76.21.21 (or similar Vercel IP)
```

### Online Tools:

1. **DNS Checker:** https://dnschecker.org
   - Enter: `www.healthhubinternational.com`
   - Check if it resolves globally

2. **What's My DNS:** https://www.whatsmydns.net
   - Shows DNS propagation worldwide

3. **DNS Propagation Checker:** https://dnspropagation.net

---

## 🚀 Temporary Workaround

### While Waiting for DNS:

**Use the root domain (without www):**
- ✅ **Works NOW:** https://healthhubinternational.com
- ❌ **Doesn't work:** https://www.healthhubinternational.com

**Share this link instead:**
```
https://healthhubinternational.com
```

---

## 🔄 Update Your Environment Variables

After fixing DNS, update your `.env.local`:

```bash
# Both should work:
NEXT_PUBLIC_APP_URL=https://healthhubinternational.com
BETTER_AUTH_URL=https://healthhubinternational.com

# OR (after www DNS is fixed):
NEXT_PUBLIC_APP_URL=https://www.healthhubinternational.com
BETTER_AUTH_URL=https://www.healthhubinternational.com
```

**Then update Vercel environment variables:**
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL`
3. Update `BETTER_AUTH_URL`
4. Redeploy

---

## ✅ Verification Checklist

Once DNS is configured:

- [ ] WWW subdomain added in DNS settings
- [ ] Waited 30+ minutes for propagation
- [ ] Cleared browser cache (`Ctrl+Shift+Delete`)
- [ ] Flushed DNS cache (`ipconfig /flushdns`)
- [ ] Tested with `nslookup www.healthhubinternational.com`
- [ ] Checked on mobile data (different DNS)
- [ ] Verified on https://dnschecker.org
- [ ] Website loads with www
- [ ] Website loads without www

---

## 🎯 Recommended DNS Configuration

### For Best Results:

**Root domain:**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)
```

**WWW subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Vercel Settings:**
- Add both domains in Vercel:
  - `healthhubinternational.com`
  - `www.healthhubinternational.com`
- Set one as primary (redirect the other)

---

## 📞 Still Not Working?

### Common Issues:

1. **Wrong CNAME target**
   - Solution: Check Vercel dashboard for correct value

2. **DNS cache not cleared**
   - Solution: `ipconfig /flushdns` and restart browser

3. **Propagation not complete**
   - Solution: Wait longer, test on mobile data

4. **Domain not added in Vercel**
   - Solution: Add both domains in Vercel Settings → Domains

5. **SSL certificate pending**
   - Solution: Wait for Vercel to provision SSL (automatic)

---

## 🆘 Get DNS Information

### Find Where Your Domain is Registered:

```powershell
nslookup -type=NS healthhubinternational.com
```

This shows your nameservers - tells you who manages your DNS.

### Contact Support:

If stuck, contact support for:
- Your domain registrar (GoDaddy, Namecheap, etc.)
- Vercel support: https://vercel.com/support

---

## 📚 Additional Resources

- [Vercel Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [DNS Propagation Explained](https://www.cloudflare.com/learning/dns/dns-propagation/)
- [How DNS Works](https://howdns.works/)

---

**IMMEDIATE ACTION REQUIRED:**
1. Log in to your domain registrar
2. Add CNAME record for `www` subdomain
3. Wait 30 minutes
4. Test again

**For now, share:** `https://healthhubinternational.com` (without www)
