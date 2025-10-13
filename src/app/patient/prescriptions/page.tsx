'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import PrescriptionCard from '@/components/PrescriptionCard';
import { useSharedState } from '@/lib/use-shared-state';

export default function PatientPrescriptions() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const sharedState = useSharedState();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-ink">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/patient/login');
    return null;
  }

  const patientName = session.user.name || 'Patient';
  const patientPrescriptions = sharedState.prescriptions.filter(
    (prescription) => prescription.patientName === patientName
  );

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/patient/home" className="text-gray-400 hover:text-gray-600">
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-700">
                Mediconnect
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-ink">Patient Portal</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-700">My Prescriptions</h1>
          <p className="mt-2 text-ink">View and manage your prescriptions</p>
        </div>

        {patientPrescriptions.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <div className="text-6xl mb-4">🙂</div>
            <h3 className="text-xl font-semibold text-primary-700 mb-2">No prescriptions yet</h3>
            <p className="text-ink mb-6">
              You don&apos;t have any active prescriptions at the moment. Prescriptions from your consultations will appear here.
            </p>
            <Link
              href="/patient/home"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-button text-white bg-primary-500 hover:bg-primary-700"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-card shadow-card p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Active prescriptions</h3>
                  <p className="text-sm text-gray-500">
                    Tap a prescription to expose its QR code and share with your pharmacy.
                  </p>
                </div>
                <div className="text-sm text-primary-700">{patientPrescriptions.length}</div>
              </div>
            </div>

            <div className="space-y-6">
              {patientPrescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={{
                    id: prescription.id,
                    dateIssued: new Date(prescription.createdAt).toLocaleDateString(),
                    qrToken: prescription.qrToken,
                    status: prescription.status,
                    items: prescription.items
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
