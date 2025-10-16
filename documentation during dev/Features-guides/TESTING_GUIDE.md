# Production Testing Guide

## 🧪 Testing Your 100+ User Production Build

Before deploying Mediconnect to 100+ users, complete this comprehensive testing guide.

---

## 1. Pre-Testing Setup

### Environment Preparation
```bash
# Create production environment file
cp .env.example .env.local

# Configure with production values
# Edit .env.local with real credentials
```

### Database Setup (PostgreSQL Recommended)
```bash
# Option A: Local PostgreSQL
createdb mediconnect
# Update DATABASE_URL in .env.local

# Option B: Cloud PostgreSQL (Neon, Supabase)
# Create database in cloud dashboard
# Copy connection string to DATABASE_URL

# Run Better Auth migrations (automatic on first connection)
npm run dev
# Stop after database tables are created
```

### Build Production Bundle
```bash
# Create optimized production build
npm run build

# Start production server locally
npm start
```

---

## 2. Functional Testing

### Test 1: User Registration ✅

**Test all 5 portal signups:**

#### Patient Signup
```
1. Navigate to: http://localhost:3000/auth/patient/signup
2. Fill in:
   - Name: Test Patient
   - Email: testpatient1@example.com
   - Password: TestPassword123!
   - Confirm Password: TestPassword123!
3. Click "Create account"
4. Expected: Redirect to /patient/home
5. Verify: User session persists on refresh
```

#### GP Signup
```
1. Navigate to: http://localhost:3000/auth/gp/signup
2. Fill in:
   - Name: Test GP
   - Email: testgp1@example.com
   - Password: TestPassword123!
   - Confirm Password: TestPassword123!
3. Click "Create account"
4. Expected: Redirect to /gp
5. Verify: GP dashboard loads successfully
```

#### Specialist Signup
```
1. Navigate to: http://localhost:3000/auth/specialist/signup
2. Fill in:
   - Name: Test Specialist
   - Email: testspecialist1@example.com
   - Password: TestPassword123!
   - Confirm Password: TestPassword123!
3. Click "Create account"
4. Expected: Redirect to /specialist
5. Verify: Specialist dashboard loads
```

#### Pharmacy Signup (if applicable)
```
1. Navigate to: http://localhost:3000/pharmacy/login
2. Check if signup link exists
3. Test signup flow if available
4. Expected: Redirect to /pharmacy/scanner
```

#### Diagnostics Signup (if applicable)
```
1. Navigate to: http://localhost:3000/diagnostics/login
2. Check if signup link exists
3. Test signup flow if available
4. Expected: Redirect to /diagnostics/orders
```

**Validation Tests:**
- [ ] Empty fields show error: "All fields are required"
- [ ] Short password shows error: "Password must be at least 8 characters"
- [ ] Mismatched passwords show error: "Passwords do not match"
- [ ] Invalid email shows error: "Please enter a valid email address"
- [ ] Duplicate email shows error: "Email already exists"

### Test 2: User Login ✅

**Test with created accounts:**

```
For each portal (Patient, GP, Specialist, Pharmacy, Diagnostics):
1. Navigate to login page
2. Enter correct email and password
3. Click "Sign in"
4. Expected: Redirect to portal home
5. Verify: Session persists across page refreshes

Test invalid credentials:
1. Enter wrong password
2. Expected: Error message "Invalid email or password"
3. Enter non-existent email
4. Expected: Same error message (security best practice)
```

### Test 3: Session Management ✅

```
1. Login to patient portal
2. Navigate through pages:
   - /patient/home
   - /patient/intake
   - /patient/prescriptions
   - /patient/diagnostics
   - /patient/specialists
3. Verify: No logout, session persists
4. Close browser and reopen
5. Navigate to /patient/home
6. Expected: Still logged in (if session not expired)
```

### Test 4: Protected Routes ✅

```
Test unauthorized access:
1. Logout or open incognito window
2. Try to access: /patient/home
3. Expected: Redirect to /auth/patient/login

Test cross-role access (if implemented):
1. Login as Patient
2. Try to access: /gp
3. Expected: Redirect or access denied

Repeat for all protected routes:
- /patient/* (requires patient auth)
- /gp (requires GP auth)
- /specialist (requires specialist auth)
- /pharmacy/* (requires pharmacy auth)
- /diagnostics/* (requires diagnostics auth)
```

### Test 5: Password Requirements ✅

```
Test password strength validation:
1. Go to signup page
2. Try passwords:
   - "12345" → Should fail (too short)
   - "password" → Should warn (weak, but might accept)
   - "Password123!" → Should accept (strong)
   - "P@ssw0rd" → Should accept (meets requirements)

If password reset is implemented:
1. Click "Forgot password?"
2. Enter email address
3. Check for reset email
4. Click reset link
5. Set new password
6. Login with new password
```

### Test 6: Portal-Specific Features ✅

#### Patient Portal
- [ ] Home page loads
- [ ] Intake form works
- [ ] Prescriptions list displays
- [ ] QR codes generate correctly
- [ ] Diagnostics page loads
- [ ] Specialists list displays

#### GP Portal
- [ ] Dashboard loads
- [ ] Patient list (if available)
- [ ] Appointment scheduling (if available)

#### Specialist Portal
- [ ] Dashboard loads
- [ ] Referral management (if available)

#### Pharmacy Portal
- [ ] Scanner page loads
- [ ] QR code scanning works
- [ ] Prescription fulfillment flow

#### Diagnostics Portal
- [ ] Orders page loads
- [ ] Order management works

---

## 3. Load Testing (100+ Users)

### Option A: Artillery (Recommended)

**Install:**
```bash
npm install -g artillery
```

**Create test config** (`load-test.yml`):
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up to 50 users/sec"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load - 100 users/sec"
    - duration: 60
      arrivalRate: 20
      name: "Cool down"
  processor: "./artillery-helpers.js"

scenarios:
  - name: "User Signup and Login"
    flow:
      - post:
          url: "/api/auth/signup"
          json:
            email: "loadtest-{{ $randomString() }}@example.com"
            password: "LoadTest123!"
            name: "Load Test User"
      - think: 2
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ email }}"
            password: "LoadTest123!"
      - think: 3
      - get:
          url: "/patient/home"
```

**Run test:**
```bash
artillery run load-test.yml
```

**Success criteria:**
- ✅ Response times < 2000ms (p95)
- ✅ Error rate < 1%
- ✅ Database connections stable
- ✅ No memory leaks

### Option B: K6

**Install:**
```bash
# Windows (via Chocolatey)
choco install k6

# Or download from: https://k6.io/
```

**Create test script** (`load-test.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  // Test signup
  let signupRes = http.post('http://localhost:3000/api/auth/signup', JSON.stringify({
    email: `loadtest-${__VU}-${__ITER}@example.com`,
    password: 'LoadTest123!',
    name: 'Load Test User',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(signupRes, {
    'signup status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test login
  let loginRes = http.post('http://localhost:3000/api/auth/login', JSON.stringify({
    email: `loadtest-${__VU}-${__ITER}@example.com`,
    password: 'LoadTest123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  sleep(2);

  // Test patient home
  let homeRes = http.get('http://localhost:3000/patient/home');
  check(homeRes, {
    'home page loads': (r) => r.status === 200,
  });

  sleep(1);
}
```

**Run test:**
```bash
k6 run load-test.js
```

### Monitoring During Load Test

**Watch server resources:**
```powershell
# Terminal 1: Run load test
artillery run load-test.yml

# Terminal 2: Monitor Node.js process
while ($true) {
  Get-Process -Name node | Select-Object CPU, WorkingSet, Handles | Format-Table
  Start-Sleep -Seconds 5
}
```

**Check for issues:**
- Memory leaks (WorkingSet keeps increasing)
- CPU maxing out at 100%
- Database connection pool exhaustion
- Response time degradation

---

## 4. Security Testing

### Test 1: SQL Injection Protection ✅
```
Try malicious inputs in login:
Email: admin'--
Password: anything

Email: ' OR '1'='1
Password: ' OR '1'='1

Expected: All rejected, no database errors exposed
```

### Test 2: XSS Protection ✅
```
Try XSS in signup:
Name: <script>alert('XSS')</script>
Email: test@example.com

Expected: Script not executed, sanitized on display
```

### Test 3: CSRF Protection ✅
```
Better Auth has built-in CSRF protection.
Test by:
1. Login to patient portal
2. Try to submit form from different origin
3. Expected: Request blocked
```

### Test 4: Rate Limiting ✅
```
Test login rate limiting:
1. Make 10+ failed login attempts rapidly
2. Expected: "Too many attempts, try again later"

If not implemented yet:
- Add express-rate-limit or similar
- Configure in auth middleware
```

### Test 5: Session Security ✅
```
Check session cookies:
1. Login
2. Open DevTools → Application → Cookies
3. Verify session cookie has:
   - HttpOnly flag (prevents XSS)
   - Secure flag (HTTPS only in production)
   - SameSite flag (prevents CSRF)
```

---

## 5. Performance Testing

### Page Load Times ✅
```
Use Chrome DevTools → Network tab

Target metrics (production):
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.0s
- Total page load: < 3.0s

Test pages:
- Home page (/)
- Login pages (/auth/*/login)
- Patient home (/patient/home)
- Prescriptions (/patient/prescriptions)
```

### Database Query Performance ✅
```
If using PostgreSQL:
1. Enable query logging
2. Login and navigate through portal
3. Check logs for slow queries (> 100ms)

If using SQLite:
- Run EXPLAIN QUERY PLAN on critical queries
- Add indexes where needed
```

### Bundle Size Analysis ✅
```bash
# Install bundle analyzer
npm install @next/bundle-analyzer

# Update next.config.js
# Run build with analysis
npm run build

# Check JavaScript bundle size
# Target: < 200KB initial bundle (gzipped)
```

---

## 6. Browser Compatibility

### Desktop Browsers ✅
Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest, Mac/iOS)

### Mobile Browsers ✅
Test in:
- [ ] Chrome (Android)
- [ ] Safari (iOS)
- [ ] Samsung Internet

### Responsive Design ✅
Test viewport sizes:
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1024px+)

---

## 7. Production Checklist

### Before Launch ✅
- [ ] All tests passed
- [ ] Load test with 100+ concurrent users successful
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] Monitoring/logging active
- [ ] Error tracking configured
- [ ] SSL certificate installed (HTTPS)
- [ ] Domain configured
- [ ] Email delivery tested
- [ ] Support team trained

### Day 1 Monitoring ✅
- [ ] Watch error rates
- [ ] Monitor response times
- [ ] Check database performance
- [ ] Verify signup flow
- [ ] Monitor user feedback
- [ ] Be ready for rapid response

---

## 8. Automated Testing Script

Save as `scripts/test-production.js`:

```javascript
const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testSignupAndLogin() {
  console.log('🧪 Testing Signup and Login...\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Test Signup
    console.log('📝 Testing signup...');
    const signupRes = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
    });
    console.log('✅ Signup successful:', signupRes.status);

    // Test Login
    console.log('🔐 Testing login...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword,
    });
    console.log('✅ Login successful:', loginRes.status);

    // Test Protected Route
    console.log('🛡️  Testing protected route...');
    const homeRes = await axios.get(`${BASE_URL}/patient/home`, {
      headers: {
        Cookie: loginRes.headers['set-cookie'],
      },
    });
    console.log('✅ Protected route accessible:', homeRes.status);

    console.log('\n🎉 All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSignupAndLogin();
```

**Run:**
```bash
npm install axios
node scripts/test-production.js
```

---

## 9. Success Criteria Summary

### Must Pass:
✅ All signup flows work for 5 portal types  
✅ Login works with created accounts  
✅ Sessions persist correctly  
✅ Protected routes redirect unauthorized users  
✅ 100+ concurrent users handled without errors  
✅ Response times < 2s (95th percentile)  
✅ Error rate < 1%  
✅ No critical security vulnerabilities  
✅ Works in major browsers (Chrome, Firefox, Safari, Edge)  

### Nice to Have:
🎯 Email verification working  
🎯 Password reset flow working  
🎯 Rate limiting active  
🎯 Monitoring/logging configured  
🎯 Performance optimized (< 1.5s page load)  

---

**Next Steps After Testing:**
1. Fix any failures identified
2. Re-run tests until all pass
3. Deploy to staging environment
4. Repeat tests on staging
5. Deploy to production
6. Monitor closely for first 24-48 hours

**Need Help?**
- Check logs: `npm run logs` or hosting provider dashboard
- Review: `PRODUCTION_READINESS.md`
- Better Auth docs: https://better-auth.com/docs
