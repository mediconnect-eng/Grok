'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import PrescriptionForm from '@/components/PrescriptionForm';

interface ConsultationDetails {
  id: string;
  patient_id: string;
  patient_name: string;
  chief_complaint: string;
  symptoms: string | null;
  status: string;
}

export default function CreatePrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const consultationId = params.id as string;
  
  const [consultation, setConsultation] = useState<ConsultationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.user) {
      router.push('/gp/login');
      return;
    }

    fetchConsultationDetails();
  }, [session, consultationId]);

  const fetchConsultationDetails = async () => {
    try {
      // For now, we'll fetch from the provider endpoint
      // In production, you'd have a dedicated consultation details endpoint
      const response = await fetch(`/api/consultations/provider?providerId=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch consultation details');
      }

      const data = await response.json();
      const foundConsultation = data.consultations.find(
        (c: ConsultationDetails) => c.id === consultationId
      );

      if (!foundConsultation) {
        throw new Error('Consultation not found');
      }

      setConsultation(foundConsultation);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    // Redirect back to consultations dashboard
    router.push('/gp/consultations');
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
          <p className="text-ink-light">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-card p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-red-700 mb-4">{error || 'Consultation not found'}</p>
            <button
              onClick={() => router.push('/gp/consultations')}
              className="bg-primary-600 text-white px-6 py-2 rounded-button hover:bg-primary-700 transition"
            >
              Back to Consultations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ink">Create Prescription</h1>
              <p className="text-ink-light mt-1">For: {consultation.patient_name}</p>
            </div>
            <button
              onClick={() => router.push('/gp/consultations')}
              className="text-ink-light hover:text-ink transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-card shadow-card p-6">
          {/* Consultation Summary */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-ink mb-3">Consultation Summary</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-ink-light">Chief Complaint:</span>
                <p className="text-ink">{consultation.chief_complaint}</p>
              </div>
              {consultation.symptoms && (
                <div>
                  <span className="text-sm font-medium text-ink-light">Symptoms:</span>
                  <p className="text-ink">{consultation.symptoms}</p>
                </div>
              )}
            </div>
          </div>

          {/* Prescription Form */}
          <PrescriptionForm
            consultationId={consultation.id}
            patientId={consultation.patient_id}
            patientName={consultation.patient_name}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
