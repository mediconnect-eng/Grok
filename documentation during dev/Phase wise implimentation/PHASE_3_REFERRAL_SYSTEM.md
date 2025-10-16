# Phase 3: Referral System - COMPLETED ✅

## Overview
Implemented a complete referral system enabling GPs to refer patients to specialists, with specialists able to accept/decline referrals and automatically create consultations.

## Completion Date
October 14, 2025

---

## 🎯 Features Implemented

### 1. Database Schema
**Already existed from migration 003:**
- `referrals` table with columns:
  - `id`, `patient_id`, `referring_provider_id`, `specialist_id`
  - `consultation_id`, `specialization`, `reason`, `medical_history`
  - `urgency`, `status`, `attachments`
  - Timestamps: `created_at`, `accepted_at`, `completed_at`, `updated_at`
- Indexes on: `patient_id`, `referring_provider_id`, `specialist_id`, `status`
- Status values: `pending`, `accepted`, `declined`, `completed`, `cancelled`

### 2. API Endpoints ✅

#### **POST /api/referrals/create**
**Purpose:** GP creates a new referral to specialists

**Parameters:**
- `consultationId` - Source consultation
- `patientId` - Patient being referred
- `referringProviderId` - GP making the referral
- `specialization` - Required specialist type
- `reason` - Why referral is needed
- `medicalHistory` - Relevant medical context
- `urgency` - routine | urgent | emergency

**Flow:**
1. Validates consultation exists and belongs to patient
2. Finds available specialists by specialization
3. Creates referral record (status: 'pending')
4. Notifies ALL matching specialists
5. Notifies patient about referral
6. Returns referral details + specialist count

**Example Response:**
```json
{
  "success": true,
  "referral": {
    "id": "ref_123...",
    "specialization": "Cardiology",
    "availableSpecialistsCount": 3,
    "availableSpecialists": [...]
  }
}
```

---

#### **POST /api/referrals/[id]/action**
**Purpose:** Specialist accepts or declines a referral

**Parameters:**
- `action` - "accept" or "decline"
- `specialistId` - Specialist taking action
- `notes` - Optional notes (especially for decline)

**Accept Flow:**
1. Updates referral status to 'accepted'
2. Assigns specialist_id
3. Creates NEW consultation for specialist
4. Links consultation to referral
5. Notifies patient: "Dr. X accepted your referral"
6. Notifies referring GP: "Dr. X accepted your referral"
7. Returns consultation details

**Decline Flow:**
1. Updates referral status to 'declined'
2. Notifies GP about decline (with notes if provided)
3. Other specialists can still accept (referral remains searchable)

**Example Response (Accept):**
```json
{
  "success": true,
  "message": "Referral accepted and consultation created",
  "referral": {
    "id": "ref_123",
    "status": "accepted",
    "specialist_id": "spec_456",
    "specialist_name": "Dr. Smith"
  },
  "consultation": {
    "id": "consult_789",
    "patient_id": "pat_101",
    "provider_id": "spec_456",
    "status": "accepted"
  }
}
```

---

#### **GET /api/referrals/specialist**
**Purpose:** Fetch referrals for a specialist

**Query Parameters:**
- `specialistId` - Specialist's user ID
- `status` - Filter by status (default: 'pending')

**Special Logic:**
- **Pending referrals**: Shows ALL pending referrals matching specialist's specialization
- **Accepted/Declined**: Shows only referrals where this specialist took action

**Returns:**
- Referral details with patient info
- Referring GP information
- Patient medical profile (conditions, allergies, medications, blood type)
- Original consultation details (if available)
- Medical history from GP

---

#### **GET /api/referrals/gp**
**Purpose:** Fetch referrals created by a GP

**Query Parameters:**
- `gpId` - GP's user ID
- `status` - Optional filter

**Returns:**
- All referrals created by this GP
- Patient information
- Specialist information (if accepted)
- Status counts (pending, accepted, declined, completed, cancelled)

---

### 3. GP Interface ✅

#### **Consultation Detail Page** (`/gp/consultations/[id]`)
**New Features:**
- "Refer to Specialist" button in actions sidebar
- Modal form with:
  - Specialization dropdown (11 specializations)
  - Urgency selector (routine/urgent/emergency)
  - Reason textarea (required)
  - Medical history textarea (pre-filled with consultation data)
- Real-time validation
- Success feedback with specialist count
- Auto-refresh after creation

**Available Specializations:**
- Cardiology
- Dermatology
- Endocrinology
- Gastroenterology
- Neurology
- Oncology
- Orthopedics
- Psychiatry
- Pulmonology
- Rheumatology
- Urology

**UI Components:**
- Patient information card
- Consultation details (complaint, symptoms, diagnosis, treatment plan)
- Status tracking
- Action buttons: Create Prescription, Refer to Specialist, Complete Consultation

---

### 4. Specialist Interface ✅

#### **Referrals Dashboard** (`/specialist/referrals`)
**Features:**
- Tab-based filtering: Pending | Accepted | Declined
- Real-time polling (10-second intervals)
- Comprehensive referral cards showing:
  - Patient name with urgency and specialization badges
  - Referring GP name and date
  - Reason for referral
  - Medical history from GP
  - Patient medical profile (conditions, allergies, medications)
  - Original consultation details (complaint, symptoms, diagnosis)
  - Patient contact information

**Actions:**
- **Accept Button**: Creates consultation immediately, redirects to consultation page
- **Decline Button**: Opens modal for optional decline reason
- Visual feedback during action processing
- Auto-refresh after actions

**Empty States:**
- Pending: "New referrals will appear here..."
- Accepted/Declined: "You have no [status] referrals."

---

## 🔄 Referral Workflow

### Complete Flow Example:

1. **GP Creates Referral**
   - GP views patient consultation
   - Clicks "Refer to Specialist"
   - Selects "Cardiology" + writes reason
   - Submits form

2. **System Processing**
   - Finds 3 cardiologists in system
   - Creates referral record (status: pending)
   - Sends notifications to all 3 cardiologists
   - Notifies patient about referral

3. **Specialist Notification**
   - All 3 cardiologists receive notification
   - Notification says: "Dr. [GP] has referred [Patient] to you for Cardiology"
   - Click notification → goes to /specialist/referrals

4. **Specialist Reviews**
   - Sees referral in "Pending" tab
   - Reviews:
     - Patient medical profile
     - GP's referral reason
     - Original consultation details
     - Medical history

5. **Specialist Accepts**
   - Clicks "Accept" button
   - System creates new consultation
   - Updates referral status to 'accepted'
   - Assigns specialist_id to referral
   - Redirects to consultation page

6. **Notifications Sent**
   - **Patient**: "Dr. [Specialist] has accepted your referral for Cardiology"
   - **Referring GP**: "Dr. [Specialist] has accepted your referral of [Patient]"

7. **Consultation Begins**
   - Specialist can now manage the consultation
   - Patient sees new consultation in their dashboard
   - GP can track referral status

### Alternative: Specialist Declines

5. **Specialist Declines** (Alternative)
   - Clicks "Decline" button
   - Optionally adds reason
   - System updates referral (still pending for other specialists)

6. **GP Notified**
   - "Dr. [Specialist] has declined the referral of [Patient]"
   - "Other specialists may still accept this referral"

7. **Other Specialists Can Still Accept**
   - Referral remains visible to other cardiologists
   - First to accept gets the consultation

---

## 📁 Files Created

### API Routes
1. `src/app/api/referrals/create/route.ts` (172 lines)
2. `src/app/api/referrals/[id]/action/route.ts` (213 lines)
3. `src/app/api/referrals/specialist/route.ts` (133 lines)
4. `src/app/api/referrals/gp/route.ts` (108 lines)

### UI Pages
1. `src/app/gp/consultations/[id]/page.tsx` (449 lines)
   - Complete consultation detail page with referral form
2. `src/app/specialist/referrals/page.tsx` (437 lines)
   - Specialist referrals dashboard with accept/decline

**Total New Code:** ~1,512 lines

---

## 🔐 Security & Validation

### Input Validation
- ✅ Required fields enforced
- ✅ Consultation ownership verified
- ✅ Specialist existence checked
- ✅ Action validation (accept/decline only)
- ✅ Status checks (can only act on pending referrals)

### Authorization
- ✅ GP can only create referrals for their consultations
- ✅ Specialist can only act on referrals for their specialization
- ✅ Patients cannot directly create referrals
- ✅ Session validation on all endpoints

### Data Integrity
- ✅ Transaction-based operations (BEGIN/COMMIT/ROLLBACK)
- ✅ Referrals link to consultations
- ✅ Consultation created atomically with referral acceptance
- ✅ Notifications sent within same transaction

---

## 📊 Notification Strategy

### Who Gets Notified When

| Event | Patient | Referring GP | Specialist |
|-------|---------|--------------|------------|
| **Referral Created** | ✅ "Referred to [spec]" | - | ✅ All matching (N notifications) |
| **Referral Accepted** | ✅ "Dr. X accepted" | ✅ "Dr. X accepted" | - |
| **Referral Declined** | - | ✅ "Dr. X declined" | - |

### Notification Details

**To Specialists (on creation):**
```
Title: "New Referral Request"
Message: "Dr. [GP] has referred [Patient] to you for [Specialization]. Reason: [First 100 chars]..."
Link: "/specialist/referrals"
```

**To Patient (on creation):**
```
Title: "Referral Created"
Message: "Dr. [GP] has referred you to a [Specialization] specialist. You will be notified when a specialist accepts."
Link: "/patient/consultations"
```

**To Patient (on acceptance):**
```
Title: "Referral Accepted"
Message: "Dr. [Specialist] has accepted your referral for [Specialization]. A consultation has been scheduled."
Link: "/patient/consultations/[id]"
```

**To GP (on acceptance):**
```
Title: "Referral Accepted"
Message: "Dr. [Specialist] has accepted your referral of [Patient] for [Specialization]."
Link: "/gp/consultations/[id]"
```

**To GP (on decline):**
```
Title: "Referral Declined"
Message: "Dr. [Specialist] has declined the referral of [Patient]. [Notes if provided]. Other specialists may still accept."
Link: "/gp/consultations"
```

---

## 🧪 Testing Checklist

### GP Side
- [ ] Open accepted consultation
- [ ] Click "Refer to Specialist"
- [ ] Select specialization
- [ ] Fill reason and medical history
- [ ] Submit form
- [ ] Verify success message with specialist count
- [ ] Check notifications

### Specialist Side
- [ ] Check notifications for new referral
- [ ] Open referrals dashboard
- [ ] View pending referrals
- [ ] Review patient medical profile
- [ ] Review original consultation
- [ ] Accept referral
- [ ] Verify consultation created
- [ ] Verify redirection to consultation page

### Decline Flow
- [ ] Specialist declines with notes
- [ ] GP receives notification
- [ ] Referral still visible to other specialists
- [ ] Another specialist can accept

### Edge Cases
- [ ] Referral with no matching specialists
- [ ] Multiple specialists accept same referral (should prevent)
- [ ] Referral for completed consultation
- [ ] Invalid specialization
- [ ] Missing required fields

---

## 🚀 Future Enhancements

### Priority 1 (Next Sprint)
- [ ] Add referral tracking to GP dashboard
- [ ] Patient view of referrals (see which specialist accepted)
- [ ] Referral status updates (in_progress, completed)
- [ ] Specialist ratings/reviews for referral targeting

### Priority 2
- [ ] Attachments support (test results, images)
- [ ] Direct specialist selection (GP chooses specific specialist)
- [ ] Referral templates for common scenarios
- [ ] Urgent referral fast-track
- [ ] Referral expiration (auto-cancel after X days)

### Priority 3
- [ ] Insurance approval workflow
- [ ] Referral analytics (acceptance rates by specialist)
- [ ] Multi-specialist referrals (refer to multiple specializations)
- [ ] Referral history in patient profile
- [ ] Export referral as PDF

---

## 📈 Metrics to Track

### Volume Metrics
- Referrals created per GP per day
- Average referrals per patient
- Most requested specializations

### Performance Metrics
- Average time to specialist acceptance
- Acceptance rate by specialization
- Decline rate and reasons

### Quality Metrics
- Consultation completion rate after referral
- Patient satisfaction with referred specialists
- GP satisfaction with referral process

---

## ✅ Phase 3 Status: COMPLETE

**Time Spent:** ~2 hours
**APIs Created:** 4
**UI Pages Created:** 2
**Total Lines of Code:** ~1,512

### Ready for Phase 4: Diagnostic Orders System

---

**Next Steps:**
1. Test referral flow end-to-end
2. Add referral tracking to GP consultations page
3. Begin Phase 4: Diagnostic Orders (Lab tests, imaging, etc.)
