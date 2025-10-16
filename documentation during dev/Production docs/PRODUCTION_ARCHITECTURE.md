# 🏥 MediConnect Production Architecture

**Type:** REAL HEALTHCARE PLATFORM  
**Users:** 100+ real patients + healthcare partners  
**NOT a demo - This is production healthcare**

---

## 🎯 Core Understanding

### Real Users
- **Patients**: Real people signing up for healthcare services
- **Doctors (GPs & Specialists)**: Licensed healthcare professionals
- **Pharmacies**: Real licensed pharmacy partners
- **Diagnostic Centers**: Real lab partners

### NOT Demo Accounts
- ❌ No hardcoded test accounts in production
- ❌ No "demo@mediconnect.com" for real users
- ✅ Real registration with email verification
- ✅ Partner verification and approval process
- ✅ Separate demo environment for testing/showing

---

## 🔐 User System Architecture

### 1. Patient Registration (Public)

**Flow:**
```
1. Patient visits landing page
2. Clicks "Sign Up" 
3. Fills registration form:
   - Full name
   - Email
   - Phone number
   - Date of birth
   - Password (12+ chars, secure)
4. Email verification sent
5. Patient verifies email
6. Account activated → Can book consultations
```

**No manual approval needed** - Patients can register freely

### 2. Healthcare Partner Registration (Verified)

**Flow for Doctors:**
```
1. Doctor clicks "Join as Healthcare Provider"
2. Fills detailed application:
   - Medical license number
   - Specialization
   - Qualifications
   - Hospital affiliation
   - Practice location
   - Upload license documents
3. Application submitted → Status: PENDING
4. Admin reviews credentials
5. Admin approves → Email sent
6. Doctor can login and see patients
```

**Flow for Pharmacy/Diagnostics:**
```
1. Pharmacy/Lab clicks "Become a Partner"
2. Fills business application:
   - Business name
   - License/registration number
   - Owner details
   - Location
   - Operating hours
   - Upload license documents
3. Application submitted → Status: PENDING
4. Admin reviews
5. Admin approves → Partner activated
6. Can receive prescriptions/orders
```

**Manual approval required** - Admin verifies all healthcare partners

### 3. Admin Users (Internal)

**Created manually by system owner:**
- Super admin account (yours)
- Support staff accounts
- Can approve partners
- Can manage platform

---

## 📁 Database Schema (PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMP,
  reset_token TEXT,
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Patient Profiles
```sql
CREATE TABLE patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  blood_group VARCHAR(5),
  address TEXT,
  emergency_contact VARCHAR(20),
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Healthcare Provider Profiles
```sql
CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_type VARCHAR(20) NOT NULL, -- 'gp', 'specialist'
  license_number VARCHAR(100) UNIQUE NOT NULL,
  specialization VARCHAR(100),
  qualifications TEXT,
  experience_years INTEGER,
  hospital_affiliation VARCHAR(255),
  practice_location TEXT,
  consultation_fee DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'suspended'
  license_document_url TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Partner Profiles (Pharmacy/Diagnostics)
```sql
CREATE TABLE partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner_type VARCHAR(20) NOT NULL, -- 'pharmacy', 'diagnostics'
  business_name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  operating_hours JSONB,
  services_offered TEXT[],
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'suspended'
  license_document_url TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Implementation Priority

### Phase 1: Real User Registration (Now)
1. ✅ Remove demo account seeding from production
2. ⏳ Create patient registration flow
3. ⏳ Add email verification system
4. ⏳ Update login to use real accounts only

### Phase 2: Partner Onboarding (Next)
1. ⏳ Create provider application form
2. ⏳ Create partner application form
3. ⏳ Build admin approval dashboard
4. ⏳ Email notifications for approvals

### Phase 3: Separate Demo Environment (Later)
1. ⏳ Create demo.mediconnect.com subdomain
2. ⏳ Demo accounts ONLY on demo subdomain
3. ⏳ Production = No demo accounts ever

---

## 🔒 Security Rules

### Production Environment
- ✅ All users registered through signup forms
- ✅ Email verification required
- ✅ Healthcare partners verified manually
- ✅ No hardcoded credentials
- ✅ Real passwords, real emails

### Demo Environment (Separate)
- Only for showing features to prospects
- Reset daily
- Clearly labeled "DEMO - Not Real Data"
- Separate database
- Public demo credentials OK here

---

## 📧 Email Verification Flow

### Patient Registration
```
1. User signs up
2. System generates verification token
3. Send email: "Welcome! Verify your email"
   Link: https://mediconnect.com/verify?token=abc123
4. User clicks link
5. Token validated
6. Account activated
7. Redirect to onboarding (age, language, terms)
8. Profile complete → Can use app
```

### Provider Approval
```
1. Doctor applies
2. Admin reviews in dashboard
3. Admin approves
4. Send email: "Application Approved! You can now login"
   Link: https://mediconnect.com/auth/gp/login
5. Doctor logs in
6. Can see patients and consultations
```

---

## 🎨 User Experience

### For Patients
1. **Landing page** → Clear "Sign Up" button
2. **Registration** → Simple form, 2 minutes
3. **Email verification** → Click link
4. **Onboarding** → Age, language preferences, consent
5. **Home** → Book consultation, view prescriptions, etc.

### For Healthcare Providers
1. **Landing page** → "Join as Healthcare Provider"
2. **Application** → Detailed form with document upload
3. **Pending status** → "Under review" message
4. **Approval email** → Can now login
5. **Dashboard** → See patients, consultations, etc.

### For Partners (Pharmacy/Labs)
1. **Landing page** → "Become a Partner"
2. **Application** → Business details + license
3. **Pending status** → "Under review"
4. **Approval email** → Can now login
5. **Dashboard** → Receive orders, fulfill prescriptions

---

## 🛠️ What We Need to Build

### Immediate (Next 2 hours)
1. [ ] Patient registration page (`/auth/patient/signup`)
2. [ ] Email verification system
3. [ ] Email templates (verification, approval, password reset)
4. [ ] Update login to reject unverified emails

### Short-term (Next 4 hours)
1. [ ] Provider application form (`/apply/doctor`)
2. [ ] Partner application form (`/apply/partner`)
3. [ ] Admin dashboard for approvals
4. [ ] Document upload system

### Medium-term (Next week)
1. [ ] Separate demo environment
2. [ ] Partner verification workflow
3. [ ] Advanced onboarding (medical history, etc.)
4. [ ] Partner profile pages

---

## ✅ What's Already Done

- ✅ PostgreSQL database connected
- ✅ Better Auth configured
- ✅ Password validation (12+ chars, secure)
- ✅ Rate limiting on auth endpoints
- ✅ Security headers
- ✅ Session management
- ✅ Health checks

---

## 🎯 Next Action

**RIGHT NOW:** Let me update the system to handle real user registration properly.

We'll:
1. Remove demo account dependency
2. Enable proper patient signup
3. Add email verification
4. Create clear partner application flow

**This is a REAL healthcare platform. Let's build it right.** 🏥

