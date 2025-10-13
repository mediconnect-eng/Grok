'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

interface Consultation {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  patient_dob: string | null;
  chief_complaint: string;
  symptoms: string | null;
  duration: string | null;
  urgency: string;
  status: string;
  consultation_fee: number;
  created_at: string;
  blood_group: string | null;
  allergies: string | null;
  current_medications: string | null;
  medical_history: string | null;
}

export default function GPConsultationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push('/gp/login');
      return;
    }

    fetchConsultations();
    
    // Poll for new consultations every 5 seconds
    const interval = setInterval(fetchConsultations, 5000);
    return () => clearInterval(interval);
  }, [session, router, filter]);

  const fetchConsultations = async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch pending (unassigned) and accepted (assigned to this GP)
      let url = `/api/consultations/provider?providerType=gp`;
      
      if (filter === 'accepted') {
        url = `/api/consultations/provider?providerId=${session.user.id}&status=accepted`;
      } else if (filter === 'pending') {
        url = `/api/consultations/provider?providerType=gp&status=pending`;
      } else {
        url = `/api/consultations/provider?providerId=${session.user.id}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch consultations');
      }

      const data = await response.json();
      setConsultations(data.consultations || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (consultationId: string) => {
    if (!session?.user?.id) return;

    setActionLoading(consultationId);

    try {
      const response = await fetch(`/api/consultations/${consultationId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: session.user.id,
          action: 'accept',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept consultation');
      }

      alert('Consultation accepted! The patient has been notified.');
      fetchConsultations(); // Refresh list

    } catch (err: any) {
      console.error('Accept error:', err);
      alert(err.message || 'Failed to accept consultation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (consultationId: string) => {
    if (!confirm('Are you sure you want to decline this consultation request?')) {
      return;
    }

    if (!session?.user?.id) return;

    setActionLoading(consultationId);

    try {
      const response = await fetch(`/api/consultations/${consultationId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: session.user.id,
          action: 'decline',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline consultation');
      }

      alert('Consultation declined.');
      fetchConsultations(); // Refresh list

    } catch (err: any) {
      console.error('Decline error:', err);
      alert(err.message || 'Failed to decline consultation');
    } finally {
      setActionLoading(null);
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

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-ink-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-ink-light">Loading consultations...</p>
        </div>
      </div>
    );
  }

  const pendingCount = consultations.filter(c => c.status === 'pending').length;
  const acceptedCount = consultations.filter(c => c.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ink">GP Dashboard</h1>
              <p className="text-ink-light mt-1">Dr. {session.user.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-ink-light">Pending Requests</div>
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-ink-light">My Active</div>
                <div className="text-2xl font-bold text-blue-600">{acceptedCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-card shadow-card p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-button font-medium transition ${
                filter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Requests ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-button font-medium transition ${
                filter === 'accepted'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Consultations ({acceptedCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-button font-medium transition ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button mb-6">
            {error}
          </div>
        )}

        {/* Consultations List */}
        {consultations.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-ink mb-2">No Consultations</h3>
            <p className="text-ink-light">
              {filter === 'pending' && 'No pending consultation requests at the moment.'}
              {filter === 'accepted' && "You haven't accepted any consultations yet."}
              {filter === 'all' && 'No consultations found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div key={consultation.id} className="bg-white rounded-card shadow-card p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Patient Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold text-lg">
                          {consultation.patient_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-ink">{consultation.patient_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-ink-light">
                          <span>{consultation.patient_email}</span>
                          {consultation.patient_phone && <span>• {consultation.patient_phone}</span>}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(consultation.urgency)}`}>
                        {consultation.urgency.toUpperCase()}
                      </span>
                    </div>

                    {/* Chief Complaint */}
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-ink mb-1">Chief Complaint:</h4>
                      <p className="text-ink">{consultation.chief_complaint}</p>
                    </div>

                    {/* Additional Info */}
                    {consultation.symptoms && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-ink mb-1">Symptoms:</h4>
                        <p className="text-sm text-ink-light">{consultation.symptoms}</p>
                      </div>
                    )}

                    {consultation.duration && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-ink mb-1">Duration:</h4>
                        <p className="text-sm text-ink-light">{consultation.duration}</p>
                      </div>
                    )}

                    {/* Medical History */}
                    {(consultation.allergies || consultation.current_medications || consultation.blood_group) && (
                      <div className="bg-gray-50 rounded-button p-3 mb-3">
                        <h4 className="text-sm font-semibold text-ink mb-2">Medical Information:</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {consultation.blood_group && (
                            <div>
                              <span className="text-ink-light">Blood Group:</span>
                              <span className="ml-2 font-medium text-ink">{consultation.blood_group}</span>
                            </div>
                          )}
                          {consultation.allergies && (
                            <div>
                              <span className="text-ink-light">Allergies:</span>
                              <span className="ml-2 font-medium text-red-600">{consultation.allergies}</span>
                            </div>
                          )}
                          {consultation.current_medications && (
                            <div>
                              <span className="text-ink-light">Medications:</span>
                              <span className="ml-2 font-medium text-ink">{consultation.current_medications}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-ink-light">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(consultation.created_at).toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${consultation.consultation_fee}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-6">
                    {consultation.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAccept(consultation.id)}
                          disabled={actionLoading === consultation.id}
                          className="bg-green-600 text-white px-6 py-2 rounded-button hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
                        >
                          {actionLoading === consultation.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleDecline(consultation.id)}
                          disabled={actionLoading === consultation.id}
                          className="border border-red-600 text-red-600 px-6 py-2 rounded-button hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
                        >
                          Decline
                        </button>
                      </>
                    ) : consultation.status === 'accepted' ? (
                      <>
                        <Link
                          href={`/gp/consultations/${consultation.id}`}
                          className="bg-primary-600 text-white px-6 py-2 rounded-button hover:bg-primary-700 transition font-semibold text-center whitespace-nowrap"
                        >
                          Start Consultation
                        </Link>
                        <Link
                          href={`/gp/consultations/${consultation.id}/prescribe`}
                          className="bg-purple-600 text-white px-6 py-2 rounded-button hover:bg-purple-700 transition font-semibold text-center whitespace-nowrap"
                        >
                          Prescribe
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/gp/consultations/${consultation.id}`}
                        className="bg-primary-600 text-white px-6 py-2 rounded-button hover:bg-primary-700 transition font-semibold text-center whitespace-nowrap"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
