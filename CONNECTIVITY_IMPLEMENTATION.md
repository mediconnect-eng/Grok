# Real-Time Portal Connectivity Implementation
**Started:** October 14, 2025
**Estimated Time:** 18 hours
**Status:** IN PROGRESS

## Phase 1: Consultation Booking System (4 hours) ⏳ CURRENT

### 1.1 Database Schema ✅
- [x] consultations table
- [x] consultation_messages table
- [x] consultation_status enum

### 1.2 Patient Side (1.5 hours)
- [ ] Consultation request form (symptoms, urgency, preferred time)
- [ ] Active consultations list
- [ ] Consultation detail page with chat
- [ ] File upload for medical images
- [ ] API: POST /api/consultations/create
- [ ] API: GET /api/consultations/patient
- [ ] API: POST /api/consultations/[id]/message

### 1.3 GP/Specialist Side (1.5 hours)
- [ ] Incoming consultation requests dashboard
- [ ] Accept/Decline consultation
- [ ] Consultation detail page with patient history
- [ ] Chat interface
- [ ] Prescription creation from consultation
- [ ] Referral creation from consultation
- [ ] API: GET /api/consultations/provider
- [ ] API: POST /api/consultations/[id]/accept
- [ ] API: POST /api/consultations/[id]/complete

### 1.4 Real-Time Updates (1 hour)
- [ ] Polling mechanism for new messages
- [ ] Notification badge for new consultations
- [ ] Status change notifications

---

## Phase 2: Prescription System (3 hours)

### 2.1 Database Schema ✅
- [x] prescriptions table (already exists)
- [x] prescription_items table
- [x] prescription_status enum

### 2.2 Doctor Side (1 hour)
- [ ] Create prescription form (multiple medications)
- [ ] Medication search/autocomplete
- [ ] Dosage and instructions builder
- [ ] Send to pharmacy selection
- [ ] API: POST /api/prescriptions/create
- [ ] API: GET /api/prescriptions/doctor

### 2.3 Patient Side (1 hour)
- [ ] View prescriptions (active/completed)
- [ ] Prescription detail page
- [ ] Download prescription PDF
- [ ] Track fulfillment status
- [ ] API: GET /api/prescriptions/patient
- [ ] API: GET /api/prescriptions/[id]/pdf

### 2.4 Pharmacy Side (1 hour)
- [ ] Incoming prescriptions dashboard
- [ ] Scan QR code to pull prescription
- [ ] Mark items as fulfilled
- [ ] Update delivery status
- [ ] API: GET /api/prescriptions/pharmacy
- [ ] API: POST /api/prescriptions/[id]/fulfill
- [ ] API: POST /api/prescriptions/[id]/scan

---

## Phase 3: Referral System (2 hours)

### 3.1 Database Schema
- [ ] referrals table
- [ ] referral_status enum

### 3.2 GP Side (1 hour)
- [ ] Create referral form
- [ ] Select specialist by type
- [ ] Add referral notes
- [ ] API: POST /api/referrals/create
- [ ] API: GET /api/referrals/gp

### 3.3 Specialist Side (1 hour)
- [ ] Incoming referrals dashboard
- [ ] Accept/Decline referral
- [ ] View patient history
- [ ] Create consultation from referral
- [ ] API: GET /api/referrals/specialist
- [ ] API: POST /api/referrals/[id]/accept

---

## Phase 4: Diagnostic Test Orders (2 hours)

### 4.1 Database Schema
- [ ] diagnostic_orders table
- [ ] diagnostic_tests table
- [ ] order_status enum

### 4.2 Doctor Side (1 hour)
- [ ] Order diagnostic tests form
- [ ] Test selection (blood, xray, etc.)
- [ ] Select diagnostic center
- [ ] Special instructions
- [ ] API: POST /api/diagnostics/order
- [ ] API: GET /api/diagnostics/doctor

### 4.3 Diagnostics Center Side (1 hour)
- [ ] Incoming orders dashboard
- [ ] Schedule appointment
- [ ] Upload test results (PDF/images)
- [ ] Mark as completed
- [ ] API: GET /api/diagnostics/center
- [ ] API: POST /api/diagnostics/[id]/schedule
- [ ] API: POST /api/diagnostics/[id]/upload-results

---

## Phase 5: Real-Time Notifications (3 hours)

### 5.1 Database Schema
- [ ] notifications table
- [ ] notification_types enum

### 5.2 Notification System (2 hours)
- [ ] Notification creation utility
- [ ] Notification polling endpoint
- [ ] Notification badge component
- [ ] Notification dropdown
- [ ] Mark as read functionality
- [ ] API: GET /api/notifications
- [ ] API: POST /api/notifications/[id]/read

### 5.3 Trigger Points (1 hour)
- [ ] New consultation request → GP notification
- [ ] Consultation accepted → Patient notification
- [ ] New prescription → Patient + Pharmacy notification
- [ ] Prescription fulfilled → Patient notification
- [ ] New referral → Specialist notification
- [ ] Diagnostic order → Diagnostics center notification
- [ ] Test results ready → Patient + Doctor notification

---

## Phase 6: Payment Integration (4 hours)

### 6.1 Database Schema
- [ ] payments table
- [ ] payment_status enum
- [ ] transaction_log table

### 6.2 Payment Processing (2 hours)
- [ ] Stripe integration setup
- [ ] Payment intent creation
- [ ] Checkout page
- [ ] Payment confirmation
- [ ] Refund handling
- [ ] API: POST /api/payments/create-intent
- [ ] API: POST /api/payments/confirm
- [ ] API: POST /api/payments/refund

### 6.3 Portal Integration (2 hours)
- [ ] Consultation fee payment before booking
- [ ] Prescription payment on fulfillment
- [ ] Diagnostic test prepayment
- [ ] Payment history page
- [ ] Invoice generation

---

## Testing Checklist

### End-to-End Flow Testing
- [ ] **Patient → GP Flow**
  - [ ] Patient creates consultation request
  - [ ] GP sees request in dashboard
  - [ ] GP accepts consultation
  - [ ] Both can chat in real-time
  - [ ] GP creates prescription
  - [ ] Patient sees prescription immediately

- [ ] **GP → Specialist Flow**
  - [ ] GP creates referral
  - [ ] Specialist sees referral
  - [ ] Specialist accepts and creates consultation
  - [ ] Specialist completes consultation

- [ ] **Doctor → Pharmacy Flow**
  - [ ] Doctor creates prescription
  - [ ] Pharmacy sees incoming prescription
  - [ ] Pharmacy scans QR code
  - [ ] Pharmacy fulfills prescription
  - [ ] Patient sees status update

- [ ] **Doctor → Diagnostics Flow**
  - [ ] Doctor orders tests
  - [ ] Diagnostics center sees order
  - [ ] Center uploads results
  - [ ] Doctor sees results
  - [ ] Patient sees results

---

## Progress Tracking

**Phase 1:** ⏳ Starting now (4 hours)
**Phase 2:** ⏸️ Pending (3 hours)
**Phase 3:** ⏸️ Pending (2 hours)
**Phase 4:** ⏸️ Pending (2 hours)
**Phase 5:** ⏸️ Pending (3 hours)
**Phase 6:** ⏸️ Pending (4 hours)

**Total Progress:** 0% (0/18 hours)
**Estimated Completion:** October 15, 2025

---

## Files to Create/Modify

### New Database Migrations
- migrations/003_consultations_system.sql
- migrations/004_referrals_diagnostics.sql
- migrations/005_notifications_payments.sql

### New API Endpoints (32 endpoints)
- Consultations: 8 endpoints
- Prescriptions: 6 endpoints
- Referrals: 4 endpoints
- Diagnostics: 6 endpoints
- Notifications: 4 endpoints
- Payments: 4 endpoints

### Modified Portal Pages (15 pages)
- Patient: 5 pages (home, consultations, prescriptions, diagnostics, notifications)
- GP: 4 pages (dashboard, consultations, prescriptions, referrals)
- Specialist: 3 pages (dashboard, consultations, referrals)
- Pharmacy: 2 pages (dashboard, scanner)
- Diagnostics: 1 page (dashboard)

---

## Success Criteria

✅ Patient can book consultation → GP sees it within 5 seconds
✅ GP creates prescription → Patient + Pharmacy see it immediately
✅ GP refers to specialist → Specialist receives notification
✅ Doctor orders test → Diagnostics center gets order
✅ All actions have real-time notifications
✅ Payment flows work end-to-end
✅ No placeholder data - everything is real and connected

**LET'S BUILD THIS! 🚀**
