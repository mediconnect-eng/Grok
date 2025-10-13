-- Migration 003: Consultation System
-- Creates tables for patient-doctor consultations with real-time messaging

-- Consultation status enum
CREATE TYPE consultation_status AS ENUM (
  'pending',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
  'declined'
);

-- Consultation urgency enum
CREATE TYPE consultation_urgency AS ENUM (
  'routine',
  'urgent',
  'emergency'
);

-- Main consultations table (CREATE FIRST - others reference it)
CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  provider_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('gp', 'specialist')),
  
  -- Consultation details
  chief_complaint TEXT NOT NULL,
  symptoms TEXT,
  duration VARCHAR(100),
  urgency consultation_urgency DEFAULT 'routine',
  preferred_date TIMESTAMP,
  
  -- Status tracking
  status consultation_status DEFAULT 'pending' NOT NULL,
  consultation_fee DECIMAL(10, 2),
  payment_status VARCHAR(20) DEFAULT 'pending',
  
  -- Medical attachments
  attachments JSONB DEFAULT '[]',
  
  -- Consultation notes (filled by doctor)
  diagnosis TEXT,
  treatment_plan TEXT,
  doctor_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Prescriptions table (NOW consultations exists)
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  pharmacy_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  consultation_id TEXT REFERENCES consultations(id) ON DELETE SET NULL,
  
  -- Prescription details
  medications JSONB NOT NULL DEFAULT '[]',
  diagnosis TEXT,
  notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent_to_pharmacy', 'in_progress', 'ready', 'delivered', 'cancelled')),
  fulfilled_at TIMESTAMP,
  delivery_status VARCHAR(50),
  qr_code TEXT UNIQUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP
);

-- Consultation messages table (for chat)
CREATE TABLE IF NOT EXISTS consultation_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  consultation_id TEXT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('patient', 'provider')),
  
  -- Message content
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  
  -- Message status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_provider ON consultations(provider_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_created ON consultations(created_at DESC);
CREATE INDEX idx_consultation_messages_consultation ON consultation_messages(consultation_id);
CREATE INDEX idx_consultation_messages_created ON consultation_messages(created_at);

-- Auto-update trigger for consultations
CREATE OR REPLACE FUNCTION update_consultation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consultation_updated_at
BEFORE UPDATE ON consultations
FOR EACH ROW
EXECUTE FUNCTION update_consultation_timestamp();

-- Referrals table (GP to Specialist)
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  referring_provider_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  specialist_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  consultation_id TEXT REFERENCES consultations(id) ON DELETE SET NULL,
  
  -- Referral details
  specialization VARCHAR(100) NOT NULL,
  reason TEXT NOT NULL,
  medical_history TEXT,
  urgency consultation_urgency DEFAULT 'routine',
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for referrals
CREATE INDEX idx_referrals_patient ON referrals(patient_id);
CREATE INDEX idx_referrals_referring ON referrals(referring_provider_id);
CREATE INDEX idx_referrals_specialist ON referrals(specialist_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Auto-update trigger for referrals
CREATE TRIGGER referral_updated_at
BEFORE UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION update_consultation_timestamp();

-- Diagnostic orders table
CREATE TABLE IF NOT EXISTS diagnostic_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  diagnostic_center_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  consultation_id TEXT REFERENCES consultations(id) ON DELETE SET NULL,
  
  -- Order details
  test_types TEXT[] NOT NULL,
  special_instructions TEXT,
  urgency consultation_urgency DEFAULT 'routine',
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sample_collected', 'in_progress', 'completed', 'cancelled')),
  
  -- Scheduling
  scheduled_date TIMESTAMP,
  scheduled_time VARCHAR(20),
  
  -- Results
  results_url TEXT,
  results_notes TEXT,
  
  -- Payment
  order_fee DECIMAL(10, 2),
  payment_status VARCHAR(20) DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for diagnostic orders
CREATE INDEX idx_diagnostic_orders_patient ON diagnostic_orders(patient_id);
CREATE INDEX idx_diagnostic_orders_doctor ON diagnostic_orders(doctor_id);
CREATE INDEX idx_diagnostic_orders_center ON diagnostic_orders(diagnostic_center_id);
CREATE INDEX idx_diagnostic_orders_status ON diagnostic_orders(status);

-- Auto-update trigger for diagnostic orders
CREATE TRIGGER diagnostic_order_updated_at
BEFORE UPDATE ON diagnostic_orders
FOR EACH ROW
EXECUTE FUNCTION update_consultation_timestamp();

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  
  -- Notification content
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  
  -- Related entity
  entity_type VARCHAR(50),
  entity_id TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Add indexes for prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacy ON prescriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_qr ON prescriptions(qr_code);

COMMENT ON TABLE consultations IS 'Stores patient-doctor consultation sessions';
COMMENT ON TABLE consultation_messages IS 'Chat messages within consultations';
COMMENT ON TABLE referrals IS 'GP to Specialist referrals';
COMMENT ON TABLE diagnostic_orders IS 'Diagnostic test orders from doctors';
COMMENT ON TABLE notifications IS 'System notifications for all users';
