-- Migration 005: Notifications System Enhancements
-- Created: October 14, 2025
-- Purpose: Enhance existing notifications table for comprehensive notification system

-- Add missing columns to existing notifications table
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS link TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create indexes for efficient querying (IF NOT EXISTS supported)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Update existing type constraint to include all notification types
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'consultation',
    'prescription',
    'referral',
    'diagnostic_order',
    'payment',
    'system',
    'account'
  ));

COMMENT ON TABLE notifications IS 'Stores all system notifications for users';
COMMENT ON COLUMN notifications.type IS 'Type of notification: consultation, prescription, referral, diagnostic_order, payment, system, account';
COMMENT ON COLUMN notifications.metadata IS 'Additional data like entity IDs, patient names, etc in JSON format';
COMMENT ON COLUMN notifications.link IS 'Optional deep link to related entity';
COMMENT ON COLUMN notifications.entity_type IS 'Legacy field - type of entity (consultation, prescription, etc)';
COMMENT ON COLUMN notifications.entity_id IS 'Legacy field - ID of related entity';

