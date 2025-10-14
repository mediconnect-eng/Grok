# Notification System Testing Checklist

**Local Server Running:** http://localhost:3000  
**Test Date:** October 14, 2025  
**Phase 5 Status:** Integration Complete - Ready for Testing

---

## 🎯 Testing Overview

This checklist verifies the complete notification system including:
- NotificationBell in Header (real-time updates)
- Notification Center page (/notifications)
- All notification types across 4 major systems
- Real-time polling (10-second intervals)
- Mark as read functionality

---

## ✅ Pre-Testing Setup

### 1. Verify Server is Running
- [x] Development server started on http://localhost:3000
- [ ] No TypeScript compilation errors
- [ ] Database connection working

### 2. Demo Accounts Available
You can use these demo accounts or create new ones:

**Patient Account:**
- Email: patient@test.com
- Password: Password123!

**GP/Doctor Account:**
- Email: gp@test.com
- Password: Password123!

**Specialist Account:**
- Email: specialist@test.com
- Password: Password123!

**Pharmacy Account:**
- Email: pharmacy@test.com
- Password: Password123!

**Diagnostic Center Account:**
- Email: diagnostic@test.com
- Password: Password123!

---

## 🔔 Component Testing

### NotificationBell in Header

#### Test 1: Visibility & Conditional Rendering
- [ ] **Not Logged In:** Navigate to homepage - Bell should NOT appear
- [ ] **Logged In (Patient):** Login - Bell should appear in header
- [ ] **Logged In (GP):** Login - Bell should appear in header
- [ ] **Logged In (Specialist):** Login - Bell should appear in header
- [ ] **Logged In (Pharmacy):** Login - Bell should appear in header
- [ ] **Logged In (Diagnostic):** Login - Bell should appear in header

#### Test 2: Bell Functionality
- [ ] **Unread Badge:** Should show red badge with count when notifications exist
- [ ] **Click to Open:** Clicking bell opens dropdown panel
- [ ] **Click Outside:** Clicking outside dropdown closes it
- [ ] **Shows 10 Most Recent:** Dropdown displays up to 10 notifications
- [ ] **"View All" Link:** Links to /notifications page
- [ ] **"Mark All Read" Button:** Marks all notifications as read

#### Test 3: Notification Item in Dropdown
- [ ] **Unread Visual:** Blue background for unread notifications
- [ ] **Read Visual:** White/gray background for read notifications
- [ ] **Icon Display:** Emoji icon shows for notification type
- [ ] **Time Ago:** Shows "Just now", "5m ago", "2h ago", "3d ago"
- [ ] **Click Notification:** Marks as read and navigates to link
- [ ] **Blue Dot Badge:** Shows on unread notifications

---

## 📱 Notification Center Page Testing

### Test 4: Navigation & Layout
- [ ] Navigate to http://localhost:3000/notifications
- [ ] **Page Header:** Shows "Notifications" with unread count
- [ ] **Back Button:** Returns to previous page
- [ ] **Mark All Read Button:** Visible and functional

### Test 5: Filtering
- [ ] **Type Filter:** Dropdown shows all 7 types (All, Consultations, Prescriptions, Referrals, Diagnostic Orders, Payments, System, Account)
- [ ] **Status Filter:** Dropdown shows (All, Unread, Read)
- [ ] **Filter Combination:** Can combine type + status filters
- [ ] **Results Update:** List updates when filters change
- [ ] **Results Summary:** Shows "Showing X of Y notifications"

### Test 6: Notification Cards
- [ ] **Large Icons:** Each card shows appropriate emoji icon
- [ ] **Title with Badge:** Unread notifications show "NEW" badge
- [ ] **Type Badge:** Shows notification type (e.g., "Consultation")
- [ ] **Full Message:** Complete message text displayed
- [ ] **Timestamp:** Shows relative time
- [ ] **Left Border:** Unread notifications have primary color left border
- [ ] **View Details Link:** Links to relevant entity page
- [ ] **Click Card:** Marks notification as read

### Test 7: Empty States
- [ ] **No Notifications:** Shows appropriate empty state message
- [ ] **No Unread:** Shows "No unread notifications" when filtered
- [ ] **No Type Match:** Shows type-specific empty state

---

## 🩺 Consultation Notification Testing

### Test 8: Patient Creates Consultation
**Actions:**
1. Login as patient
2. Navigate to /patient/consultations
3. Click "New Consultation"
4. Fill form (chief complaint, symptoms, urgency)
5. Submit consultation

**Expected Notifications:**
- [ ] **Patient:** "Consultation Requested" - Confirmation message
- [ ] **All Available GPs/Specialists:** "New Consultation Request" with patient name and complaint

### Test 9: Doctor Accepts Consultation
**Actions:**
1. Login as GP/Specialist
2. Navigate to /gp/consultations or /specialist/consultations
3. View pending consultation
4. Click "Accept"

**Expected Notifications:**
- [ ] **Patient:** "Consultation Accepted" - Dr. [Name] has accepted your request
- [ ] Bell badge updates within 10 seconds

---

## 💊 Prescription Notification Testing

### Test 10: Doctor Creates Prescription
**Actions:**
1. Login as GP
2. Navigate to active consultation
3. Create prescription with medications
4. Submit prescription

**Expected Notifications:**
- [ ] **Patient:** "New Prescription" - Dr. [Name] prescribed X medication(s)
- [ ] Notification includes link to prescription details

### Test 11: Patient Assigns Pharmacy
**Actions:**
1. Login as patient
2. Navigate to /patient/prescriptions
3. Select a prescription
4. Click "Select Pharmacy"
5. Choose a pharmacy and confirm

**Expected Notifications:**
- [ ] **Selected Pharmacy:** "New Prescription to Fill" - Patient name
- [ ] Notification links to /pharmacy/prescriptions/[id]

### Test 12: Pharmacy Fulfills Prescription
**Actions:**
1. Login as pharmacy
2. Navigate to /pharmacy/prescriptions
3. View assigned prescription
4. Update status to "Ready" or "Delivered"

**Expected Notifications:**
- [ ] **Patient (Ready):** "Prescription Ready" - Ready for pickup at [Pharmacy]
- [ ] **Patient (Delivered):** "Prescription Delivered" - Delivered by [Pharmacy]

---

## 👨‍⚕️ Referral Notification Testing

### Test 13: GP Creates Referral
**Actions:**
1. Login as GP
2. Navigate to active consultation
3. Create referral (select specialization, add reason)
4. Submit referral

**Expected Notifications:**
- [ ] **Patient:** "Referral Created" - Referred to [Specialization] specialist
- [ ] **All Available Specialists:** "New Referral Request" - From Dr. [GP Name]

### Test 14: Specialist Accepts Referral
**Actions:**
1. Login as specialist
2. Navigate to /specialist/referrals
3. View pending referral
4. Click "Accept"

**Expected Notifications:**
- [ ] **Patient:** "Referral Accepted" - Dr. [Specialist] has accepted your referral
- [ ] **Referring GP:** "Referral Accepted" - Dr. [Specialist] has accepted referral

---

## 🔬 Diagnostic Order Notification Testing

### Test 15: GP Creates Diagnostic Order
**Actions:**
1. Login as GP
2. Navigate to /gp/diagnostics
3. Click "Order New Test"
4. Select patient, test types, add notes
5. Submit order

**Expected Notifications:**
- [ ] **Patient:** "New Diagnostic Test Order" - Dr. [Name] ordered tests
- [ ] **Assigned Diagnostic Center:** "New Test Order" with patient/doctor names
- [ ] **OR All Centers:** If no specific center, all centers notified

### Test 16: Diagnostic Center Schedules Test
**Actions:**
1. Login as diagnostic center
2. Navigate to /diagnostics/orders
3. View pending order
4. Update status to "Scheduled" with date/time

**Expected Notifications:**
- [ ] **Patient:** "Test Scheduled" - Appointment details at [Center]
- [ ] **Ordering Doctor:** "Test Scheduled" - Patient appointment confirmed

### Test 17: Diagnostic Center Completes Test
**Actions:**
1. Login as diagnostic center
2. Update order status to "Completed"
3. Optionally add results URL

**Expected Notifications:**
- [ ] **Patient:** "Test Results Ready" - View results
- [ ] **Ordering Doctor:** "Test Results Available" - View results

### Test 18: Other Status Updates
**Actions:**
1. Update status to "Sample Collected", "In Progress", or "Cancelled"

**Expected Notifications:**
- [ ] **Patient:** Status update message
- [ ] **Ordering Doctor:** Status update message

---

## ⏱️ Real-Time Polling Testing

### Test 19: Multi-Tab Real-Time Updates
**Setup:** Open two browser tabs, login as same user in both

**Actions:**
1. Tab 1: Keep notification bell visible
2. Tab 2: Perform action that creates notification (e.g., create consultation as another user)

**Expected:**
- [ ] **Within 10 seconds:** Bell badge updates in Tab 1
- [ ] **Click Bell:** New notification appears in dropdown
- [ ] **Notification Center:** Auto-refreshes if open

### Test 20: Badge Count Accuracy
**Actions:**
1. Create multiple notifications (3-5)
2. Check bell badge number

**Expected:**
- [ ] **Accurate Count:** Badge shows exact unread count
- [ ] **99+ Display:** If more than 99 unread, shows "99+"
- [ ] **Mark One Read:** Badge decrements by 1
- [ ] **Mark All Read:** Badge disappears

---

## 🎨 Visual & UX Testing

### Test 21: Responsive Design
- [ ] **Desktop (>1024px):** Dropdown aligns right, full width
- [ ] **Tablet (768-1024px):** Dropdown adjusts appropriately
- [ ] **Mobile (<768px):** Dropdown doesn't overflow screen

### Test 22: Icon Display
- [ ] 🩺 Consultation notifications
- [ ] 💊 Prescription notifications
- [ ] 👨‍⚕️ Referral notifications
- [ ] 🔬 Diagnostic order notifications
- [ ] 💳 Payment notifications (if implemented)
- [ ] ⚙️ System notifications
- [ ] 👤 Account notifications

### Test 23: Timestamps
- [ ] **Just now:** <1 minute ago
- [ ] **Xm ago:** 1-59 minutes
- [ ] **Xh ago:** 1-23 hours
- [ ] **Xd ago:** 1-6 days
- [ ] **Full Date:** 7+ days ago

---

## 🔗 Navigation Testing

### Test 24: Notification Links
**Test each notification type links to correct page:**

- [ ] **Consultation:** /patient/consultations/[id] or /gp/consultations/[id]
- [ ] **Prescription:** /patient/prescriptions/[id] or /pharmacy/prescriptions/[id]
- [ ] **Referral:** /patient/referrals/[id] or /specialist/referrals/[id]
- [ ] **Diagnostic Order:** /patient/diagnostics/[id] or /diagnostics/orders/[id]

### Test 25: Mark as Read Behavior
- [ ] **Click Notification:** Marks as read + navigates
- [ ] **Already on Target Page:** Still marks as read
- [ ] **Invalid Link:** Gracefully handles (doesn't break app)

---

## 🐛 Edge Case Testing

### Test 26: No Notifications
- [ ] Bell appears but no badge
- [ ] Dropdown shows "No new notifications"
- [ ] Notification center shows empty state

### Test 27: Large Volume
**Create 20+ notifications:**
- [ ] Bell dropdown shows only 10 most recent
- [ ] Notification center paginates correctly
- [ ] Performance remains smooth
- [ ] Polling doesn't slow down

### Test 28: Network Issues
**Simulate slow/offline:**
- [ ] Notifications queue and retry
- [ ] UI doesn't break during loading
- [ ] Error states handled gracefully

### Test 29: Session Management
- [ ] **Logout:** Bell disappears
- [ ] **Login Different User:** Shows correct notifications
- [ ] **Switch Tabs While Logged Out:** Bell stays hidden

---

## 📊 Database Verification

### Test 30: Check Notifications Table
```sql
SELECT 
  id, 
  user_id, 
  type, 
  title, 
  message, 
  is_read, 
  link, 
  metadata,
  created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 20;
```

**Verify:**
- [ ] All notifications created correctly
- [ ] Metadata stored as valid JSON
- [ ] Links are correct URLs
- [ ] Timestamps accurate
- [ ] is_read updates when marked

---

## 🎯 Integration Summary

### APIs Using Notification Utilities (8 files)

✅ **Consultations:**
- /api/consultations/create - notifyConsultationRequested + provider notifications
- /api/consultations/[id]/action - notifyConsultationAccepted

✅ **Prescriptions:**
- /api/prescriptions/create - notifyPrescriptionCreated
- /api/prescriptions/[id]/fulfill - notifyPrescriptionFilled
- /api/prescriptions/[id]/assign-pharmacy - notifyPharmacyNewPrescription

✅ **Referrals:**
- /api/referrals/create - notifyReferralCreated + notifySpecialistNewReferral
- /api/referrals/[id]/action - notifyReferralAccepted

✅ **Diagnostic Orders:**
- /api/diagnostic-orders/create - notifyDiagnosticOrderCreated + notifyDiagnosticCentersNewOrder
- /api/diagnostic-orders/[id]/update-status - notifyDiagnosticOrderScheduled/Completed/StatusUpdate

---

## 📝 Test Results Template

**Tester:** _________________  
**Date:** October 14, 2025  
**Browser:** _________________  
**Tests Passed:** _____ / 30  
**Critical Issues:** _________________  
**Minor Issues:** _________________  
**Notes:** _________________

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass:**
   - Mark Phase 5 as 100% complete
   - Update PHASE_5_NOTIFICATIONS_SYSTEM.md
   - Create final project summary
   - Consider Phase 6 (Payment Integration)

2. **If Issues Found:**
   - Document specific failures
   - Prioritize critical bugs
   - Fix and re-test
   - Update integration code as needed

3. **Optional Enhancements:**
   - Email notifications
   - SMS notifications
   - Push notifications (PWA)
   - WebSocket for instant updates
   - Notification preferences/settings
   - Notification sounds
   - Desktop notifications API

---

**Happy Testing! 🎉**
