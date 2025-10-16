# Phase 2 Enhancements - Prescription Pharmacy Selection

## ✅ COMPLETED (April 2024)

### Overview
Enhanced the prescription flow to give patients control over pharmacy selection with two options:
1. **Select a Pharmacy** - Choose from onboarded pharmacy partners
2. **Show QR Code** - Visit any verified pharmacy and scan

### Key Changes

#### 1. Database Migration ✅
**File:** `migrations/004_add_qr_token.sql`
- Added `qr_token TEXT UNIQUE` column to prescriptions table
- Created index for fast QR token lookups
- Format: `MCP-{timestamp}-{random}` (e.g., MCP-1729012345-X7K2M9A)
- **Status:** Migration executed successfully

#### 2. API Endpoints ✅

**Modified:** `src/app/api/prescriptions/create/route.ts`
- Generates unique QR token when prescription created
- QR token stored in database with prescription
- Removed automatic pharmacy notification
- Changed patient notification to mention pharmacy selection options

**New:** `src/app/api/prescriptions/[id]/assign-pharmacy/route.ts`
- POST endpoint for patient to assign pharmacy
- Parameters: `pharmacyId`, `patientId`
- Validates prescription ownership
- Updates prescription.pharmacy_id
- Creates notifications for pharmacy and patient
- Returns pharmacy name for confirmation

**New:** `src/app/api/prescriptions/claim-qr/route.ts`
- POST endpoint for pharmacy to scan QR code
- Parameters: `qrToken`, `pharmacyId`
- Finds prescription by qr_token
- Validates not already claimed by different pharmacy
- Idempotent (same pharmacy can claim multiple times)
- Creates notification for patient
- Returns prescription details for pharmacy

**New:** `src/app/api/pharmacies/list/route.ts`
- GET endpoint to fetch available pharmacies
- Queries users WHERE role='pharmacy'
- Joins provider_applications for details
- Returns: id, name, email, phone, address, city, state, zip_code
- Orders alphabetically by name
- **Future:** Will add location-based filtering

#### 3. Patient UI ✅

**Enhanced:** `src/app/patient/prescriptions/[id]/page.tsx`
- Complete rewrite from mock data to API integration
- Fetches prescription from `/api/prescriptions/${id}/fulfill`
- Shows two-option interface:
  - **Select Pharmacy**: Lists all onboarded pharmacies with addresses
  - **Show QR Code**: Displays QR code using react-qr-code library
- Handles pharmacy assignment via API call
- Shows success state when pharmacy assigned
- QR code displays with instructions for use

**Updated:** `src/app/patient/prescriptions/page.tsx`
- Added "Choose Pharmacy" badge for unassigned prescriptions
- Shows prominent "Choose Pharmacy" button for pharmacy_id IS NULL
- Differentiates between assigned and unassigned prescriptions
- Visual indicator (📋) for prescriptions needing pharmacy selection

#### 4. Pharmacy UI ✅

**New:** `src/app/pharmacy/scan-qr/page.tsx`
- Pharmacy QR scanning interface
- Input field for QR token (manual entry)
- Calls `/api/prescriptions/claim-qr` endpoint
- Displays prescription details after successful claim
- Shows medications to prepare
- Success message with auto-redirect to dashboard
- **Future:** Will add camera-based QR scanning

**Updated:** `src/app/pharmacy/prescriptions/page.tsx`
- Added "Scan QR Code" button (📱) in header
- Links to `/pharmacy/scan-qr` page
- Pharmacy can now receive prescriptions via:
  1. Patient direct assignment
  2. QR code scanning

#### 5. Dependencies ✅
- **Installed:** `react-qr-code` (v2.0.15)
- Used for displaying QR codes in patient prescription detail page

### Notification Flow

**Old Flow:**
1. Doctor creates prescription → Pharmacy automatically notified
2. Patient has no control over pharmacy selection

**New Flow:**
1. Doctor creates prescription → Patient notified to choose pharmacy
2. **Option A:** Patient selects pharmacy from list → Pharmacy notified
3. **Option B:** Patient shows QR at any pharmacy → Pharmacy scans → Patient notified

### Technical Details

**QR Token Format:**
- Prefix: `MCP-` (Mediconnect Prescription)
- Timestamp: `Date.now()` for uniqueness
- Random: `Math.random().toString(36).substring(2, 9).toUpperCase()`
- Example: `MCP-1729012345-X7K2M9A`

**Security:**
- QR token is UNIQUE in database (constraint enforced)
- Once pharmacy assigned, cannot be changed (prevents conflicts)
- Validates prescription ownership before assignment
- Idempotent claims (same pharmacy can scan multiple times safely)

**Pharmacy Discovery:**
- Queries: `role='pharmacy' AND status='approved'`
- Alphabetical ordering (name ASC)
- **Future:** Distance-based sorting with geolocation

### Testing Checklist

- [ ] Create prescription as GP
- [ ] View prescription detail as patient
- [ ] Select pharmacy from list
- [ ] Verify pharmacy receives notification
- [ ] Verify prescription status updates
- [ ] View prescription in pharmacy dashboard
- [ ] Test QR code display
- [ ] Pharmacy scans QR code (manual entry)
- [ ] Verify claim prevents duplicate assignment
- [ ] Test idempotent claims (same pharmacy)

### Files Modified/Created

**Modified:**
- `src/app/api/prescriptions/create/route.ts` (QR generation)
- `src/app/patient/prescriptions/[id]/page.tsx` (complete rewrite)
- `src/app/patient/prescriptions/page.tsx` (pharmacy badges)
- `src/app/pharmacy/prescriptions/page.tsx` (scan button)

**Created:**
- `migrations/004_add_qr_token.sql`
- `src/app/api/prescriptions/[id]/assign-pharmacy/route.ts`
- `src/app/api/prescriptions/claim-qr/route.ts`
- `src/app/api/pharmacies/list/route.ts`
- `src/app/pharmacy/scan-qr/page.tsx`

### Next Steps

1. **Test Enhanced Flow:** Create test prescription and verify both pharmacy selection methods
2. **Phase 3: Referral System** - GP refers patients to specialists (2 hours)
3. **Phase 4: Diagnostic Orders** - Order and track lab tests (2 hours)
4. **Phase 5: Notifications** - Real-time notification system (3 hours)
5. **Phase 6: Payments** - Payment integration (4 hours)

### Future Enhancements

- Camera-based QR code scanning (use `react-qr-scanner` or `jsqr`)
- Location-based pharmacy filtering (geolocation API)
- Pharmacy ratings and reviews
- Estimated preparation time display
- Home delivery option
- Prescription refills
- Insurance integration

---

**Status:** Phase 2 Enhancements Complete ✅
**Ready for:** Phase 3 - Referral System
