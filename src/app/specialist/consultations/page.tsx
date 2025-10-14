'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';

interface Consultation {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  chief_complaint: string;
  symptoms: string | null;
  urgency: string;
  status: string;
  diagnosis: string | null;
  created_at: string;
  accepted_at: string | null;
  referral_reason?: string;
  medical_history?: string;
  referring_provider_name?: string;
}

export default function SpecialistConsultationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');

  useEffect(() => {
    if (!session?.user) {
      router.push('/specialist/login');
      return;
    }
    fetchConsultations();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchConsultations, 10000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchConsultations = async () => {
    try {
      const response = await fetch(`/api/consultations/provider?providerId=${session?.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch consultations');
      
      const data = await response.json();
      setConsultations(data.consultations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultations = consultations.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'accepted') return c.status === 'accepted' || c.status === 'in_progress';
    if (filter === 'completed') return c.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'accepted': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-700';
      case 'urgent': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/specialist" className="text-purple-600 hover:text-purple-700">
              ← Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900">My Consultations</h1>
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

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2">
            {(['all', 'pending', 'accepted', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'all' && ` (${consultations.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Consultations List */}
        {filteredConsultations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No consultations found
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'You have no consultations yet.'
                : `No ${filter} consultations at the moment.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <Link
                key={consultation.id}
                href={`/specialist/consultations/${consultation.id}`}
                className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {consultation.patient_name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                        {consultation.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(consultation.urgency)}`}>
                        {consultation.urgency}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Chief Complaint:</span> {consultation.chief_complaint}
                    </p>
                    
                    {consultation.symptoms && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Symptoms:</span> {consultation.symptoms}
                      </p>
                    )}

                    {consultation.referral_reason && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Referral Reason:</span> {consultation.referral_reason}
                      </p>
                    )}

                    {consultation.referring_provider_name && (
                      <p className="text-sm text-gray-500 mb-1">
                        Referred by: Dr. {consultation.referring_provider_name}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Created: {new Date(consultation.created_at).toLocaleDateString()}</span>
                      {consultation.accepted_at && (
                        <span>Accepted: {new Date(consultation.accepted_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
