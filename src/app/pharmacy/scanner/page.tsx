'use client';

import { useState } from 'react';
import Link from 'next/link';
import PrescriptionCard from '@/components/PrescriptionCard';
import { selectActivePrescription, SharedPrescription, upsertPrescription } from '@/lib/shared-state';
import { useSharedState } from '@/lib/use-shared-state';

export default function PharmacyScanner() {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sharedState = useSharedState();

  const activePrescription: SharedPrescription | undefined = sharedState.activePrescriptionId
    ? sharedState.prescriptions.find((p) => p.id === sharedState.activePrescriptionId)
    : undefined;

  const handleScan = async () => {
    if (!qrCode.trim()) {
      setError('Please enter a QR code');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      const match = sharedState.prescriptions.find(
        (prescription) => prescription.qrToken.toLowerCase() === qrCode.trim().toLowerCase()
      );
      if (match) {
        selectActivePrescription(match.id);
        setError('');
      } else {
        setError('Invalid QR code. Please try again.');
      }
      setLoading(false);
    }, 400);
  };

  const handleDispense = () => {
    if (!activePrescription) return;
    upsertPrescription({ ...activePrescription, status: 'filled' });
    alert('Prescription marked as dispensed.');
    selectActivePrescription(null);
    setQrCode('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                HealthHub
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Pharmacy Portal - Anytown Pharmacy</span>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Prescription Scanner</h1>
          <p className="mt-2 text-gray-600">Scan QR codes to verify and dispense prescriptions</p>
        </div>

        {!activePrescription ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4"></div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Scan Prescription QR Code</h2>
              <p className="text-gray-600">Enter the QR code from the patient&apos;s prescription</p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code
                </label>
                <input
                  type="text"
                  id="qrCode"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Enter QR code (try: QR123456789)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {error && (
                <div className="mb-4 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Prescription'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-600 text-2xl mr-3"></div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Prescription Verified</h3>
                  <p className="text-green-700">This prescription is valid and ready for dispensing.</p>
                </div>
              </div>
            </div>

            <PrescriptionCard
              prescription={{
                id: activePrescription.id,
                dateIssued: new Date(activePrescription.createdAt).toLocaleDateString(),
                qrToken: activePrescription.qrToken,
                status: activePrescription.status,
                items: activePrescription.items
              }}
              showItemsOnly={true}
            />

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispensing Actions</h3>
              <div className="flex space-x-4">
                <button
                  onClick={handleDispense}
                  className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Dispense Medication
                </button>
                <button
                  onClick={() => selectActivePrescription(null)}
                  className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
