'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import QRCode from 'react-qr-code';

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  pharmacy_id?: string;
  qr_token: string;
  status: string;
  diagnosis: string;
  notes?: string;
  created_at: string;
  medications: Medication[];
  pharmacyName?: string;
}

interface Pharmacy {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPharmacyList, setShowPharmacyList] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.user) {
      router.push('/patient/login');
      return;
    }
    fetchPrescription();
  }, [session]);

  const fetchPrescription = async () => {
    try {
      const res = await fetch(`/api/prescriptions/${params.id}/fulfill`);
      if (!res.ok) throw new Error('Failed to fetch prescription');
      const data = await res.json();
      setPrescription(data.prescription);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacies = async () => {
    try {
      const res = await fetch('/api/pharmacies/list');
      if (!res.ok) throw new Error('Failed to fetch pharmacies');
      const data = await res.json();
      setPharmacies(data.pharmacies);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleShowPharmacyList = () => {
    if (pharmacies.length === 0) {
      fetchPharmacies();
    }
    setShowPharmacyList(true);
    setShowQRCode(false);
  };

  const handleShowQRCode = () => {
    setShowQRCode(true);
    setShowPharmacyList(false);
  };

  const handleAssignPharmacy = async (pharmacyId: string) => {
    setAssigning(true);
    setError('');
    try {
      const res = await fetch(`/api/prescriptions/${params.id}/assign-pharmacy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId,
          patientId: session?.user?.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign pharmacy');
      }

      const data = await res.json();
      
      // Refresh prescription data
      await fetchPrescription();
      setShowPharmacyList(false);
      alert(`Prescription sent to ${data.pharmacyName}!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (error && !prescription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/patient/prescriptions" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Prescriptions
          </Link>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Prescription Not Found</h1>
          <Link href="/patient/prescriptions" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Prescriptions
          </Link>
        </div>
      </div>
    );
  }

  const isAssigned = !!prescription.pharmacy_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/patient/prescriptions" className="text-indigo-600 hover:text-indigo-700">
              ← Back
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Prescription Details</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Prescription #{prescription.id.slice(0, 8)}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAssigned 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isAssigned ? 'Pharmacy Assigned' : 'Choose Pharmacy'}
            </span>
          </div>

          {prescription.diagnosis && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Diagnosis</p>
              <p className="text-gray-900">{prescription.diagnosis}</p>
            </div>
          )}

          {prescription.notes && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Doctor's Notes</p>
              <p className="text-gray-900">{prescription.notes}</p>
            </div>
          )}

          <div className="text-sm text-gray-500">
            Issued: {new Date(prescription.created_at).toLocaleDateString()}
          </div>

          {isAssigned && prescription.pharmacyName && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 font-medium">✓ Assigned to: {prescription.pharmacyName}</p>
              <p className="text-sm text-green-700 mt-1">Your pharmacy has been notified and will prepare your medications.</p>
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Medications</h3>
          <div className="space-y-4">
            {prescription.medications.map((med) => (
              <div key={med.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                <h4 className="font-medium text-gray-900">{med.medication_name}</h4>
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

        {/* Pharmacy Selection or QR Code */}
        {!isAssigned && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose How to Get Your Prescription</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleShowPharmacyList}
                className={`p-6 border-2 rounded-lg text-left transition-colors ${
                  showPharmacyList 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="text-2xl mb-2">🏪</div>
                <h4 className="font-semibold text-gray-900 mb-2">Select a Pharmacy</h4>
                <p className="text-sm text-gray-600">Choose from our verified pharmacy partners</p>
              </button>

              <button
                onClick={handleShowQRCode}
                className={`p-6 border-2 rounded-lg text-left transition-colors ${
                  showQRCode 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="text-2xl mb-2">📱</div>
                <h4 className="font-semibold text-gray-900 mb-2">Show QR Code</h4>
                <p className="text-sm text-gray-600">Visit any verified pharmacy and scan</p>
              </button>
            </div>

            {/* Pharmacy List */}
            {showPharmacyList && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Available Pharmacies</h4>
                {pharmacies.length === 0 ? (
                  <p className="text-gray-500">Loading pharmacies...</p>
                ) : (
                  <div className="space-y-3">
                    {pharmacies.map((pharmacy) => (
                      <div key={pharmacy.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{pharmacy.name}</h5>
                            {pharmacy.address && (
                              <p className="text-sm text-gray-600 mt-1">
                                {pharmacy.address}
                                {pharmacy.city && `, ${pharmacy.city}`}
                                {pharmacy.state && `, ${pharmacy.state}`}
                                {pharmacy.zip_code && ` ${pharmacy.zip_code}`}
                              </p>
                            )}
                            {pharmacy.phone && (
                              <p className="text-sm text-gray-600">📞 {pharmacy.phone}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleAssignPharmacy(pharmacy.id)}
                            disabled={assigning}
                            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {assigning ? 'Assigning...' : 'Select'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* QR Code Display */}
            {showQRCode && (
              <div className="mt-6 text-center">
                <div className="inline-block p-8 bg-white border-2 border-gray-300 rounded-lg">
                  <QRCode 
                    value={prescription.qr_token} 
                    size={256}
                    level="H"
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                  <p className="mt-4 font-mono text-lg font-semibold text-gray-900">{prescription.qr_token}</p>
                </div>
                <div className="mt-6 max-w-md mx-auto text-left bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">How to use:</h5>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Visit any verified HealthHub pharmacy</li>
                    <li>Show this QR code to the pharmacist</li>
                    <li>They'll scan it to access your prescription</li>
                    <li>You'll receive a notification when it's ready</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}