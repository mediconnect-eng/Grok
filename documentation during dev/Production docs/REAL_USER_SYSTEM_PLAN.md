# 🏥 Real User System Implementation Plan

**Target:** Transform from demo app → Production healthcare platform  
**Timeline:** 6-8 hours of development  
**Result:** 100+ real users can register and use the platform

---

## 📋 Complete Task Breakdown

### PHASE 1: Patient Registration System (2 hours)

#### 1.1 Email System Setup (30 min)
- [ ] Install nodemailer package
- [ ] Create email service (`src/lib/email.ts`)
- [ ] Configure SMTP settings (SendGrid/AWS SES)
- [ ] Create email templates:
  - Welcome email
  - Email verification
  - Password reset
  - Account activated
- [ ] Test email delivery

#### 1.2 Database Schema Updates (20 min)
- [ ] Create migration script
- [ ] Add `email_verifications` table:
  ```sql
  - id, user_id, token, expires_at, created_at
  ```
- [ ] Add fields to `user` table:
  - `email_verified_at`
  - `phone_number`
  - `date_of_birth`
- [ ] Run migration

#### 1.3 Patient Signup Page (40 min)
- [ ] Create `/auth/patient/signup` page
- [ ] Build registration form:
  - Full name
  - Email
  - Phone number
  - Date of birth
  - Password (with strength indicator)
  - Confirm password
  - Terms acceptance
- [ ] Form validation
- [ ] Submit handler
- [ ] Error handling
- [ ] Loading states

#### 1.4 Email Verification Flow (30 min)
- [ ] Generate verification token on signup
- [ ] Send verification email
- [ ] Create `/verify-email` page
- [ ] Token validation endpoint
- [ ] Mark email as verified
- [ ] Redirect to onboarding
- [ ] Resend verification option

### PHASE 2: Provider Application System (3 hours)

#### 2.1 Database Schema for Providers (30 min)
- [ ] Create `provider_applications` table:
  ```sql
  - id, user_id, provider_type, license_number
  - specialization, qualifications, experience_years
  - hospital_affiliation, consultation_fee
  - status, license_document_url
  - verified_by, verified_at, created_at, updated_at
  ```
- [ ] Create `partner_applications` table:
  ```sql
  - id, user_id, partner_type, business_name
  - license_number, owner_name, location
  - operating_hours, services_offered, status
  - license_document_url, verified_by, verified_at
  ```
- [ ] Run migration

#### 2.2 Doctor Application Form (60 min)
- [ ] Create `/apply/doctor` page
- [ ] Build application form:
  - Personal details (name, email, phone)
  - Medical license number
  - Specialization dropdown
  - Qualifications (textarea)
  - Years of experience
  - Hospital affiliation
  - Practice location
  - Consultation fee
  - Upload license document
  - Terms acceptance
- [ ] File upload handling
- [ ] Form validation
- [ ] Submit handler
- [ ] Success/error states

#### 2.3 Partner Application Form (40 min)
- [ ] Create `/apply/partner` page
- [ ] Build application form:
  - Partner type (pharmacy/diagnostics)
  - Business name
  - License/registration number
  - Owner name
  - Location (address)
  - Operating hours (JSON)
  - Services offered (checklist)
  - Upload license document
  - Terms acceptance
- [ ] File upload handling
- [ ] Form validation
- [ ] Submit handler

#### 2.4 Application Status Pages (30 min)
- [ ] Create `/application/pending` page
  - "Under review" message
  - Application details summary
  - Expected review time
  - Contact support option
- [ ] Create `/application/approved` page
  - "Approved!" message
  - Login link
  - Getting started guide
- [ ] Email notifications on status change

### PHASE 3: Admin Approval System (2 hours)

#### 3.1 Admin Dashboard (60 min)
- [ ] Create `/admin` route group
- [ ] Create admin auth guard
- [ ] Build applications list page:
  - Pending applications count
  - Table of applications
  - Filter by type (doctor/pharmacy/diagnostics)
  - Search by name/email
  - Status badges
- [ ] View application details modal
- [ ] Approve/reject actions
- [ ] Notes field for admin comments

#### 3.2 Document Review System (30 min)
- [ ] Display uploaded documents in admin panel
- [ ] Document viewer (PDF/image)
- [ ] Zoom and download options
- [ ] Verification checklist
- [ ] Flag for more information

#### 3.3 Approval Workflow (30 min)
- [ ] Approve endpoint (`/api/admin/approve`)
- [ ] Reject endpoint (`/api/admin/reject`)
- [ ] Update application status
- [ ] Create user account (if approved)
- [ ] Send approval/rejection email
- [ ] Audit log of admin actions

### PHASE 4: Update Existing Features (1 hour)

#### 4.1 Login Updates (20 min)
- [ ] Update login pages to check email verification
- [ ] Show "Email not verified" error
- [ ] Link to resend verification
- [ ] Handle provider status (pending/approved/rejected)
- [ ] Show appropriate messages

#### 4.2 Remove Demo Dependencies (20 min)
- [ ] Remove hardcoded demo credentials from code
- [ ] Update documentation
- [ ] Remove demo seed script from production
- [ ] Create separate demo environment flag

#### 4.3 Onboarding Flow (20 min)
- [ ] Update onboarding to work after email verification
- [ ] Collect additional patient info:
  - Medical history
  - Allergies
  - Current medications
  - Emergency contact
- [ ] Store in patient_profiles table

### PHASE 5: File Upload System (30 min)

#### 5.1 Choose Storage Solution
- [ ] Option A: Cloudinary (free tier)
- [ ] Option B: AWS S3
- [ ] Option C: Local storage (dev only)

#### 5.2 Implement Upload
- [ ] Create upload endpoint (`/api/upload`)
- [ ] File validation (size, type)
- [ ] Generate secure filename
- [ ] Upload to storage
- [ ] Return URL
- [ ] Handle errors

### PHASE 6: Email Templates (30 min)

#### 6.1 Create HTML Email Templates
- [ ] Welcome email (patient)
- [ ] Email verification
- [ ] Email verified confirmation
- [ ] Application received (provider/partner)
- [ ] Application approved
- [ ] Application rejected
- [ ] Password reset
- [ ] Account suspended

#### 6.2 Template Variables
- [ ] User name
- [ ] Verification link
- [ ] Application details
- [ ] Admin notes
- [ ] Support contact

---

## 🗂️ File Structure

```
src/
  lib/
    email.ts                    # Email service
    upload.ts                   # File upload service
  
  app/
    auth/
      patient/
        signup/
          page.tsx              # Patient registration
    
    apply/
      doctor/
        page.tsx                # Doctor application
      partner/
        page.tsx                # Partner application
    
    admin/
      layout.tsx                # Admin layout with guard
      page.tsx                  # Admin dashboard
      applications/
        page.tsx                # Applications list
        [id]/
          page.tsx              # Application detail
    
    application/
      pending/
        page.tsx                # Application pending status
      approved/
        page.tsx                # Application approved
    
    verify-email/
      page.tsx                  # Email verification handler
    
    api/
      signup/
        route.ts                # Patient signup endpoint
      apply/
        doctor/
          route.ts              # Doctor application endpoint
        partner/
          route.ts              # Partner application endpoint
      verify-email/
        route.ts                # Email verification endpoint
      admin/
        applications/
          route.ts              # List applications
        approve/
          route.ts              # Approve application
        reject/
          route.ts              # Reject application
      upload/
        route.ts                # File upload endpoint

emails/
  templates/
    welcome.html
    verify-email.html
    application-received.html
    application-approved.html
    application-rejected.html
    password-reset.html

migrations/
  001_add_email_verification.sql
  002_add_provider_applications.sql
  003_add_partner_applications.sql
```

---

## 🔧 Configuration Needed

### Environment Variables (.env.local)

```env
# Existing
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
PRODUCTION_MODE=false

# New - Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@mediconnect.com
APP_URL=https://mediconnect.com

# New - File Upload
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Or AWS S3
AWS_S3_BUCKET=mediconnect-docs
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# New - Admin
ADMIN_EMAIL=admin@mediconnect.com
```

---

## 📦 New Dependencies

```bash
npm install nodemailer
npm install @types/nodemailer --save-dev
npm install cloudinary  # Or aws-sdk for S3
npm install multer  # For file uploads
npm install @types/multer --save-dev
```

---

## ✅ Testing Checklist

### Patient Registration
- [ ] User can sign up with email
- [ ] Verification email sent
- [ ] Verification link works
- [ ] Email marked as verified
- [ ] Onboarding flow completes
- [ ] Can login after verification
- [ ] Cannot login before verification

### Provider Application
- [ ] Doctor can submit application
- [ ] Pharmacy can submit application
- [ ] Diagnostics can submit application
- [ ] Documents upload successfully
- [ ] Application confirmation email sent
- [ ] Status shows "pending"

### Admin Approval
- [ ] Admin can view all applications
- [ ] Can filter by type and status
- [ ] Can view application details
- [ ] Can view uploaded documents
- [ ] Can approve application
- [ ] Can reject application
- [ ] Approval email sent
- [ ] User can login after approval

### Edge Cases
- [ ] Duplicate email registration blocked
- [ ] Invalid license number rejected
- [ ] File size limits enforced
- [ ] Expired verification tokens handled
- [ ] Rate limiting works
- [ ] SQL injection prevented
- [ ] XSS attacks prevented

---

## 🎯 Success Criteria

After implementation:

✅ **Patients can:**
- Register with email
- Verify email
- Complete onboarding
- Book consultations
- View prescriptions

✅ **Doctors can:**
- Apply with credentials
- Upload license
- Get approved by admin
- Login after approval
- See patients

✅ **Partners can:**
- Apply with business details
- Upload license
- Get approved by admin
- Login after approval
- Receive orders

✅ **Admins can:**
- Review applications
- View documents
- Approve/reject
- Add notes
- Track history

✅ **Demo accounts:**
- Only in separate demo environment
- Not in production database
- Clearly labeled
- Reset regularly

---

## 🚀 Deployment Steps

1. **Database migrations**
   ```bash
   npm run migrate:up
   ```

2. **Environment variables**
   - Add all new variables to hosting platform
   - Test email configuration
   - Test file upload

3. **Build and deploy**
   ```bash
   npm run build
   npm run start
   ```

4. **Create first admin account**
   ```bash
   node scripts/create-admin.js
   ```

5. **Test complete flow**
   - Patient registration
   - Provider application
   - Admin approval
   - Login and use

---

## 📊 Timeline Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | Patient Registration | 2 hours |
| 2 | Provider Applications | 3 hours |
| 3 | Admin Approval System | 2 hours |
| 4 | Update Existing Features | 1 hour |
| 5 | File Upload | 30 min |
| 6 | Email Templates | 30 min |
| **Total** | | **9 hours** |

Add 20% buffer for testing and fixes = **~11 hours total**

---

## 🤔 Your Decision

**Ready to proceed?**

Reply with:
- **"Build it"** - I'll start implementing immediately
- **"Build Phase 1 only"** - Just patient registration first
- **"Show me the code first"** - I'll create code samples
- **"Let me do it"** - I'll provide guidance as you build

**This will transform your app from demo → real healthcare platform.** 🏥

