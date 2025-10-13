'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

interface Consultation {
  id: string;
  provider_id: string | null;
  provider_name: string | null;
  provider_type: string;
  chief_complaint: string;
  symptoms: string | null;
  urgency: string;
  status: string;
  consultation_fee: number;
  created_at: string;
  accepted_at: string | null;
  provider_email: string | null;
}

export default function PatientConsultationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');

  useEffect(() => {
    if (!session?.user) {
      router.push('/patient/login');
      return;
    }

    fetchConsultations();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchConsultations, 10000);
    return () => clearInterval(interval);
  }, [session, router]);

  const fetchConsultations = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/consultations/create?patientId=${session.user.id}`);
      
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

  const filteredConsultations = consultations.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'routine': return 'text-green-600';
      case 'urgent': return 'text-orange-600';
      case 'emergency': return 'text-red-600';
      default: return 'text-gray-600';
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/patient/home" className="text-primary-600 hover:text-primary-700 mb-2 inline-flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-ink">My Consultations</h1>
            <p className="text-ink-light mt-1">View and manage your healthcare consultations</p>
          </div>
          <Link
            href="/patient/consultations/request"
            className="bg-primary-600 text-white px-6 py-3 rounded-button hover:bg-primary-700 transition font-semibold"
          >
            + New Consultation
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-card shadow-card p-4">
            <div className="text-sm text-ink-light">Total</div>
            <div className="text-2xl font-bold text-ink">{consultations.length}</div>
          </div>
          <div className="bg-white rounded-card shadow-card p-4">
            <div className="text-sm text-ink-light">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {consultations.filter(c => c.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white rounded-card shadow-card p-4">
            <div className="text-sm text-ink-light">Active</div>
            <div className="text-2xl font-bold text-blue-600">
              {consultations.filter(c => ['accepted', 'in_progress'].includes(c.status)).length}
            </div>
          </div>
          <div className="bg-white rounded-card shadow-card p-4">
            <div className="text-sm text-ink-light">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {consultations.filter(c => c.status === 'completed').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-card shadow-card p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
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
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-button font-medium transition ${
                filter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-button font-medium transition ${
                filter === 'accepted'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-button font-medium transition ${
                filter === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
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
        {filteredConsultations.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-ink mb-2">No Consultations Yet</h3>
            <p className="text-ink-light mb-6">
              {filter === 'all' 
                ? "You haven't requested any consultations yet."
                : `No ${filter} consultations found.`
              }
            </p>
            <Link
              href="/patient/consultations/request"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-button hover:bg-primary-700 transition font-semibold"
            >
              Request Your First Consultation
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <div key={consultation.id} className="bg-white rounded-card shadow-card p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(consultation.status)}`}>
                        {consultation.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`text-sm font-medium ${getUrgencyColor(consultation.urgency)}`}>
                        {consultation.urgency.charAt(0).toUpperCase() + consultation.urgency.slice(1)}
                      </span>
                      <span className="text-sm text-ink-light">
                        {consultation.provider_type === 'gp' ? 'General Practitioner' : 'Specialist'}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-ink mb-2">
                      {consultation.chief_complaint}
                    </h3>

                    {consultation.symptoms && (
                      <p className="text-sm text-ink-light mb-3">
                        <strong>Symptoms:</strong> {consultation.symptoms}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-ink-light">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(consultation.created_at).toLocaleDateString()}
                      </div>
                      {consultation.provider_name ? (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Dr. {consultation.provider_name}
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Waiting for doctor
                        </div>
                      )}
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${consultation.consultation_fee}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {consultation.status === 'accepted' || consultation.status === 'in_progress' ? (
                      <Link
                        href={`/patient/consultations/${consultation.id}`}
                        className="bg-primary-600 text-white px-4 py-2 rounded-button hover:bg-primary-700 transition text-sm font-semibold text-center"
                      >
                        Join Consultation
                      </Link>
                    ) : (
                      <Link
                        href={`/patient/consultations/${consultation.id}`}
                        className="border border-primary-600 text-primary-600 px-4 py-2 rounded-button hover:bg-primary-50 transition text-sm font-semibold text-center"
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
