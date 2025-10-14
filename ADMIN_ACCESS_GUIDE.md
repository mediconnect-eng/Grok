# 🔐 Admin Dashboard Access Guide

**Server:** http://localhost:3000/admin  
**Last Updated:** October 14, 2025

---

## ⚠️ IMPORTANT: Admin Dashboard Status

### **Current Issue:**
The admin dashboard **exists** at `/admin` but there is **NO AUTHENTICATION SYSTEM** implemented for it yet!

### **What This Means:**
- ✅ The admin dashboard UI is built and functional
- ✅ The dashboard shows provider/partner applications
- ✅ Application approval/rejection APIs exist
- ❌ **Anyone can access `/admin` without logging in**
- ❌ No admin user role is enforced
- ❌ No admin login page exists

---

## 🚨 Security Risk

**CRITICAL:** The admin dashboard is currently **UNPROTECTED**. This is a major security vulnerability:

```
⚠️ ANYONE can access: http://localhost:3000/admin
⚠️ NO authentication required
⚠️ NO role verification
⚠️ Production deployment would expose all applications
```

---

## 🎯 How to Access Admin Dashboard (Current State)

### **Option 1: Direct Access (Development Only)**

Simply navigate to:
```
http://localhost:3000/admin
```

**That's it!** The dashboard will load without any authentication.

### **What You'll See:**
- Provider and partner applications
- Application statistics (pending, approved, rejected)
- Filters by type and status
- Search functionality
- "View Details" links to review applications
- Approve/Reject buttons (on detail pages)

---

## 📋 What's Missing

### **1. Admin Authentication System**

Currently missing:
- ❌ Admin login page (`/auth/admin/login`)
- ❌ Admin role in database
- ❌ Admin user creation
- ❌ Admin authentication check

### **2. Admin User Table**

The database has an `admin_users` table (from migration 002):
```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  role VARCHAR(20) DEFAULT 'admin',
  permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**But:** No admin users have been created yet.

### **3. Admin Authorization Middleware**

The `/admin` route has no protection. It should have:
```typescript
// What's MISSING from src/app/admin/page.tsx

'use client';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  // THIS CHECK IS MISSING!
  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/admin/login');
      return;
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, router]);
  
  // ... rest of dashboard code
}
```

---

## 🛠️ How to Properly Secure the Admin Dashboard

### **Step 1: Create Admin Login Page**

Create: `src/app/auth/admin/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: '/admin',
      });

      if (result.error) {
        setError('Invalid admin credentials');
        return;
      }

      // Verify admin role
      const session = await fetch('/api/auth/session').then(r => r.json());
      if (session.user?.role !== 'admin') {
        setError('Access denied: Admin privileges required');
        return;
      }

      router.push('/admin');
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-card shadow-card p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-button"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-button"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2 rounded-button hover:bg-primary-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
```

### **Step 2: Add Admin Protection to Dashboard**

Update: `src/app/admin/page.tsx`

Add this at the beginning of the component:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  // ... rest of state

  // ADD THIS CHECK
  useEffect(() => {
    if (isPending) return; // Wait for session to load

    if (!session?.user) {
      router.push('/auth/admin/login');
      return;
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, isPending, router]);

  // Show loading while checking auth
  if (isPending || !session?.user || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // ... rest of component
}
```

### **Step 3: Create Admin User in Database**

Run this SQL directly in your database or create a script:

```sql
-- Create admin user account
INSERT INTO "user" (id, email, name, "emailVerified", role, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'admin@mediconnect.com',
  'System Administrator',
  true,
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Get the user ID
SELECT id FROM "user" WHERE email = 'admin@mediconnect.com';

-- Add to admin_users table (replace USER_ID with actual UUID)
INSERT INTO admin_users (user_id, role, permissions)
VALUES (
  'USER_ID_HERE',
  'super_admin',
  '{"approve_providers": true, "approve_partners": true, "manage_users": true}'::jsonb
);
```

### **Step 4: Set Admin Password**

Use better-auth to create the admin password:

```bash
# In your terminal
node -e "
const { hash } = require('@node-rs/argon2');
(async () => {
  const hashed = await hash('AdminPass123!');
  console.log('Hashed password:', hashed);
})();
"
```

Then insert into database:
```sql
UPDATE "user" 
SET password = 'HASHED_PASSWORD_HERE'
WHERE email = 'admin@mediconnect.com';
```

### **Step 5: Update User Role Schema**

Make sure the `user` table supports 'admin' role:

```sql
-- Check current role constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = '"user"'::regclass
AND conname LIKE '%role%';

-- If needed, drop and recreate constraint
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_role_check;
ALTER TABLE "user" ADD CONSTRAINT user_role_check 
CHECK (role IN ('patient', 'gp', 'specialist', 'pharmacy', 'diagnostics', 'admin'));
```

---

## 🎯 Quick Setup Script

Here's a complete script to set up an admin user:

### Create: `scripts/create-admin-user.js`

```javascript
const { Pool } = require('pg');
const { hash } = require('@node-rs/argon2');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 Creating admin user...\n');

    // Admin credentials
    const adminEmail = 'admin@mediconnect.com';
    const adminPassword = 'AdminPass123!'; // CHANGE THIS!
    const adminName = 'System Administrator';

    // Hash password
    const hashedPassword = await hash(adminPassword);
    console.log('✓ Password hashed');

    // Check if admin exists
    const existing = await client.query(
      'SELECT id FROM "user" WHERE email = $1',
      [adminEmail]
    );

    let userId;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      console.log(`✓ Admin user already exists: ${adminEmail}`);
      
      // Update password
      await client.query(
        'UPDATE "user" SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
      console.log('✓ Password updated');
    } else {
      // Create user
      userId = crypto.randomUUID();
      await client.query(`
        INSERT INTO "user" (id, email, name, password, "emailVerified", role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, 'admin', NOW(), NOW())
      `, [userId, adminEmail, adminName, hashedPassword]);
      console.log(`✓ Admin user created: ${adminEmail}`);
    }

    // Add to admin_users table
    const adminUserExists = await client.query(
      'SELECT * FROM admin_users WHERE user_id = $1',
      [userId]
    );

    if (adminUserExists.rows.length === 0) {
      await client.query(`
        INSERT INTO admin_users (user_id, role, permissions)
        VALUES ($1, 'super_admin', $2::jsonb)
      `, [
        userId,
        JSON.stringify({
          approve_providers: true,
          approve_partners: true,
          manage_users: true,
          view_analytics: true
        })
      ]);
      console.log('✓ Admin permissions granted');
    }

    console.log('\n✅ Admin user setup complete!\n');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🌐 Login at: http://localhost:3000/auth/admin/login');
    console.log('\n⚠️  IMPORTANT: Change the password immediately!\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser();
```

### Run the script:

```bash
node scripts/create-admin-user.js
```

---

## 📱 Current Workaround (For Testing Only)

Since the admin dashboard isn't protected yet, you can:

### **Option A: Access Directly**
```
http://localhost:3000/admin
```

### **Option B: Create a Test Account**

1. Sign up as any user (patient, GP, etc.)
2. Manually change their role in the database:

```sql
UPDATE "user" 
SET role = 'admin' 
WHERE email = 'your@email.com';
```

3. Add to admin_users table:

```sql
INSERT INTO admin_users (user_id, role, permissions)
SELECT id, 'admin', '{"approve_providers": true}'::jsonb
FROM "user"
WHERE email = 'your@email.com';
```

4. Login normally, then navigate to `/admin`

---

## 🔒 API Endpoints (Also Need Protection!)

The admin APIs also lack authentication:

### **Affected Endpoints:**
- `GET /api/admin/applications` - List all applications
- `POST /api/admin/approve` - Approve applications
- `POST /api/admin/reject` - Reject applications
- `GET /api/admin/applications/[id]` - View application details

### **Add Protection:**

Each API route needs:

```typescript
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  // Verify session
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify admin role
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  // ... rest of endpoint
}
```

---

## ✅ Complete Implementation Checklist

- [ ] Create `/auth/admin/login` page
- [ ] Add authentication check to `/admin` dashboard
- [ ] Create admin user account in database
- [ ] Add admin user to `admin_users` table
- [ ] Update role constraint to include 'admin'
- [ ] Protect all `/api/admin/*` endpoints
- [ ] Add admin role to middleware protection
- [ ] Add "Admin" link to header (only for admin users)
- [ ] Create admin logout functionality
- [ ] Add audit logging for admin actions
- [ ] Implement password change for admin
- [ ] Add 2FA for admin accounts (recommended)

---

## 📊 Summary

### **Current State:**
- ✅ Admin UI exists at `/admin`
- ✅ Application approval APIs work
- ✅ Database tables ready
- ❌ **No authentication**
- ❌ **No authorization**
- ❌ **Anyone can access**

### **For Development Testing:**
Just go to: **http://localhost:3000/admin**

### **For Production:**
**MUST** implement full authentication system first! Use the setup guide above.

---

## 🚨 DO NOT DEPLOY WITHOUT FIXING

**CRITICAL:** Do not deploy this application to production with the admin dashboard unprotected. This would expose all user applications and allow anyone to approve/reject applications.

**Minimum Requirements Before Production:**
1. Admin login page implemented
2. Admin authentication enforced
3. Admin APIs protected with auth middleware
4. Admin role properly validated
5. Audit logging for all admin actions

---

**Questions?** Check:
- `SECURITY_AUDIT_REPORT.md` - Full security analysis
- `REAL_USER_SYSTEM_PLAN.md` - Admin system implementation plan
- `migrations/002_provider_applications.sql` - Admin database schema
