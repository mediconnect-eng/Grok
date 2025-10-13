# Sentry Error Tracking Setup

**Task:** Add production error monitoring  
**Why:** Know when things break in production  
**Time:** 10-15 minutes

---

## Quick Setup

### Step 1: Create Sentry Account (3 min)
1. Go to: https://sentry.io/signup/
2. Sign up with GitHub/Google/Email
3. Choose plan: **Free** (good for 5,000 errors/month)

### Step 2: Create Project (2 min)
1. Click "Create Project"
2. Platform: **Next.js**
3. Project name: `mediconnect`
4. Alert frequency: **On every new issue**
5. Click "Create Project"

### Step 3: Get DSN (1 min)
After project creation, you'll see a DSN like:
```
https://xxxxxxxxxxxxx@o123456.ingest.sentry.io/123456
```

Copy this DSN.

### Step 4: Install Sentry (2 min)
```bash
npm install @sentry/nextjs
```

### Step 5: Configure Sentry (3 min)

**Add to `.env.local`:**
```bash
# Sentry Error Tracking
SENTRY_DSN=https://xxxxxxxxxxxxx@o123456.ingest.sentry.io/123456
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxx@o123456.ingest.sentry.io/123456
```

**Create `sentry.client.config.ts`** in project root:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust in production
  tracesSampleRate: 0.1,
  
  // Set profilesSampleRate to 1.0 to profile every transaction.
  profilesSampleRate: 0.1,
  
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
});
```

**Create `sentry.server.config.ts`** in project root:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'development',
});
```

**Create `sentry.edge.config.ts`** in project root:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'development',
});
```

### Step 6: Update next.config.js (2 min)

Add Sentry webpack plugin:
```javascript
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  // Your existing config
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "your-org-slug",
    project: "mediconnect",
  },
  {
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

### Step 7: Test (2 min)
```bash
npm run dev
```

Create a test error:
```typescript
// In any page
throw new Error("Test Sentry error");
```

Check Sentry dashboard - you should see the error!

---

## Usage in Code

### Capture Exceptions
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // risky code
} catch (error) {
  Sentry.captureException(error);
  console.error(error);
}
```

### Add Context
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
});

Sentry.setContext("payment", {
  amount: 100,
  currency: "USD",
});
```

### Breadcrumbs
```typescript
Sentry.addBreadcrumb({
  message: "User clicked checkout",
  level: "info",
});
```

---

## Alternative: Simple Logging (No Sentry)

If you don't want Sentry, create basic logging:

**Create `src/lib/logger.ts`:**
```typescript
export function logError(error: Error, context?: any) {
  console.error('[ERROR]', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
  
  // In production, could send to your own logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging API
  }
}

export function logInfo(message: string, data?: any) {
  console.log('[INFO]', message, data);
}

export function logWarning(message: string, data?: any) {
  console.warn('[WARNING]', message, data);
}
```

**Usage:**
```typescript
import { logError } from '@/lib/logger';

try {
  // code
} catch (error) {
  logError(error as Error, { context: 'signup' });
}
```

---

## Monitoring Dashboard

After setup, Sentry provides:
- 🐛 Error tracking
- 📊 Performance monitoring  
- 🔔 Email/Slack alerts
- 📈 Error trends
- 🔍 Stack traces
- 👤 User impact

---

**Recommended:** Use Sentry (free tier is perfect for testing)
