/**
 * Feature Flags and Environment Configuration
 */

// Environment checks
export const isProduction = process.env.NODE_ENV === 'production';
export const isProductionMode = process.env.PRODUCTION_MODE === 'true';

// Application feature flags
export const FEATURE_FLAGS = {
  WHATSAPP_INTEGRATION: false,
  MAPS_INTEGRATION: false,
  PAYMENTS_INTEGRATION: false,
  VIDEO_CONSULTATION: false,
  TELEPHONY_INTEGRATION: false,
  AI_ASSISTANT: true, // Mock AI assistant is enabled
  QR_CODE_SCANNER: true, // Pharmacy QR scanning is enabled
  PDF_PRESCRIPTION_DOWNLOAD: true, // PDF download is enabled
  EMAIL_NOTIFICATIONS: false,
  SMS_NOTIFICATIONS: false,
  PUSH_NOTIFICATIONS: false,
  
  // Production mode controls
  DEMO_MODE: !isProductionMode,
  DEMO_SEEDING: !isProductionMode,
  DEMO_ACCOUNTS_VISIBLE: !isProductionMode,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

// Helper functions
export function isDemoMode(): boolean {
  return FEATURE_FLAGS.DEMO_MODE;
}

export function isProductionEnvironment(): boolean {
  return isProduction || isProductionMode;
}

export function getEnvironmentName(): string {
  if (isProductionMode) return 'Production';
  if (isProduction) return 'Production (staging)';
  return 'Development';
}
