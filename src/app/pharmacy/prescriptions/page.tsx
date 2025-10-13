'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

interface Prescription {
  id: string;
  consultation_id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  provider_id: string;
  provider_name: string;
  diagnosis: string | null;
  notes: string;
  status: string;
  created_at: string;
  fulfilled_at: string | null;
}

export default function PharmacyPrescriptionsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'delivered'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push('/pharmacy/login');
      return;
    }

    fetchPrescriptions();
    
    // Poll for new prescriptions every 10 seconds
    const interval = setInterval(fetchPrescriptions, 10000);
    return () => clearInterval(interval);
  }, [session, router, filter]);

  const fetchPrescriptions = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/prescriptions/create?pharmacyId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }

      const data = await response.json();
      let filteredPrescriptions = data.prescriptions || [];
      
      // Apply filter
      if (filter !== 'all') {
        filteredPrescriptions = filteredPrescriptions.filter(
          (p: Prescription) => p.status === filter
        );
      }
      
      setPrescriptions(filteredPrescriptions);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (prescriptionId: string, newStatus: string) => {
    if (!session?.user?.id) return;

    setActionLoading(prescriptionId);

    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pharmacyId: session.user.id,
          pharmacyName: session.user.name || 'Pharmacy',
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update prescription');
      }

      alert(`Prescription status updated to: ${newStatus}`);
      fetchPrescriptions(); // Refresh list

    } catch (err: any) {
      console.error('Update error:', err);
      alert(err.message || 'Failed to update prescription');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'preparing': return 'text-blue-600 bg-blue-50';
      case 'ready': return 'text-green-600 bg-green-50';
      case 'delivered': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const parseMedications = (notes: string) => {
    try {
      const medicationsMatch = notes.match(/Medications:\n(\[[\s\S]*?\])/);
      if (medicationsMatch) {
        return JSON.parse(medicationsMatch[1]);
      }
    } catch (e) {
      console.error('Failed to parse medications:', e);
    }
    return [];
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
          <p className="text-ink-light">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  const allPrescriptions = prescriptions;
  const pendingCount = allPrescriptions.filter(p => p.status === 'pending').length;
  const preparingCount = allPrescriptions.filter(p => p.status === 'preparing').length;
  const readyCount = allPrescriptions.filter(p => p.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ink">Pharmacy Dashboard</h1>
              <p className="text-ink-light mt-1">{session.user.name || 'Pharmacy'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-ink-light">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-ink-light">Preparing</div>
                <div className="text-2xl font-bold text-blue-600">{preparingCount}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-ink-light">Ready</div>
                <div className="text-2xl font-bold text-green-600">{readyCount}</div>
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
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('preparing')}
              className={`px-4 py-2 rounded-button font-medium transition ${
                filter === 'preparing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Preparing ({preparingCount})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-4 py-2 rounded-button font-medium transition ${
                filter === 'ready'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ready ({readyCount})
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

        {/* Prescriptions List */}
        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-ink mb-2">No Prescriptions</h3>
            <p className="text-ink-light">
              {filter === 'pending' && 'No pending prescriptions at the moment.'}
              {filter === 'preparing' && 'No prescriptions being prepared.'}
              {filter === 'ready' && 'No prescriptions ready for pickup.'}
              {filter === 'all' && 'No prescriptions found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => {
              const medications = parseMedications(prescription.notes);
              
              return (
                <div key={prescription.id} className="bg-white rounded-card shadow-card p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Patient Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-lg">
                            {prescription.patient_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-ink">{prescription.patient_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-ink-light">
                            <span>{prescription.patient_email}</span>
                            {prescription.patient_phone && <span>• {prescription.patient_phone}</span>}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.status)}`}>
                          {prescription.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Prescription Details */}
                      <div className="mb-3">
                        <div className="text-sm text-ink-light mb-1">
                          Prescribed by Dr. {prescription.provider_name} on{' '}
                          {new Date(prescription.created_at).toLocaleDateString()}
                        </div>
                        {prescription.diagnosis && (
                          <div className="mt-2">
                            <span className="text-sm font-semibold text-ink">Diagnosis:</span>
                            <p className="text-ink-light">{prescription.diagnosis}</p>
                          </div>
                        )}
                      </div>

                      {/* Medications */}
                      {medications.length > 0 && (
                        <div className="bg-gray-50 rounded-button p-4 mb-3">
                          <h4 className="text-sm font-semibold text-ink mb-2">Medications to Prepare:</h4>
                          <div className="space-y-3">
                            {medications.map((med: any, index: number) => (
                              <div key={index} className="border-l-4 border-primary-600 pl-3">
                                <div className="font-semibold text-ink">{med.name}</div>
                                <div className="text-sm text-ink-light">
                                  <span className="font-medium">Dosage:</span> {med.dosage}
                                </div>
                                <div className="text-sm text-ink-light">
                                  <span className="font-medium">Frequency:</span> {med.frequency}
                                </div>
                                <div className="text-sm text-ink-light">
                                  <span className="font-medium">Duration:</span> {med.duration}
                                </div>
                                {med.instructions && (
                                  <div className="text-sm text-ink-light italic mt-1">
                                    Instructions: {med.instructions}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-6">
                      {prescription.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(prescription.id, 'preparing')}
                          disabled={actionLoading === prescription.id}
                          className="bg-blue-600 text-white px-6 py-2 rounded-button hover:bg-blue-700 transition disabled:opacity-50 font-semibold whitespace-nowrap"
                        >
                          {actionLoading === prescription.id ? 'Processing...' : 'Start Preparing'}
                        </button>
                      )}
                      
                      {prescription.status === 'preparing' && (
                        <button
                          onClick={() => handleStatusUpdate(prescription.id, 'ready')}
                          disabled={actionLoading === prescription.id}
                          className="bg-green-600 text-white px-6 py-2 rounded-button hover:bg-green-700 transition disabled:opacity-50 font-semibold whitespace-nowrap"
                        >
                          {actionLoading === prescription.id ? 'Processing...' : 'Mark as Ready'}
                        </button>
                      )}
                      
                      {prescription.status === 'ready' && (
                        <button
                          onClick={() => handleStatusUpdate(prescription.id, 'delivered')}
                          disabled={actionLoading === prescription.id}
                          className="bg-gray-600 text-white px-6 py-2 rounded-button hover:bg-gray-700 transition disabled:opacity-50 font-semibold whitespace-nowrap"
                        >
                          {actionLoading === prescription.id ? 'Processing...' : 'Mark as Delivered'}
                        </button>
                      )}

                      {prescription.status !== 'delivered' && prescription.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusUpdate(prescription.id, 'cancelled')}
                          disabled={actionLoading === prescription.id}
                          className="border border-red-600 text-red-600 px-6 py-2 rounded-button hover:bg-red-50 transition disabled:opacity-50 font-semibold whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
