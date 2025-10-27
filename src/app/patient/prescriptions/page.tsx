'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

interface Prescription {
  id: string;
  consultation_id: string;
  provider_id: string;
  provider_name: string;
  diagnosis: string | null;
  notes: string;
  status: string;
  pharmacy_id: string | null;
  created_at: string;
  fulfilled_at: string | null;
}

export default function PatientPrescriptions() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/patient/login');
      return;
    }

    if (session?.user?.id) {
      fetchPrescriptions();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchPrescriptions, 10000);
      return () => clearInterval(interval);
    }
  }, [session, isPending, router]);

  const fetchPrescriptions = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/prescriptions/create?patientId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }

      const data = await response.json();
      setPrescriptions(data.prescriptions || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'preparing': return 'bg-blue-100 text-blue-700';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'delivered': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Being Prepared';
      case 'ready': return 'Ready for Pickup';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const parseMedications = (notes: string) => {
    try {
      // Extract medications JSON from notes
      const medicationsMatch = notes.match(/Medications:\n(\[[\s\S]*?\])/);
      if (medicationsMatch) {
        return JSON.parse(medicationsMatch[1]);
      }
    } catch (e) {
      console.error('Failed to parse medications:', e);
    }
    return [];
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-ink-light">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/patient/home" className="text-ink-light hover:text-ink transition">
                ← Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Mediconnect
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-ink-light">Patient Portal</span>
              <button
                onClick={handleLogout}
                className="text-sm text-ink-light hover:text-ink transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">My Prescriptions</h1>
          <p className="mt-2 text-ink-light">View and track your medications</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button mb-6">
            {error}
          </div>
        )}

        {/* Prescriptions List */}
        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-ink mb-2">No Prescriptions Yet</h3>
            <p className="text-ink-light mb-6">
              You don&apos;t have any prescriptions at the moment. Prescriptions from your consultations will appear here.
            </p>
            <Link
              href="/patient/consultations/request"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-button hover:bg-primary-700 transition font-semibold"
            >
              Request Consultation
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-card shadow-card p-4">
                <div className="text-sm text-ink-light">Total</div>
                <div className="text-2xl font-bold text-ink">{prescriptions.length}</div>
              </div>
              <div className="bg-yellow-50 rounded-card shadow-card p-4">
                <div className="text-sm text-yellow-700">Pending</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {prescriptions.filter(p => p.status === 'pending').length}
                </div>
              </div>
              <div className="bg-blue-50 rounded-card shadow-card p-4">
                <div className="text-sm text-blue-700">In Progress</div>
                <div className="text-2xl font-bold text-blue-700">
                  {prescriptions.filter(p => p.status === 'preparing').length}
                </div>
              </div>
              <div className="bg-green-50 rounded-card shadow-card p-4">
                <div className="text-sm text-green-700">Ready</div>
                <div className="text-2xl font-bold text-green-700">
                  {prescriptions.filter(p => p.status === 'ready').length}
                </div>
              </div>
            </div>

            {/* Prescription Cards */}
            <div className="space-y-4">
              {prescriptions.map((prescription) => {
                const medications = parseMedications(prescription.notes);
                
                return (
                  <div key={prescription.id} className="bg-white rounded-card shadow-card p-6 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-ink">
                            Prescription from Dr. {prescription.provider_name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.status)}`}>
                            {getStatusText(prescription.status)}
                          </span>
                          {!prescription.pharmacy_id && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                              📋 Choose Pharmacy
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink-light">
                          {new Date(prescription.created_at).toLocaleDateString()} at{' '}
                          {new Date(prescription.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {!prescription.pharmacy_id ? (
                          <Link
                            href={`/patient/prescriptions/${prescription.id}`}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium text-sm"
                          >
                            Choose Pharmacy
                          </Link>
                        ) : (
                          <Link
                            href={`/patient/prescriptions/${prescription.id}`}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                    </div>

                    {prescription.diagnosis && (
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-ink">Diagnosis:</span>
                        <p className="text-ink-light">{prescription.diagnosis}</p>
                      </div>
                    )}

                    {medications.length > 0 && (
                      <div className="bg-gray-50 rounded-button p-4">
                        <h4 className="text-sm font-semibold text-ink mb-2">Medications:</h4>
                        <div className="space-y-2">
                          {medications.map((med: any, index: number) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium text-ink">{med.name}</div>
                              <div className="text-ink-light">
                                {med.dosage} • {med.frequency} • {med.duration}
                              </div>
                              {med.instructions && (
                                <div className="text-ink-light italic">{med.instructions}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {prescription.status === 'ready' && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-button p-3">
                        <p className="text-green-700 font-medium text-sm">
                          ✓ Your prescription is ready for pickup!
                        </p>
                      </div>
                    )}

                    {prescription.status === 'delivered' && (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-button p-3">
                        <p className="text-gray-700 font-medium text-sm">
                          ✓ Prescription delivered
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
