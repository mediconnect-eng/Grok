-- Migration: Add role column to user table
-- Date: 2025-10-14
-- Purpose: Support role-based access control (RBAC) for admin, patient, provider roles

-- Add role column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'patient';

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"(role);

-- Update existing users based on their applications
-- Set role to 'gp' or 'specialist' for approved provider applications
UPDATE "user" u
SET role = COALESCE(
  (SELECT provider_type FROM provider_applications WHERE user_id = u.id AND status = 'approved' LIMIT 1),
  'patient'
)
WHERE EXISTS (SELECT 1 FROM provider_applications WHERE user_id = u.id AND status = 'approved');

-- Set role to 'pharmacy' or 'diagnostic-center' for approved partner applications
UPDATE "user" u
SET role = COALESCE(
  (SELECT partner_type FROM partner_applications WHERE user_id = u.id AND status = 'approved' LIMIT 1),
  u.role
)
WHERE EXISTS (SELECT 1 FROM partner_applications WHERE user_id = u.id AND status = 'approved');

-- Add comment
COMMENT ON COLUMN "user".role IS 'User role for RBAC: patient, admin, gp, specialist, pharmacy, diagnostic-center';

-- Add check constraint for valid roles
ALTER TABLE "user" ADD CONSTRAINT check_user_role 
CHECK (role IN ('patient', 'admin', 'gp', 'specialist', 'pharmacy', 'diagnostic-center'));
