# Security Implementation Guide

## ✅ Completed Security Measures

### 1. Authentication Middleware (`src/lib/auth-middleware.ts`)

**Purpose:** Centralized authentication and authorization for all API routes.

**Features:**
- Session verification using Better Auth
- Role-based access control (RBAC)
- Email verification checks
- Resource ownership verification
- Custom authorization logic support
- Standardized error responses

**Usage Example:**
```typescript
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  // Require authenticated patient
  const authResult = await requireAuth(request, {
    requireAuth: true,
    requiredRoles: ['patient'],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  const session = authResult.session!;
  // ... your route logic
}
```

**Key Functions:**
- `requireAuth()` - Main middleware wrapper
- `verifyRole()` - Check user role
- `verifyOwnership()` - Verify resource ownership
- `verifyEmailVerified()` - Check email verification status

### 2. Rate Limiting (`src/lib/rate-limiter.ts`)

**Purpose:** Prevent brute force attacks and API abuse.

**Features:**
- In-memory rate limiting (production: use Redis)
- Configurable request limits and time windows
- Automatic blocking after limit exceeded
- Standard HTTP 429 responses with Retry-After headers
- Preset configurations for common use cases

**Presets:**
- `AUTH` - 5 requests/5min, 15min block (login, signup)
- `API` - 100 requests/minute (general API endpoints)
- `SENSITIVE` - 10 requests/minute, 5min block (profile updates)
- `EMAIL` - 3 requests/hour, 1hour block (email operations)
- `PUBLIC` - 300 requests/minute (public endpoints)

**Usage Example:**
```typescript
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request, RateLimitPresets.AUTH);
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  // ... your route logic
}
```

### 3. Input Validation (`src/lib/validation.ts`)

**Purpose:** Validate and sanitize all user inputs using Zod schemas.

**Features:**
- Type-safe input validation
- Comprehensive schemas for all API endpoints
- Runtime type checking
- Detailed error messages
- Helper functions for validation

**Available Schemas:**
- **Authentication:** SignupSchema, LoginSchema, EmailVerificationSchema
- **Consultations:** CreateConsultationSchema, ConsultationActionSchema
- **Prescriptions:** CreatePrescriptionSchema, FulfillPrescriptionSchema
- **Referrals:** CreateReferralSchema, ReferralActionSchema
- **Diagnostic Orders:** CreateDiagnosticOrderSchema, UpdateDiagnosticStatusSchema
- **Notifications:** GetNotificationsSchema, MarkNotificationsReadSchema
- **Applications:** DoctorApplicationSchema, PartnerApplicationSchema

**Usage Example:**
```typescript
import { validateBody, CreateConsultationSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  // Validate request body
  const validationResult = await validateBody(request, CreateConsultationSchema);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const data = validationResult.data; // Type-safe!
  // ... your route logic
}
```

### 4. Secure API Route Example

**File:** `src/app/api/consultations/create/route.ts`

**Security Layers Applied:**
1. ✅ Rate limiting (100 requests/minute)
2. ✅ Authentication (requires logged-in user)
3. ✅ Role verification (must be 'patient')
4. ✅ Input validation (Zod schema)
5. ✅ Authorization (ownership verification)
6. ✅ Sanitized errors (no stack traces)
7. ✅ Parameterized SQL queries (prevents injection)

**Implementation Pattern:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.API);
    if (!rateLimitResult.success) return rateLimitResult.response!;

    // 2. Authentication
    const authResult = await requireAuth(request, {
      requireAuth: true,
      requiredRoles: ['patient'],
    });
    if (!authResult.success) return authResult.response!;
    const session = authResult.session!;

    // 3. Input validation
    const validationResult = await validateBody(request, Schema);
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }
    const data = validationResult.data;

    // 4. Authorization (ownership check)
    if (session.user.id !== data.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 5. Business logic with parameterized queries
    const result = await pool.query('SELECT * FROM table WHERE id = $1', [id]);

    // 6. Success response
    return NextResponse.json({ success: true, data: result.rows });

  } catch (error) {
    logError('API error:', error);
    // 7. Sanitized error (no stack trace)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

## 🚧 Remaining Security Tasks

### 5. SQL Injection Prevention

**Status:** Partially complete (new code uses parameterized queries)

**Action Required:**
- Audit all existing API routes
- Replace string concatenation with parameterized queries
- Example:
  ```typescript
  // ❌ VULNERABLE
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  
  // ✅ SECURE
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [userId]);
  ```

**Files to Check:**
- All `/api/**/route.ts` files
- Search for template literals in SQL queries

### 6. CSRF Protection

**Status:** Not implemented

**Action Required:**
- Implement CSRF token generation and validation
- Add CSRF middleware to all state-changing routes (POST, PUT, DELETE)
- Use better-auth built-in CSRF protection or implement custom

**Implementation:**
```typescript
// 1. Generate CSRF token on login
// 2. Include in all forms and API requests
// 3. Validate on server before processing
```

### 7. Admin Dashboard Security

**Status:** ⚠️ CRITICAL - No authentication

**Current Issue:**
- `/admin` route is publicly accessible
- No admin login page exists
- Admin APIs have no authentication
- Anyone can approve/reject applications

**Files Requiring Updates:**
1. `src/app/admin/page.tsx` - Add auth guard
2. `src/app/admin/applications/page.tsx` - Add auth guard
3. `src/app/api/admin/applications/route.ts` - Add auth middleware
4. `src/app/api/admin/approve/route.ts` - Add auth middleware
5. `src/app/api/admin/reject/route.ts` - Add auth middleware

**Implementation Steps:**

#### Step 1: Create Admin Login Page
```typescript
// src/app/admin/login/page.tsx
'use client';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const router = useRouter();

  const handleLogin = async () => {
    const result = await authClient.signIn.email(credentials);
    
    if (result.data?.user?.role === 'admin') {
      router.push('/admin');
    } else {
      alert('Admin access required');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-surface p-8 rounded-card shadow-card">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <input
          type="email"
          placeholder="Admin Email"
          onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}
```

#### Step 2: Protect Admin Pages
```typescript
// src/app/admin/page.tsx
'use client';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!session?.user || session.user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [session, isPending, router]);

  if (isPending || !session || session.user.role !== 'admin') {
    return <div>Loading...</div>;
  }

  // ... rest of component
}
```

#### Step 3: Secure Admin APIs
```typescript
// src/app/api/admin/applications/route.ts
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, {
    requireAuth: true,
    requiredRoles: ['admin'],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  // ... fetch applications
}
```

#### Step 4: Create Admin Users
```typescript
// scripts/create-admin-user.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const email = 'admin@mediconnect.com';
  const password = await bcrypt.hash('YourSecurePassword123!', 10);
  
  await pool.query(
    `INSERT INTO "user" (id, email, name, role, "emailVerified")
     VALUES (gen_random_uuid(), $1, 'Admin', 'admin', true)
     ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
    [email]
  );
  
  console.log('Admin user created:', email);
  pool.end();
}

createAdmin();
```

### 8. Authorization Checks (Ownership Verification)

**Status:** Implemented in consultations API, needs rollout

**Action Required:**
- Apply ownership checks to ALL resource access APIs
- Verify users can only access their own:
  - Consultations
  - Prescriptions
  - Referrals
  - Diagnostic orders
  - Notifications
  - Profile data

**Pattern:**
```typescript
// After authentication, before data access
if (session.user.id !== resourceOwnerId) {
  return NextResponse.json(
    { error: 'Unauthorized', code: 'AUTHORIZATION_FAILED' },
    { status: 403 }
  );
}
```

### 9. Error Sanitization

**Status:** Partially complete

**Action Required:**
- Remove all `error.message` in catch blocks
- Never expose stack traces in production
- Log detailed errors server-side only
- Return generic errors to client

**Implementation:**
```typescript
catch (error) {
  logError('Detailed error for logs:', error);
  
  // Generic error for client
  return NextResponse.json(
    { 
      error: process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : error.message,
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}
```

### 10. Security Headers

**Status:** Basic headers in middleware.ts

**Action Required:**
- Update `next.config.js` with comprehensive headers
- Add Content Security Policy (CSP)
- Add Strict-Transport-Security (HSTS)
- Configure for production deployment

**Implementation:**
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

## 📋 Security Checklist for New API Routes

When creating a new API route, ensure:

- [ ] Rate limiting applied
- [ ] Authentication required (if protected)
- [ ] Role verification (if role-specific)
- [ ] Input validation with Zod schema
- [ ] Authorization/ownership check
- [ ] Parameterized SQL queries (no string concatenation)
- [ ] Sanitized error responses
- [ ] Logging for audit trail
- [ ] Security tests written

## 🔐 Password Security

**Current Implementation:**
- Minimum 12 characters
- Requires: uppercase, lowercase, number, special character
- Hashed with bcrypt (Better Auth default)

**Recommended Additions:**
- Check against common password lists
- Implement password strength meter on frontend
- Add password history (prevent reuse)
- Enforce password expiration (optional for healthcare)

## 🚨 Critical Vulnerabilities Remaining

Priority order for fixing:

1. **CRITICAL:** Secure admin dashboard (no auth)
2. **HIGH:** Add CSRF protection
3. **HIGH:** Apply auth/validation to all remaining APIs
4. **MEDIUM:** Audit and fix SQL injection risks
5. **MEDIUM:** Implement comprehensive error sanitization
6. **LOW:** Update security headers in config

## 📊 Progress Tracker

| Security Measure | Status | Priority |
|-----------------|--------|----------|
| Authentication Middleware | ✅ Complete | Critical |
| Rate Limiting | ✅ Complete | Critical |
| Input Validation | ✅ Complete | Critical |
| Example Secure API | ✅ Complete | High |
| SQL Injection Prevention | ⏳ Partial | High |
| CSRF Protection | ❌ Not Started | High |
| Admin Dashboard Security | ❌ Not Started | Critical |
| Authorization Checks | ⏳ Partial | High |
| Error Sanitization | ⏳ Partial | Medium |
| Security Headers | ⏳ Partial | Medium |

## 🧪 Testing Security

### Manual Testing
1. Test authentication with invalid sessions
2. Test rate limiting by making rapid requests
3. Test input validation with malformed data
4. Test authorization with different user accounts
5. Attempt SQL injection in all input fields

### Automated Testing
Create test files for each security layer:
```typescript
// __tests__/security/auth-middleware.test.ts
// __tests__/security/rate-limiter.test.ts
// __tests__/security/validation.test.ts
```

## 🎯 Next Steps

1. **Immediate:** Secure admin dashboard
2. **Short-term:** Apply security pattern to all APIs
3. **Medium-term:** Implement CSRF protection
4. **Long-term:** Set up automated security scanning

## 📚 References

- [Better Auth Documentation](https://better-auth.com)
- [Zod Documentation](https://zod.dev)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [HIPAA Security Requirements](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
