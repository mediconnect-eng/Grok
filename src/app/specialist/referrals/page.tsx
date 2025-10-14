'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';

interface Referral {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  referring_provider_id: string;
  referring_provider_name: string;
  referring_provider_email: string;
  specialist_id: string | null;
  consultation_id: string | null;
  specialization: string;
  reason: string;
  medical_history: string | null;
  urgency: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
  updated_at: string;
  patient_profile: {
    medical_conditions: string | null;
    allergies: string | null;
    current_medications: string | null;
    blood_type: string | null;
  };
  original_consultation: {
    chief_complaint: string;
    symptoms: string;
    diagnosis: string;
  } | null;
}

export default function SpecialistReferralsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [declineNotes, setDeclineNotes] = useState('');

  useEffect(() => {
    if (!session?.user) {
      router.push('/specialist/login');
      return;
    }

    fetchReferrals();
    
    // Poll for new referrals every 10 seconds
    const interval = setInterval(fetchReferrals, 10000);
    return () => clearInterval(interval);
  }, [session, filter]);

  const fetchReferrals = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/referrals/specialist?specialistId=${session.user.id}&status=${filter}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }

      const data = await response.json();
      setReferrals(data.referrals || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (referralId: string, action: 'accept' | 'decline', notes?: string) => {
    setActionLoading(referralId);
    setError('');

    try {
      const response = await fetch(`/api/referrals/${referralId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          specialistId: session?.user?.id,
          notes: notes || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} referral`);
      }

      const data = await response.json();
      
      if (action === 'accept') {
        alert(`Referral accepted! Consultation created.`);
        router.push(`/specialist/consultations/${data.consultation.id}`);
      } else {
        alert('Referral declined.');
        setSelectedReferral(null);
        setDeclineNotes('');
      }

      // Refresh referrals list
      await fetchReferrals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-700';
      case 'urgent': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
              <p className="text-gray-600 mt-1">{session.user.name || 'Specialist'}</p>
            </div>
            <Link
              href="/specialist/consultations"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View Consultations →
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setFilter('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === 'pending'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('accepted')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === 'accepted'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Accepted
              </button>
              <button
                onClick={() => setFilter('declined')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === 'declined'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Declined
              </button>
            </nav>
          </div>
        </div>

        {/* Referrals List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading referrals...</p>
          </div>
        ) : referrals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {filter} referrals</h3>
            <p className="text-gray-500">
              {filter === 'pending' 
                ? 'New referrals will appear here when GPs refer patients to your specialization.'
                : `You have no ${filter} referrals.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <div key={referral.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {referral.patient_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(referral.urgency)}`}>
                        {referral.urgency}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                        {referral.specialization}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Referred by Dr. {referral.referring_provider_name} • {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {filter === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(referral.id, 'accept')}
                        disabled={actionLoading === referral.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        {actionLoading === referral.id ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => setSelectedReferral(referral)}
                        disabled={actionLoading === referral.id}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* Referral Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Reason for Referral</h4>
                    <p className="text-gray-900 text-sm">{referral.reason}</p>
                  </div>
                  
                  {referral.medical_history && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Medical History</h4>
                      <p className="text-gray-900 text-sm whitespace-pre-line">{referral.medical_history}</p>
                    </div>
                  )}
                </div>

                {/* Patient Medical Profile */}
                {(referral.patient_profile.medical_conditions || referral.patient_profile.allergies || referral.patient_profile.current_medications) && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Patient Medical Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {referral.patient_profile.medical_conditions && (
                        <div>
                          <p className="text-gray-500 font-medium">Medical Conditions</p>
                          <p className="text-gray-900 mt-1">{referral.patient_profile.medical_conditions}</p>
                        </div>
                      )}
                      {referral.patient_profile.allergies && (
                        <div>
                          <p className="text-gray-500 font-medium">Allergies</p>
                          <p className="text-gray-900 mt-1">{referral.patient_profile.allergies}</p>
                        </div>
                      )}
                      {referral.patient_profile.current_medications && (
                        <div>
                          <p className="text-gray-500 font-medium">Current Medications</p>
                          <p className="text-gray-900 mt-1">{referral.patient_profile.current_medications}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Original Consultation */}
                {referral.original_consultation && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Original Consultation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 font-medium">Chief Complaint</p>
                        <p className="text-gray-900 mt-1">{referral.original_consultation.chief_complaint}</p>
                      </div>
                      {referral.original_consultation.symptoms && (
                        <div>
                          <p className="text-gray-500 font-medium">Symptoms</p>
                          <p className="text-gray-900 mt-1">{referral.original_consultation.symptoms}</p>
                        </div>
                      )}
                      {referral.original_consultation.diagnosis && (
                        <div>
                          <p className="text-gray-500 font-medium">Diagnosis</p>
                          <p className="text-gray-900 mt-1">{referral.original_consultation.diagnosis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-600">
                  <span className="font-medium">Patient Contact:</span> {referral.patient_email}
                  {referral.patient_phone && ` • ${referral.patient_phone}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Decline Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Decline Referral</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to decline the referral for {selectedReferral.patient_name}?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Explain why you're declining this referral..."
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedReferral(null);
                    setDeclineNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedReferral.id, 'decline', declineNotes)}
                  disabled={actionLoading === selectedReferral.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {actionLoading === selectedReferral.id ? 'Declining...' : 'Decline Referral'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
