'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';

interface Consultation {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  chief_complaint: string;
  symptoms: string | null;
  duration: string | null;
  urgency: string;
  status: string;
  diagnosis: string | null;
  treatment_plan: string | null;
  doctor_notes: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

const SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Psychiatry',
  'Pulmonology',
  'Rheumatology',
  'Urology'
];

export default function GPConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;
  const [gpUser, setGpUser] = useState<any>(null);

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Referral form state
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [specialization, setSpecialization] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [referralUrgency, setReferralUrgency] = useState('routine');
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState(false);

  // Diagnostic order form state
  const [showDiagnosticForm, setShowDiagnosticForm] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [diagnosticInstructions, setDiagnosticInstructions] = useState('');
  const [diagnosticUrgency, setDiagnosticUrgency] = useState('routine');
  const [submittingDiagnostic, setSubmittingDiagnostic] = useState(false);
  const [diagnosticSuccess, setDiagnosticSuccess] = useState(false);
  const [availableTests, setAvailableTests] = useState<string[]>([]);

  // Fetch GP user on mount
  useEffect(() => {
    fetchGPUser();
  }, []);

  const fetchGPUser = async () => {
    try {
      const response = await fetch('/api/users/gp');
      if (response.ok) {
        const data = await response.json();
        setGpUser(data.user);
      } else {
        // Fallback
        setGpUser({
          id: '5e8115c5-7b46-421b-b136-f4d029568d1c',
          name: 'Dr. John Smith',
          email: 'doctor@healthhub.com',
          role: 'gp'
        });
      }
    } catch (err) {
      setGpUser({
        id: '5e8115c5-7b46-421b-b136-f4d029568d1c',
        name: 'Dr. John Smith',
        email: 'doctor@healthhub.com',
        role: 'gp'
      });
    }
  };

  useEffect(() => {
    if (gpUser) {
      fetchConsultation();
      fetchAvailableTests();
    }
  }, [gpUser, consultationId]);

  const fetchAvailableTests = async () => {
    try {
      const response = await fetch('/api/diagnostic-orders/create');
      if (!response.ok) return;
      const data = await response.json();
      setAvailableTests(data.testTypes || []);
    } catch (err) {
      console.error('Failed to fetch available tests:', err);
    }
  };

  const fetchConsultation = async () => {
    if (!gpUser) return;
    
    try {
      const response = await fetch(`/api/consultations/provider?providerId=${gpUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch consultation');
      
      const data = await response.json();
      const found = data.consultations.find((c: Consultation) => c.id === consultationId);
      
      if (!found) throw new Error('Consultation not found');
      
      setConsultation(found);
      // Pre-fill medical history with existing info
      if (found.symptoms || found.diagnosis) {
        setMedicalHistory(
          `Symptoms: ${found.symptoms || 'N/A'}\nDiagnosis: ${found.diagnosis || 'Pending'}\nNotes: ${found.doctor_notes || 'None'}`
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!specialization || !referralReason) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmittingReferral(true);
    setError('');

    try {
      const response = await fetch('/api/referrals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: consultation!.id,
          patientId: consultation!.patient_id,
          referringProviderId: gpUser?.id,
          specialization,
          reason: referralReason,
          medicalHistory,
          urgency: referralUrgency
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create referral');
      }

      const data = await response.json();
      setReferralSuccess(true);
      setShowReferralForm(false);
      
      alert(`Referral created successfully! ${data.referral.availableSpecialistsCount} specialist(s) have been notified.`);
      
      // Reset form
      setSpecialization('');
      setReferralReason('');
      setMedicalHistory('');
      setReferralUrgency('routine');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingReferral(false);
    }
  };

  const handleCreateDiagnosticOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTests.length === 0) {
      alert('Please select at least one test');
      return;
    }

    setSubmittingDiagnostic(true);
    setError('');

    try {
      const response = await fetch('/api/diagnostic-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: consultation!.patient_id,
          doctorId: gpUser?.id,
          consultationId: consultation!.id,
          testTypes: selectedTests,
          specialInstructions: diagnosticInstructions,
          urgency: diagnosticUrgency
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create diagnostic order');
      }

      const data = await response.json();
      setDiagnosticSuccess(true);
      setShowDiagnosticForm(false);
      
      alert(`Diagnostic order created successfully! Patient and diagnostic centers have been notified.`);
      
      // Reset form
      setSelectedTests([]);
      setDiagnosticInstructions('');
      setDiagnosticUrgency('routine');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingDiagnostic(false);
    }
  };

  const toggleTestSelection = (test: string) => {
    setSelectedTests(prev => 
      prev.includes(test) 
        ? prev.filter(t => t !== test)
        : [...prev, test]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error && !consultation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/gp/consultations" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Consultations
          </Link>
        </div>
      </div>
    );
  }

  if (!consultation) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/gp/consultations" className="text-indigo-600 hover:text-indigo-700">
              ← Back to Consultations
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Consultation Details</h1>
            <div className="w-40"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {referralSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            ✓ Referral created successfully! Specialists have been notified.
          </div>
        )}

        {diagnosticSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            ✓ Diagnostic order created successfully! Patient and diagnostic centers have been notified.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{consultation.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{consultation.patient_email}</p>
                </div>
                {consultation.patient_phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{consultation.patient_phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Patient ID</p>
                  <p className="font-mono text-sm text-gray-900">{consultation.patient_id.slice(0, 8)}</p>
                </div>
              </div>
            </div>

            {/* Consultation Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Consultation Details</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Chief Complaint</p>
                  <p className="text-gray-900 mt-1">{consultation.chief_complaint}</p>
                </div>

                {consultation.symptoms && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Symptoms</p>
                    <p className="text-gray-900 mt-1">{consultation.symptoms}</p>
                  </div>
                )}

                {consultation.duration && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Duration</p>
                    <p className="text-gray-900 mt-1">{consultation.duration}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Urgency</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                    consultation.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                    consultation.urgency === 'urgent' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {consultation.urgency}
                  </span>
                </div>

                {consultation.diagnosis && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Diagnosis</p>
                    <p className="text-gray-900 mt-1">{consultation.diagnosis}</p>
                  </div>
                )}

                {consultation.treatment_plan && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Treatment Plan</p>
                    <p className="text-gray-900 mt-1">{consultation.treatment_plan}</p>
                  </div>
                )}

                {consultation.doctor_notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Doctor's Notes</p>
                    <p className="text-gray-900 mt-1">{consultation.doctor_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Status</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                consultation.status === 'completed' ? 'bg-green-100 text-green-700' :
                consultation.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                consultation.status === 'accepted' ? 'bg-indigo-100 text-indigo-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {consultation.status.replace('_', ' ')}
              </span>
              
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Created:</span>{' '}
                  {new Date(consultation.created_at).toLocaleDateString()}
                </div>
                {consultation.accepted_at && (
                  <div>
                    <span className="text-gray-500">Accepted:</span>{' '}
                    {new Date(consultation.accepted_at).toLocaleDateString()}
                  </div>
                )}
                {consultation.completed_at && (
                  <div>
                    <span className="text-gray-500">Completed:</span>{' '}
                    {new Date(consultation.completed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {['accepted', 'in_progress', 'scheduled'].includes(consultation.status) && (
                  <Link
                    href={`/gp/consultation/${consultation.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                  >
                    📹 Start Video Call
                  </Link>
                )}

                <Link
                  href={`/gp/consultations/${consultation.id}/prescribe`}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
                >
                  💊 Create Prescription
                </Link>

                <button
                  onClick={() => setShowDiagnosticForm(!showDiagnosticForm)}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-medium"
                >
                  🔬 Order Diagnostic Tests
                </button>

                <button
                  onClick={() => setShowReferralForm(!showReferralForm)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                  🏥 Refer to Specialist
                </button>

                {consultation.status === 'accepted' && (
                  <button
                    onClick={() => router.push(`/gp/consultations/${consultation.id}/complete`)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                  >
                    ✓ Complete Consultation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Referral Form Modal */}
        {showReferralForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Refer to Specialist</h2>
                  <button
                    onClick={() => setShowReferralForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                <form onSubmit={handleCreateReferral} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select specialization...</option>
                      {SPECIALIZATIONS.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency
                    </label>
                    <select
                      value={referralUrgency}
                      onChange={(e) => setReferralUrgency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Referral <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={referralReason}
                      onChange={(e) => setReferralReason(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Explain why this referral is needed..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical History & Notes
                    </label>
                    <textarea
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Relevant medical history, test results, etc..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowReferralForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReferral}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {submittingReferral ? 'Creating Referral...' : 'Create Referral'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Order Form Modal */}
        {showDiagnosticForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Order Diagnostic Tests</h2>
                  <button
                    onClick={() => setShowDiagnosticForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                <form onSubmit={handleCreateDiagnosticOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Tests <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-3">
                      {availableTests.map((test) => (
                        <label key={test} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTests.includes(test)}
                            onChange={() => toggleTestSelection(test)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{test}</span>
                        </label>
                      ))}
                    </div>
                    {selectedTests.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {selectedTests.length} test(s)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency
                    </label>
                    <select
                      value={diagnosticUrgency}
                      onChange={(e) => setDiagnosticUrgency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      value={diagnosticInstructions}
                      onChange={(e) => setDiagnosticInstructions(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Any special instructions for the diagnostic center or patient (e.g., fasting required, bring previous reports, etc.)"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowDiagnosticForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingDiagnostic || selectedTests.length === 0}
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {submittingDiagnostic ? 'Creating Order...' : 'Create Order'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
