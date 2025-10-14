/**
 * Notification Utility Functions
 * Helper functions to create notifications for various system events
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: false,
  },
});

interface NotificationData {
  userId: string;
  type: 'consultation' | 'prescription' | 'referral' | 'diagnostic_order' | 'payment' | 'system' | 'account';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  entityType?: string;
  entityId?: string;
}

/**
 * Create a single notification
 */
export async function createNotification(data: NotificationData): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query(
      `INSERT INTO notifications 
        (user_id, type, title, message, link, metadata, entity_type, entity_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())`,
      [
        data.userId,
        data.type,
        data.title,
        data.message,
        data.link || null,
        JSON.stringify(data.metadata || {}),
        data.entityType || null,
        data.entityId || null,
      ]
    );

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Create multiple notifications (batch)
 */
export async function createNotifications(notifications: NotificationData[]): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const notif of notifications) {
      await client.query(
        `INSERT INTO notifications 
          (user_id, type, title, message, link, metadata, entity_type, entity_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())`,
        [
          notif.userId,
          notif.type,
          notif.title,
          notif.message,
          notif.link || null,
          JSON.stringify(notif.metadata || {}),
          notif.entityType || null,
          notif.entityId || null,
        ]
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating notifications:', error);
    return false;
  } finally {
    client.release();
  }
}

// ====================
// CONSULTATION NOTIFICATIONS
// ====================

export async function notifyConsultationRequested(
  patientId: string,
  patientName: string,
  consultationId: string
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: 'consultation',
    title: 'Consultation Requested',
    message: `Your consultation request has been submitted. We'll notify you once a doctor accepts it.`,
    link: `/patient/consultations/${consultationId}`,
    metadata: { consultationId, patientName },
    entityType: 'consultation',
    entityId: consultationId,
  });
}

export async function notifyConsultationAccepted(
  patientId: string,
  doctorName: string,
  consultationId: string
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: 'consultation',
    title: 'Consultation Accepted',
    message: `Dr. ${doctorName} has accepted your consultation request.`,
    link: `/patient/consultations/${consultationId}`,
    metadata: { consultationId, doctorName },
    entityType: 'consultation',
    entityId: consultationId,
  });
}

export async function notifyConsultationCompleted(
  patientId: string,
  doctorName: string,
  consultationId: string
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: 'consultation',
    title: 'Consultation Completed',
    message: `Dr. ${doctorName} has completed your consultation. View the diagnosis and treatment plan.`,
    link: `/patient/consultations/${consultationId}`,
    metadata: { consultationId, doctorName },
    entityType: 'consultation',
    entityId: consultationId,
  });
}

// ====================
// PRESCRIPTION NOTIFICATIONS
// ====================

export async function notifyPrescriptionCreated(
  patientId: string,
  doctorName: string,
  prescriptionId: string,
  medicationCount: number
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: 'prescription',
    title: 'New Prescription',
    message: `Dr. ${doctorName} has prescribed ${medicationCount} medication(s) for you. View prescription details.`,
    link: `/patient/prescriptions/${prescriptionId}`,
    metadata: { prescriptionId, doctorName, medicationCount },
    entityType: 'prescription',
    entityId: prescriptionId,
  });
}

export async function notifyPrescriptionFilled(
  patientId: string,
  pharmacyName: string,
  prescriptionId: string
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: 'prescription',
    title: 'Prescription Filled',
    message: `Your prescription has been filled by ${pharmacyName}. You can pick it up now.`,
    link: `/patient/prescriptions/${prescriptionId}`,
    metadata: { prescriptionId, pharmacyName },
    entityType: 'prescription',
    entityId: prescriptionId,
  });
}

export async function notifyPharmacyNewPrescription(
  pharmacyId: string,
  patientName: string,
  prescriptionId: string
): Promise<void> {
  await createNotification({
    userId: pharmacyId,
    type: 'prescription',
    title: 'New Prescription to Fill',
    message: `${patientName} has selected your pharmacy for their prescription.`,
    link: `/pharmacy/prescriptions/${prescriptionId}`,
    metadata: { prescriptionId, patientName },
    entityType: 'prescription',
    entityId: prescriptionId,
  });
}

// ====================
// REFERRAL NOTIFICATIONS
// ====================

export async function notifyReferralCreated(
  patientId: string,
  gpName: string,
  specialization: string,
  referralId: string
): Promise<void> {
  await createNotification({
    userId: patientId,
    type: 'referral',
    title: 'New Referral',
    message: `Dr. ${gpName} has referred you to a ${specialization} specialist.`,
    link: `/patient/referrals/${referralId}`,
    metadata: { referralId, gpName, specialization },
    entityType: 'referral',
    entityId: referralId,
  });
}

export async function notifyReferralAccepted(
  patientId: string,
  gpId: string,
  specialistName: string,
  referralId: string
): Promise<void> {
  const notifications: NotificationData[] = [
    {
      userId: patientId,
      type: 'referral',
      title: 'Referral Accepted',
      message: `Dr. ${specialistName} has accepted your referral. They will contact you soon.`,
      link: `/patient/referrals/${referralId}`,
      metadata: { referralId, specialistName },
      entityType: 'referral',
      entityId: referralId,
    },
    {
      userId: gpId,
      type: 'referral',
      title: 'Referral Accepted',
      message: `Dr. ${specialistName} has accepted your referral.`,
      link: `/gp/referrals/${referralId}`,
      metadata: { referralId, specialistName },
      entityType: 'referral',
      entityId: referralId,
    },
  ];

  await createNotifications(notifications);
}

export async function notifyReferralCompleted(
  patientId: string,
  gpId: string,
  specialistName: string,
  referralId: string
): Promise<void> {
  const notifications: NotificationData[] = [
    {
      userId: patientId,
      type: 'referral',
      title: 'Specialist Consultation Complete',
      message: `Dr. ${specialistName} has completed your specialist consultation.`,
      link: `/patient/referrals/${referralId}`,
      metadata: { referralId, specialistName },
      entityType: 'referral',
      entityId: referralId,
    },
    {
      userId: gpId,
      type: 'referral',
      title: 'Referral Completed',
      message: `Dr. ${specialistName} has completed the specialist consultation.`,
      link: `/gp/referrals/${referralId}`,
      metadata: { referralId, specialistName },
      entityType: 'referral',
      entityId: referralId,
    },
  ];

  await createNotifications(notifications);
}

export async function notifySpecialistNewReferral(
  specialistId: string,
  patientName: string,
  gpName: string,
  referralId: string
): Promise<void> {
  await createNotification({
    userId: specialistId,
    type: 'referral',
    title: 'New Referral',
    message: `Dr. ${gpName} has referred ${patientName} to you.`,
    link: `/specialist/referrals/${referralId}`,
    metadata: { referralId, patientName, gpName },
    entityType: 'referral',
    entityId: referralId,
  });
}

// ====================
// DIAGNOSTIC ORDER NOTIFICATIONS
// ====================

export async function notifyDiagnosticOrderCreated(
  patientId: string,
  doctorName: string,
  testTypes: string[],
  orderId: string
): Promise<void> {
  const testList = testTypes.join(', ');
  await createNotification({
    userId: patientId,
    type: 'diagnostic_order',
    title: 'Diagnostic Tests Ordered',
    message: `Dr. ${doctorName} has ordered diagnostic tests for you: ${testList}`,
    link: `/patient/diagnostics/orders`,
    metadata: { orderId, doctorName, testTypes },
    entityType: 'diagnostic_order',
    entityId: orderId,
  });
}

export async function notifyDiagnosticCentersNewOrder(
  diagnosticCenterIds: string[],
  patientName: string,
  doctorName: string,
  testTypes: string[],
  orderId: string
): Promise<void> {
  const testList = testTypes.join(', ');
  const notifications: NotificationData[] = diagnosticCenterIds.map(centerId => ({
    userId: centerId,
    type: 'diagnostic_order',
    title: 'New Diagnostic Order',
    message: `Dr. ${doctorName} has ordered tests for ${patientName}: ${testList}`,
    link: `/diagnostics/orders`,
    metadata: { orderId, patientName, doctorName, testTypes },
    entityType: 'diagnostic_order',
    entityId: orderId,
  }));

  await createNotifications(notifications);
}

export async function notifyDiagnosticOrderScheduled(
  patientId: string,
  doctorId: string,
  centerName: string,
  scheduledDate: string,
  scheduledTime: string,
  orderId: string
): Promise<void> {
  const notifications: NotificationData[] = [
    {
      userId: patientId,
      type: 'diagnostic_order',
      title: 'Diagnostic Tests Scheduled',
      message: `Your diagnostic tests have been scheduled at ${centerName} on ${scheduledDate} at ${scheduledTime}`,
      link: `/patient/diagnostics/orders`,
      metadata: { orderId, centerName, scheduledDate, scheduledTime },
      entityType: 'diagnostic_order',
      entityId: orderId,
    },
    {
      userId: doctorId,
      type: 'diagnostic_order',
      title: 'Diagnostic Tests Scheduled',
      message: `Diagnostic tests scheduled at ${centerName} on ${scheduledDate} at ${scheduledTime}`,
      link: `/gp/consultations`,
      metadata: { orderId, centerName, scheduledDate, scheduledTime },
      entityType: 'diagnostic_order',
      entityId: orderId,
    },
  ];

  await createNotifications(notifications);
}

export async function notifyDiagnosticOrderCompleted(
  patientId: string,
  doctorId: string,
  centerName: string,
  orderId: string,
  resultsUrl?: string
): Promise<void> {
  const notifications: NotificationData[] = [
    {
      userId: patientId,
      type: 'diagnostic_order',
      title: 'Test Results Available',
      message: `Your test results from ${centerName} are now available.`,
      link: resultsUrl || `/patient/diagnostics/orders`,
      metadata: { orderId, centerName, resultsUrl },
      entityType: 'diagnostic_order',
      entityId: orderId,
    },
    {
      userId: doctorId,
      type: 'diagnostic_order',
      title: 'Test Results Available',
      message: `Test results from ${centerName} are now available.`,
      link: resultsUrl || `/gp/consultations`,
      metadata: { orderId, centerName, resultsUrl },
      entityType: 'diagnostic_order',
      entityId: orderId,
    },
  ];

  await createNotifications(notifications);
}

export async function notifyDiagnosticOrderStatusUpdate(
  patientId: string,
  doctorId: string,
  centerName: string,
  status: string,
  orderId: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    sample_collected: 'Your samples have been collected',
    in_progress: 'Your tests are being processed',
    cancelled: 'Your diagnostic order has been cancelled',
  };

  const message = statusMessages[status] || `Diagnostic order status updated to ${status}`;

  const notifications: NotificationData[] = [
    {
      userId: patientId,
      type: 'diagnostic_order',
      title: 'Diagnostic Order Update',
      message: `${message} at ${centerName}`,
      link: `/patient/diagnostics/orders`,
      metadata: { orderId, centerName, status },
      entityType: 'diagnostic_order',
      entityId: orderId,
    },
    {
      userId: doctorId,
      type: 'diagnostic_order',
      title: 'Diagnostic Order Update',
      message: `${message} at ${centerName}`,
      link: `/gp/consultations`,
      metadata: { orderId, centerName, status },
      entityType: 'diagnostic_order',
      entityId: orderId,
    },
  ];

  await createNotifications(notifications);
}

// ====================
// SYSTEM NOTIFICATIONS
// ====================

export async function notifySystemMessage(
  userId: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'system',
    title,
    message,
    link,
    metadata: {},
  });
}

export async function notifyAccountUpdate(
  userId: string,
  title: string,
  message: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'account',
    title,
    message,
    metadata: {},
  });
}
