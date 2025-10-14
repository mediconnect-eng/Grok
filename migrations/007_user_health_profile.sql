-- Migration: Add health profile fields to user table
-- Date: 2025-10-15

-- Add personal information fields
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add emergency contact fields
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- Add medical information fields
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5),
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS chronic_conditions TEXT,
ADD COLUMN IF NOT EXISTS current_medications TEXT;

-- Add timestamps if not exists
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index on frequently queried fields
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"(role);

-- Add comments for documentation
COMMENT ON COLUMN "user".phone IS 'Primary contact phone number';
COMMENT ON COLUMN "user".gender IS 'Gender: male, female, other, prefer_not_to_say';
COMMENT ON COLUMN "user".address IS 'Full address for mailing and services';
COMMENT ON COLUMN "user".emergency_contact_name IS 'Emergency contact full name';
COMMENT ON COLUMN "user".emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN "user".blood_type IS 'Blood type: A+, A-, B+, B-, AB+, AB-, O+, O-';
COMMENT ON COLUMN "user".allergies IS 'List of allergies (medications, food, environmental)';
COMMENT ON COLUMN "user".chronic_conditions IS 'Ongoing medical conditions';
COMMENT ON COLUMN "user".current_medications IS 'Currently taking medications';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'User health profile fields migration completed successfully';
END $$;
