'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  qr_token: string;
  diagnosis: string;
  notes?: string;
  medications: Medication[];
  patientName?: string;
}

export default function ScanQRPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/pharmacy/login');
      return;
    }
  }, [session]);

  const handleScan = async () => {
    if (!qrToken.trim()) {
      setError('Please enter a QR code');
      return;
    }

    setLoading(true);
    setError('');
    setPrescription(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/prescriptions/claim-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: qrToken.trim(),
          pharmacyId: session?.user?.id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim prescription');
      }

      setPrescription(data.prescription);
      setSuccess(true);
      
      // Redirect to prescriptions page after 3 seconds
      setTimeout(() => {
        router.push('/pharmacy/prescriptions');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQrToken('');
    setError('');
    setPrescription(null);
    setSuccess(false);
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => router.push('/pharmacy/prescriptions')}
              className="text-indigo-600 hover:text-indigo-700"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Scan QR Code</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!success ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Patient's QR Code</h2>
              <p className="text-gray-600">Enter the QR code from the patient's prescription</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="qrToken" className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code or Token
                </label>
                <input
                  type="text"
                  id="qrToken"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  placeholder="MCP-1729012345-X7K2M9A"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleScan();
                    }
                  }}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Format: MCP-[timestamp]-[code]
                </p>
              </div>

              <button
                onClick={handleScan}
                disabled={loading || !qrToken.trim()}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {loading ? 'Processing...' : 'Claim Prescription'}
              </button>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  💡 <strong>Tip:</strong> In future updates, you'll be able to scan QR codes directly with your camera.
                </p>
              </div>
            </div>
          </div>
        ) : prescription && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Prescription Claimed!</h2>
              <p className="text-green-700">The patient has been notified. Redirecting to prescriptions...</p>
            </div>

            {/* Prescription Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Prescription ID</p>
                  <p className="font-mono text-gray-900">{prescription.id.slice(0, 8)}</p>
                </div>

                {prescription.patientName && (
                  <div>
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="text-gray-900">{prescription.patientName}</p>
                  </div>
                )}

                {prescription.diagnosis && (
                  <div>
                    <p className="text-sm text-gray-500">Diagnosis</p>
                    <p className="text-gray-900">{prescription.diagnosis}</p>
                  </div>
                )}

                {prescription.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Doctor's Notes</p>
                    <p className="text-gray-900">{prescription.notes}</p>
                  </div>
                )}
              </div>

              {/* Medications */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Medications to Prepare</h4>
                <div className="space-y-4">
                  {prescription.medications.map((med, idx) => (
                    <div key={idx} className="border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded">
                      <h5 className="font-medium text-gray-900">{med.medication_name}</h5>
                      <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                      <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                      <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                      {med.instructions && (
                        <p className="text-sm text-gray-500 mt-1">{med.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium"
            >
              Scan Another QR Code
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
