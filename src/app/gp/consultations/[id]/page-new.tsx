'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Consultation {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  chief_complaint: string;
  consultation_type: 'video' | 'chat';
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

export default function GPConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;
  const [gpUser, setGpUser] = useState<any>(null);

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    }
  }, [gpUser, consultationId]);

  const fetchConsultation = async () => {
    if (!gpUser) return;
    
    try {
      const response = await fetch(`/api/consultations/provider?providerId=${gpUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch consultation');
      
      const data = await response.json();
      const found = data.consultations.find((c: Consultation) => c.id === consultationId);
      
      if (!found) throw new Error('Consultation not found');
      
      setConsultation(found);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'routine': return 'text-green-600 bg-green-50';
      case 'urgent': return 'text-orange-600 bg-orange-50';
      case 'emergency': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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
            <Link href="/gp/consultations" className="text-primary-600 hover:text-primary-700">
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

                <div>
                  <p className="text-sm font-medium text-gray-500">Consultation Type</p>
                  <div className="mt-1 flex items-center gap-2">
                    {consultation.consultation_type === 'video' ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                          📹 Video Call
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                          💬 Text Chat
                        </span>
                      </>
                    )}
                  </div>
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
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(consultation.urgency)}`}>
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
                  <>
                    {consultation.consultation_type === 'video' ? (
                      <Link
                        href={`/gp/consultation/${consultation.id}`}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-button hover:bg-primary-700 font-semibold transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        Start Video Call
                      </Link>
                    ) : (
                      <Link
                        href={`/gp/consultations/${consultation.id}/chat`}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-button hover:bg-purple-700 font-semibold transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        Start Chat
                      </Link>
                    )}
                  </>
                )}

                <Link
                  href={`/gp/consultations/${consultation.id}/prescribe`}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-button hover:bg-purple-700 font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Create Prescription
                </Link>

                {consultation.status === 'accepted' && (
                  <button
                    onClick={() => router.push(`/gp/consultations/${consultation.id}/complete`)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-button hover:bg-green-700 font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Complete Consultation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
