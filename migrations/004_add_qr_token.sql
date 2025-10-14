-- Add QR token to prescriptions for pharmacy scanning
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- Create index for fast QR token lookups during scanning
CREATE INDEX IF NOT EXISTS idx_prescriptions_qr_token 
ON prescriptions(qr_token);

-- Add comment for documentation
COMMENT ON COLUMN prescriptions.qr_token IS 'Unique QR token for pharmacy scanning (format: MCP-{timestamp}-{random})';
