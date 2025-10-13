-- Migration: Add provider and partner application tables
-- Date: October 14, 2025
-- Purpose: Support healthcare provider and partner verification system

-- Create provider_applications table (for doctors/GPs/specialists)
CREATE TABLE IF NOT EXISTS provider_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('gp', 'specialist')),
  license_number VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  qualifications TEXT,
  experience_years INTEGER,
  hospital_affiliation VARCHAR(255),
  practice_location TEXT,
  consultation_fee DECIMAL(10,2),
  license_document_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  verified_by TEXT REFERENCES "user"(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for provider_applications
CREATE INDEX IF NOT EXISTS idx_provider_applications_email ON provider_applications(email);
CREATE INDEX IF NOT EXISTS idx_provider_applications_status ON provider_applications(status);
CREATE INDEX IF NOT EXISTS idx_provider_applications_license ON provider_applications(license_number);
CREATE INDEX IF NOT EXISTS idx_provider_applications_user_id ON provider_applications(user_id);

-- Create partner_applications table (for pharmacy/diagnostics)
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  partner_type VARCHAR(20) NOT NULL CHECK (partner_type IN ('pharmacy', 'diagnostics')),
  business_name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  operating_hours JSONB,
  services_offered TEXT[],
  license_document_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  verified_by TEXT REFERENCES "user"(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for partner_applications
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_license ON partner_applications(license_number);
CREATE INDEX IF NOT EXISTS idx_partner_applications_type ON partner_applications(partner_type);
CREATE INDEX IF NOT EXISTS idx_partner_applications_user_id ON partner_applications(user_id);

-- Create admin_users table for platform administrators
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
  permissions JSONB DEFAULT '{"approve_providers": true, "approve_partners": true, "manage_users": true}'::jsonb,
  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Create application_audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS application_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('provider', 'partner')),
  action VARCHAR(50) NOT NULL,
  performed_by TEXT NOT NULL REFERENCES "user"(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_application ON application_audit_log(application_id, application_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON application_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON application_audit_log(created_at);

-- Add comments
COMMENT ON TABLE provider_applications IS 'Applications from healthcare providers (doctors, GPs, specialists) pending verification';
COMMENT ON TABLE partner_applications IS 'Applications from business partners (pharmacies, diagnostic centers) pending verification';
COMMENT ON TABLE admin_users IS 'Platform administrators who can approve applications and manage users';
COMMENT ON TABLE application_audit_log IS 'Audit trail of all application review actions';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_provider_applications_updated_at BEFORE UPDATE ON provider_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_applications_updated_at BEFORE UPDATE ON partner_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_profiles_updated_at BEFORE UPDATE ON patient_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
