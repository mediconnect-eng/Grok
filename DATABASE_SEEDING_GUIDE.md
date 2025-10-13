# 🌱 Database Seeding Guide

## Overview

The database seeding script automatically creates **demo accounts with working passwords** for all 5 portals. This eliminates the need to manually sign up for each portal.

---

## ✅ SEEDING COMPLETED!

**The database has been seeded with the following accounts:**

| Portal | Email | Password | Name |
|--------|-------|----------|------|
| **Patient** | patient@mediconnect.com | Patient@2024 | Jane Doe |
| **GP** | gp@mediconnect.com | GP@2024 | Dr. Michael Chen |
| **Specialist** | specialist@mediconnect.com | Specialist@2024 | Dr. Sarah Johnson |
| **Pharmacy** | pharmacy@mediconnect.com | Pharmacy@2024 | MediPharm Central |
| **Diagnostics** | diagnostics@mediconnect.com | Diagnostics@2024 | MedLab Diagnostics |

---

## 🚀 Quick Start

### Option 1: Use Pre-Seeded Accounts (DONE!)
The database is already seeded! Just login:

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open any portal and login:**
   - Patient: http://localhost:3000/patient/login
   - GP: http://localhost:3000/gp/login
   - Specialist: http://localhost:3000/specialist/login
   - Pharmacy: http://localhost:3000/pharmacy/login
   - Diagnostics: http://localhost:3000/diagnostics/login

3. **Use the credentials above!**
   - Example: `patient@mediconnect.com` / `Patient@2024`

**That's it! No signup required!** ✨

---

## 📋 Seeding Commands

### Run Seeding (Already Done)
```bash
npm run seed
```

### Re-seed Database (If Needed)
If you need to reset and re-seed:

1. **Stop the server** (Ctrl+C)
2. **Delete the database:**
   ```powershell
   Remove-Item sqlite.db
   ```
3. **Start server** (creates fresh schema):
   ```bash
   npm run dev
   ```
4. **Wait for server to be ready**, then stop it (Ctrl+C)
5. **Run seeding:**
   ```bash
   npm run seed
   ```
6. **Restart server:**
   ```bash
   npm run dev
   ```

---

## 🔐 How It Works

### The Seeding Process:

1. **Connects to SQLite Database**
   - Located at: `./sqlite.db`
   - Uses Better Auth schema

2. **Creates User Records**
   - Inserts into `user` table
   - Sets email, name, and verification status

3. **Hashes Passwords Securely**
   - Uses `@node-rs/argon2` (same as Better Auth)
   - Stores in `account` table
   - Industry-standard security

4. **Skips Existing Users**
   - Checks if email already exists
   - Won't duplicate accounts
   - Safe to run multiple times

---

## 📊 Database Structure

### Tables Created:
- **user** - User profiles (id, email, name, etc.)
- **account** - Authentication credentials (hashed passwords)
- **session** - Active user sessions
- **verification** - Email verification tokens

### Seeded Data:
- **5 user accounts** across all portals
- **5 authentication records** with hashed passwords
- **Email verified** = true (pre-verified)
- **No sessions** = users must login first

---

## 🎯 Testing After Seeding

### Test Login Flow:

1. **Patient Portal:**
   ```
   URL:      http://localhost:3000/patient/login
   Email:    patient@mediconnect.com
   Password: Patient@2024
   Expected: Login successful → Patient Home
   ```

2. **GP Portal:**
   ```
   URL:      http://localhost:3000/gp/login
   Email:    gp@mediconnect.com
   Password: GP@2024
   Expected: Login successful → GP Dashboard
   ```

3. **Specialist Portal:**
   ```
   URL:      http://localhost:3000/specialist/login
   Email:    specialist@mediconnect.com
   Password: Specialist@2024
   Expected: Login successful → Specialist Dashboard
   ```

4. **Pharmacy Portal:**
   ```
   URL:      http://localhost:3000/pharmacy/login
   Email:    pharmacy@mediconnect.com
   Password: Pharmacy@2024
   Expected: Login successful → Pharmacy Scanner
   ```

5. **Diagnostics Portal:**
   ```
   URL:      http://localhost:3000/diagnostics/login
   Email:    diagnostics@mediconnect.com
   Password: Diagnostics@2024
   Expected: Login successful → Diagnostics Orders
   ```

---

## ✅ Verification Checklist

After seeding, verify:

- [ ] Server starts without errors
- [ ] Can login to Patient portal
- [ ] Can login to GP portal
- [ ] Can login to Specialist portal
- [ ] Can login to Pharmacy portal
- [ ] Can login to Diagnostics portal
- [ ] Passwords work correctly
- [ ] Sessions persist after refresh
- [ ] Can logout and login again

---

## 🔧 Troubleshooting

### ❌ "Database not initialized"
**Problem:** Schema doesn't exist yet  
**Solution:**
1. Start the server first: `npm run dev`
2. Wait for it to initialize
3. Stop the server (Ctrl+C)
4. Run seed script: `npm run seed`

### ❌ "User already exists"
**Problem:** Accounts were already created  
**Solution:**
- This is normal! The script skips existing users
- Just use the credentials to login
- No action needed

### ❌ "Password is incorrect"
**Problem:** Login fails with correct credentials  
**Solution:**
1. Verify you're using exact credentials (case-sensitive)
2. Try: `patient@mediconnect.com` / `Patient@2024`
3. If still fails, re-seed the database

### ❌ "@node-rs/argon2 not found"
**Problem:** Missing dependency  
**Solution:**
```bash
npm install @node-rs/argon2
```

### ❌ "Cannot open database"
**Problem:** Database file locked or missing  
**Solution:**
1. Stop all Node processes
2. Make sure server is not running
3. Re-run the seed script

---

## 🆚 Seeding vs Manual Signup

### With Seeding (Current Setup):
✅ **Instant demo** - No signup needed  
✅ **All portals ready** - 5 accounts pre-created  
✅ **Consistent credentials** - Same passwords work  
✅ **Time-saving** - Setup in seconds  
✅ **Perfect for demos** - Show immediately  

### Without Seeding (Manual):
❌ Must visit each signup page  
❌ Create 5 separate accounts  
❌ Remember 5 different passwords  
❌ Time-consuming setup  
❌ Easy to forget credentials  

**Recommendation: Use the seeded accounts! 🎉**

---

## 📝 Script Location

**Script:** `scripts/seed-database.js`

**What it does:**
```javascript
1. Connects to sqlite.db
2. Checks if tables exist
3. Creates 5 user accounts
4. Hashes passwords securely
5. Stores in database
6. Reports success
```

**Dependencies:**
- `better-sqlite3` - Database access
- `@node-rs/argon2` - Password hashing
- `crypto` - UUID generation

---

## 🎉 You're All Set!

**The database is seeded and ready to use!**

### Next Steps:
1. ✅ ~~Run seeding~~ (DONE!)
2. **Start server:** `npm run dev`
3. **Open browser:** http://localhost:3000
4. **Login with:** Any of the 5 demo accounts
5. **Enjoy!** 🚀

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| **Seed Database** | `npm run seed` |
| **Start Server** | `npm run dev` |
| **Reset Database** | Delete `sqlite.db` then restart server |
| **View Accounts** | Check this document or run seed script |

**Demo Account (Quick Copy):**
```
patient@mediconnect.com
Patient@2024
```

---

**Last Run:** Database seeded successfully ✅  
**Accounts Created:** 5  
**Status:** Ready to use!

**Start the server and login now!** 🎊
