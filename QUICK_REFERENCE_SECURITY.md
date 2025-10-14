# 🚀 Quick Reference: Securing API Routes

## Basic Pattern (Copy & Paste)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';
import { validateBody, YourSchema } from '@/lib/validation';
import { Pool } from 'pg';
import { logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ RATE LIMITING
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.API);
    if (!rateLimitResult.success) return rateLimitResult.response!;

    // 2️⃣ AUTHENTICATION
    const authResult = await requireAuth(request, {
      requireAuth: true,
      requiredRoles: ['patient'], // or ['admin'], ['gp'], etc.
    });
    if (!authResult.success) return authResult.response!;
    const session = authResult.session!;

    // 3️⃣ INPUT VALIDATION
    const validationResult = await validateBody(request, YourSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    const data = validationResult.data;

    // 4️⃣ AUTHORIZATION (Ownership Check)
    if (session.user.id !== data.userId) {
      return NextResponse.json(
        { error: 'You can only access your own resources', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // 5️⃣ BUSINESS LOGIC (Use parameterized queries!)
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM table WHERE id = $1 AND user_id = $2',
        [data.id, session.user.id]
      );
      
      return NextResponse.json({ success: true, data: result.rows });
    } finally {
      client.release();
    }

  } catch (error) {
    logError('API error:', error);
    return NextResponse.json(
      { error: 'An error occurred', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

---

## Rate Limit Presets

```typescript
import { RateLimitPresets } from '@/lib/rate-limiter';

// Choose based on endpoint sensitivity:

RateLimitPresets.AUTH       // 5 req/5min, 15min block (login, signup)
RateLimitPresets.API        // 100 req/min (general APIs)
RateLimitPresets.SENSITIVE  // 10 req/min, 5min block (admin, profile updates)
RateLimitPresets.EMAIL      // 3 req/hour, 1hr block (email operations)
RateLimitPresets.PUBLIC     // 300 req/min (public endpoints)
```

---

## Auth Configurations

```typescript
// Patient endpoint
await requireAuth(request, {
  requireAuth: true,
  requiredRoles: ['patient'],
});

// Admin endpoint
await requireAuth(request, {
  requireAuth: true,
  requiredRoles: ['admin'],
});

// GP/Specialist endpoint
await requireAuth(request, {
  requireAuth: true,
  requiredRoles: ['gp', 'specialist'],
});

// Any authenticated user
await requireAuth(request, {
  requireAuth: true,
});

// With email verification
await requireAuth(request, {
  requireAuth: true,
  requiredRoles: ['patient'],
  requireEmailVerification: true,
});

// With custom check
await requireAuth(request, {
  requireAuth: true,
  customAuthCheck: async (session, request) => {
    // Return true = allow, false = deny, string = error message
    if (someCondition) return true;
    return 'Custom error message';
  },
});
```

---

## Validation Schemas

```typescript
import {
  // Auth
  SignupSchema,
  LoginSchema,
  
  // Consultations
  CreateConsultationSchema,
  ConsultationActionSchema,
  GetConsultationsSchema,
  
  // Prescriptions
  CreatePrescriptionSchema,
  FulfillPrescriptionSchema,
  AssignPharmacySchema,
  
  // Referrals
  CreateReferralSchema,
  ReferralActionSchema,
  
  // Diagnostic Orders
  CreateDiagnosticOrderSchema,
  UpdateDiagnosticStatusSchema,
  
  // Notifications
  GetNotificationsSchema,
  MarkNotificationsReadSchema,
  
  // Applications
  DoctorApplicationSchema,
  PartnerApplicationSchema,
  
  // Helpers
  validateBody,
  validateQuery,
} from '@/lib/validation';

// Validate request body
const result = await validateBody(request, CreateConsultationSchema);
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
const data = result.data; // Type-safe!

// Validate query params
const result = validateQuery(request.nextUrl.searchParams, GetConsultationsSchema);
```

---

## Common Patterns

### GET with User Data
```typescript
export async function GET(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimitResult.success) return rateLimitResult.response!;

  const authResult = await requireAuth(request, { requireAuth: true });
  if (!authResult.success) return authResult.response!;
  const session = authResult.session!;

  // Validate query
  const result = validateQuery(request.nextUrl.searchParams, YourSchema);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Ensure user can only access their own data
  if (session.user.id !== result.data.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Fetch data with parameterized query
  const data = await pool.query(
    'SELECT * FROM table WHERE user_id = $1',
    [session.user.id]
  );

  return NextResponse.json({ success: true, data: data.rows });
}
```

### POST with Multiple Roles
```typescript
export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, RateLimitPresets.SENSITIVE);
  if (!rateLimitResult.success) return rateLimitResult.response!;

  const authResult = await requireAuth(request, {
    requireAuth: true,
    requiredRoles: ['gp', 'specialist'], // Either role works
  });
  if (!authResult.success) return authResult.response!;
  const session = authResult.session!;

  const validationResult = await validateBody(request, YourSchema);
  if (!validationResult.success) {
    return NextResponse.json({ error: validationResult.error }, { status: 400 });
  }

  // Business logic
}
```

### Admin-Only Endpoint
```typescript
export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, RateLimitPresets.SENSITIVE);
  if (!rateLimitResult.success) return rateLimitResult.response!;

  const authResult = await requireAuth(request, {
    requireAuth: true,
    requiredRoles: ['admin'], // Admin only
  });
  if (!authResult.success) return authResult.response!;

  // Admin operations
}
```

---

## SQL Best Practices

### ✅ DO: Use Parameterized Queries
```typescript
// Good
await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
await pool.query('INSERT INTO table (col1, col2) VALUES ($1, $2)', [val1, val2]);
await pool.query('UPDATE table SET name = $1 WHERE id = $2', [name, id]);
```

### ❌ DON'T: Use String Concatenation
```typescript
// Bad - SQL Injection Risk!
await pool.query(`SELECT * FROM users WHERE id = '${userId}'`);
await pool.query(`INSERT INTO table VALUES ('${value}')`);
```

---

## Error Handling

### ✅ DO: Sanitize Errors
```typescript
try {
  // Your code
} catch (error) {
  logError('Detailed error for logs:', error);
  return NextResponse.json(
    { error: 'An error occurred', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

### ❌ DON'T: Expose Error Details
```typescript
// Bad - Exposes internal details
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

---

## Testing Your Secured Route

```bash
# 1. Test without auth (should return 401)
curl http://localhost:3000/api/your-endpoint

# 2. Test with auth (get session cookie from browser)
curl http://localhost:3000/api/your-endpoint \
  -H "Cookie: session=your-session-cookie"

# 3. Test rate limiting (make 101 rapid requests)
for i in {1..101}; do
  curl http://localhost:3000/api/your-endpoint
done
# Should block at 101st request

# 4. Test validation (send invalid data)
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'
# Should return validation error

# 5. Test authorization (try to access another user's data)
curl http://localhost:3000/api/your-endpoint?userId=other-user-id
# Should return 403 Forbidden
```

---

## Checklist for New API Routes

When creating a new API route, verify:

- [ ] Rate limiting applied
- [ ] Authentication required (if protected)
- [ ] Role verification (if role-specific)
- [ ] Input validation with Zod schema
- [ ] Authorization/ownership check
- [ ] Parameterized SQL queries (no string concatenation)
- [ ] Sanitized error responses (no error.message)
- [ ] Logging for audit trail
- [ ] TypeScript errors resolved
- [ ] Manual testing completed

---

## Common Mistakes to Avoid

1. **Forgetting ownership checks** - Always verify user owns the resource
2. **Using wrong rate limit preset** - AUTH for login, not API
3. **Exposing error messages** - Never return error.message to client
4. **SQL string concatenation** - Always use $1, $2 parameters
5. **Not releasing database clients** - Use try/finally
6. **Skipping input validation** - Validate everything from users
7. **Wrong role requirement** - Patient can't access GP endpoints

---

## Quick Commands

```bash
# Create admin user
node scripts/create-admin-user.js

# Promote existing user to admin
node scripts/create-admin-user.js --promote user@example.com

# Run migrations
node scripts/run-migrations.js

# Check for TypeScript errors
npm run type-check

# Start dev server
npm run dev
```

---

## Need Help?

1. **Implementation Guide:** `SECURITY_IMPLEMENTATION_GUIDE.md`
2. **Session Summary:** `CRITICAL_SECURITY_FIXES_SUMMARY.md`
3. **Working Example:** `src/app/api/consultations/create/route.ts`
4. **Auth Middleware:** `src/lib/auth-middleware.ts`
5. **Rate Limiter:** `src/lib/rate-limiter.ts`
6. **Validation:** `src/lib/validation.ts`

---

**Last Updated:** October 14, 2025  
**Version:** 1.0
