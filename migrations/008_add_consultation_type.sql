-- Migration 008: Add consultation type field
-- Adds consultation_type to differentiate between video and chat consultations

-- Create consultation type enum
DO $$ BEGIN
  CREATE TYPE consultation_type AS ENUM ('video', 'chat');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add consultation_type column to consultations table
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS consultation_type consultation_type DEFAULT 'video' NOT NULL;

-- Create index for consultation type queries
CREATE INDEX IF NOT EXISTS idx_consultations_type ON consultations(consultation_type);

-- Add comment
COMMENT ON COLUMN consultations.consultation_type IS 'Type of consultation: video call or text chat';

-- Update existing consultations to 'video' (default)
UPDATE consultations 
SET consultation_type = 'video' 
WHERE consultation_type IS NULL;
