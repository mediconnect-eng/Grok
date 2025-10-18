/**
 * Input Validation Schemas
 * 
 * Centralized Zod schemas for validating all API inputs.
 * Provides type safety and runtime validation.
 */

import { z } from 'zod';

/**
 * Common field validations
 */
const uuid = z.string().uuid('Invalid ID format');
const email = z.string().email('Invalid email address');
const phone = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
const url = z.string().url('Invalid URL format');
const date = z.string().datetime('Invalid date format').or(z.date());
const positiveNumber = z.number().positive('Must be a positive number');
const nonEmptyString = z.string().min(1, 'This field is required');

/**
 * User and Authentication Schemas
 */
export const SignupSchema = z.object({
  email: email,
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  role: z.enum(['patient', 'gp', 'specialist', 'pharmacy', 'diagnostic-center', 'admin']).optional(),
});

export const LoginSchema = z.object({
  email: email,
  password: z.string().min(1, 'Password is required'),
});

export const EmailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const ResendVerificationSchema = z.object({
  email: email,
});

export const PasswordResetRequestSchema = z.object({
  email: email,
});

export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: SignupSchema.shape.password,
});

/**
 * Consultation Schemas
 */
export const CreateConsultationSchema = z.object({
  patientId: z.string().min(1).max(255), // Relaxed from strict UUID for Better Auth compatibility
  providerType: z.enum(['gp', 'specialist'], {
    message: 'Provider type must be either "gp" or "specialist"',
  }),
  consultationType: z.enum(['video', 'chat'], {
    message: 'Consultation type must be either "video" or "chat"',
  }).optional().default('video'),
  chiefComplaint: z.string().min(5, 'Chief complaint must be at least 5 characters').max(500),
  symptoms: z.string().max(2000, 'Symptoms description too long').optional(),
  duration: z.string().max(200, 'Duration description too long').optional(),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  preferredDate: z.string().optional(), // Made fully optional with relaxed validation
  attachments: z.array(z.string().url()).max(10, 'Maximum 10 attachments allowed').optional(),
});

export const ConsultationActionSchema = z.object({
  action: z.enum(['accept', 'complete', 'cancel'], {
    message: 'Action must be "accept", "complete", or "cancel"',
  }),
  providerId: uuid.optional(),
  notes: z.string().max(2000, 'Notes too long').optional(),
  diagnosis: z.string().max(1000, 'Diagnosis too long').optional(),
  treatment: z.string().max(2000, 'Treatment plan too long').optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().datetime().optional().or(z.date().optional()),
  cancellationReason: z.string().max(500, 'Cancellation reason too long').optional(),
});

export const GetConsultationsSchema = z.object({
  userId: uuid,
  role: z.enum(['patient', 'provider']),
  status: z.enum(['pending', 'accepted', 'completed', 'cancelled']).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

/**
 * Prescription Schemas
 */
export const MedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required').max(200),
  dosage: z.string().min(1, 'Dosage is required').max(100),
  frequency: z.string().min(1, 'Frequency is required').max(200),
  duration: z.string().min(1, 'Duration is required').max(100),
  instructions: z.string().max(500, 'Instructions too long').optional(),
});

export const CreatePrescriptionSchema = z.object({
  consultationId: uuid,
  patientId: uuid,
  doctorId: uuid,
  medications: z.array(MedicationSchema).min(1, 'At least one medication is required').max(20),
  notes: z.string().max(1000, 'Notes too long').optional(),
  validUntil: z.string().datetime().optional().or(z.date().optional()),
});

export const FulfillPrescriptionSchema = z.object({
  prescriptionId: uuid,
  pharmacyId: uuid,
  status: z.enum(['processing', 'ready', 'delivered'], {
    message: 'Status must be "processing", "ready", or "delivered"',
  }),
  notes: z.string().max(500, 'Notes too long').optional(),
  fulfillmentDate: z.string().datetime().optional().or(z.date().optional()),
});

export const AssignPharmacySchema = z.object({
  prescriptionId: uuid,
  pharmacyId: uuid,
});

export const ClaimPrescriptionSchema = z.object({
  qrToken: z.string().min(1, 'QR token is required'),
  pharmacyId: uuid,
});

/**
 * Referral Schemas
 */
export const CreateReferralSchema = z.object({
  patientId: uuid,
  referringDoctorId: uuid,
  specialtyNeeded: z.string().min(1, 'Specialty is required').max(100),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(1000),
  urgency: z.enum(['routine', 'urgent', 'emergency']).optional(),
  clinicalSummary: z.string().max(2000, 'Clinical summary too long').optional(),
  attachments: z.array(z.string().url()).max(10, 'Maximum 10 attachments allowed').optional(),
});

export const ReferralActionSchema = z.object({
  action: z.enum(['accept', 'decline'], {
    message: 'Action must be "accept" or "decline"',
  }),
  specialistId: uuid,
  notes: z.string().max(1000, 'Notes too long').optional(),
  proposedDate: z.string().datetime().optional().or(z.date().optional()),
});

/**
 * Diagnostic Order Schemas
 */
export const TestSchema = z.object({
  name: z.string().min(1, 'Test name is required').max(200),
  code: z.string().max(50, 'Test code too long').optional(),
  instructions: z.string().max(500, 'Instructions too long').optional(),
});

export const CreateDiagnosticOrderSchema = z.object({
  patientId: uuid,
  orderingDoctorId: uuid,
  tests: z.array(TestSchema).min(1, 'At least one test is required').max(20),
  clinicalIndication: z.string().min(10, 'Clinical indication required').max(1000),
  urgency: z.enum(['routine', 'urgent', 'stat']).optional(),
  diagnosticCenterId: uuid.optional(),
  preferredDate: z.string().datetime().optional().or(z.date().optional()),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const UpdateDiagnosticStatusSchema = z.object({
  orderId: uuid,
  diagnosticCenterId: uuid,
  status: z.enum(['pending', 'scheduled', 'in-progress', 'completed', 'cancelled'], {
    message: 'Invalid status value',
  }),
  scheduledDate: z.string().datetime().optional().or(z.date().optional()),
  results: z.string().max(5000, 'Results too long').optional(),
  resultFiles: z.array(z.string().url()).max(20, 'Maximum 20 result files').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

/**
 * Notification Schemas
 */
export const GetNotificationsSchema = z.object({
  userId: uuid,
  type: z.enum([
    'consultation',
    'prescription',
    'referral',
    'diagnostic_order',
    'payment',
    'system',
    'account',
  ]).optional(),
  is_read: z.boolean().optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export const MarkNotificationsReadSchema = z.object({
  userId: uuid,
  notificationId: uuid.optional(),
  notificationIds: z.array(uuid).optional(),
}).refine(
  data => data.notificationId || data.notificationIds || (!data.notificationId && !data.notificationIds),
  'Either notificationId, notificationIds array, or neither (mark all) must be provided'
);

export const CreateNotificationSchema = z.object({
  userId: uuid,
  type: z.enum([
    'consultation',
    'prescription',
    'referral',
    'diagnostic_order',
    'payment',
    'system',
    'account',
  ]),
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(1000),
  link: z.string().max(500, 'Link too long').optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Provider Application Schemas
 */
export const DoctorApplicationSchema = z.object({
  email: email,
  password: SignupSchema.shape.password,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: phone,
  specialty: z.string().min(2, 'Specialty is required').max(100),
  licenseNumber: z.string().min(3, 'License number is required').max(50),
  yearsOfExperience: z.number().int().nonnegative().max(70, 'Invalid years of experience'),
  qualifications: z.string().min(10, 'Qualifications are required').max(1000),
  hospitalAffiliation: z.string().max(200, 'Hospital affiliation too long').optional(),
});

export const PartnerApplicationSchema = z.object({
  email: email,
  password: SignupSchema.shape.password,
  businessName: z.string().min(2, 'Business name is required').max(200),
  businessType: z.enum(['pharmacy', 'diagnostic-center'], {
    message: 'Business type must be "pharmacy" or "diagnostic-center"',
  }),
  phone: phone,
  address: z.string().min(10, 'Address is required').max(500),
  licenseNumber: z.string().min(3, 'License number is required').max(50),
  servicesOffered: z.string().min(10, 'Services description is required').max(1000),
});

export const ApplicationActionSchema = z.object({
  applicationId: uuid,
  action: z.enum(['approve', 'reject'], {
    message: 'Action must be "approve" or "reject"',
  }),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

/**
 * Query parameter schemas
 */
export const PaginationSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export const IdParamSchema = z.object({
  id: uuid,
});

/**
 * Helper function to validate and parse request body
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errors = result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return {
        success: false,
        error: errors.join(', '),
      };
    }
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON in request body',
    };
  }
}

/**
 * Helper function to validate query parameters
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    // Convert URLSearchParams to object
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      // Try to parse as number if it looks like a number
      if (/^\d+$/.test(value)) {
        params[key] = parseInt(value, 10);
      } else if (value === 'true') {
        params[key] = true;
      } else if (value === 'false') {
        params[key] = false;
      } else {
        params[key] = value;
      }
    });
    
    const result = schema.safeParse(params);
    
    if (!result.success) {
      const errors = result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return {
        success: false,
        error: errors.join(', '),
      };
    }
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid query parameters',
    };
  }
}

/**
 * Type exports for use in route handlers
 */
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateConsultationInput = z.infer<typeof CreateConsultationSchema>;
export type ConsultationActionInput = z.infer<typeof ConsultationActionSchema>;
export type CreatePrescriptionInput = z.infer<typeof CreatePrescriptionSchema>;
export type FulfillPrescriptionInput = z.infer<typeof FulfillPrescriptionSchema>;
export type CreateReferralInput = z.infer<typeof CreateReferralSchema>;
export type ReferralActionInput = z.infer<typeof ReferralActionSchema>;
export type CreateDiagnosticOrderInput = z.infer<typeof CreateDiagnosticOrderSchema>;
export type UpdateDiagnosticStatusInput = z.infer<typeof UpdateDiagnosticStatusSchema>;
export type GetNotificationsInput = z.infer<typeof GetNotificationsSchema>;
export type MarkNotificationsReadInput = z.infer<typeof MarkNotificationsReadSchema>;
export type DoctorApplicationInput = z.infer<typeof DoctorApplicationSchema>;
export type PartnerApplicationInput = z.infer<typeof PartnerApplicationSchema>;
export type ApplicationActionInput = z.infer<typeof ApplicationActionSchema>;
