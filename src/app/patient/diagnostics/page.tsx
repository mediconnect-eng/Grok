'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useSharedState } from '@/lib/use-shared-state';
import { DiagnosticOrder } from '@/lib/shared-state';

export default function PatientDiagnostics() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const sharedState = useSharedState();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handleSpecialists = () => router.push('/patient/specialists');
  const handlePharmacy = () => router.push('/patient/prescriptions');
  const handleCare = () => router.push('/patient/home');
  const handleDiagnostics = () => router.push('/patient/diagnostics');
  const handleProfile = () => router.push('/patient/profile');

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading diagnostics...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/patient/login');
    return null;
  }

  const patientName = session.user.name || 'Patient';
  const orders: DiagnosticOrder[] =
    sharedState.referrals
      .filter((referral) => referral.patientName === patientName)
      .flatMap((referral) => referral.diagnostics) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/patient/home" className="text-gray-400 hover:text-gray-600">
                 Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Mediconnect
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Patient Portal</span>
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
          <h1 className="text-3xl font-bold text-gray-900">My Lab Results</h1>
          <p className="mt-2 text-gray-600">View your diagnostic test results</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <div className="text-6xl mb-4">🩺</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No diagnostic tests yet</h3>
            <p className="text-gray-600 mb-6">
              Your lab test results and diagnostic orders will appear here once your specialist requests them.
            </p>
            <Link
              href="/patient/home"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-button text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.testName}</h3>
                      <p className="text-sm text-gray-600">Ordered: {order.orderedOn}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                {order.resultUrl ? (
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View result file
                  </button>
                ) : (
                  <p className="text-sm text-gray-600">Results pending. You will be notified once they are ready.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <button onClick={handleSpecialists} className="text-xs text-gray-600 hover:text-indigo-600">
              Specialists
            </button>
            <button onClick={handlePharmacy} className="text-xs text-gray-600 hover:text-indigo-600">
              Pharmacy
            </button>
            <button onClick={handleCare} className="text-xs text-gray-600 hover:text-indigo-600">
              Care
            </button>
            <button onClick={handleDiagnostics} className="text-xs text-indigo-600">
              Diagnostics
            </button>
            <button onClick={handleProfile} className="text-xs text-gray-600 hover:text-indigo-600">
              Profile
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
