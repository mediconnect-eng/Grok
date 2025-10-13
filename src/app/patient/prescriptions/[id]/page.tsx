'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PrescriptionCard from '@/components/PrescriptionCard';
import prescriptionsData from '@/data/prescriptions.json';

interface Prescription {
  id: string;
  patientId: string;
  gpId: string;
  dateIssued: string;
  qrToken: string;
  status: string;
  pharmacyId: string;
  pharmacyName: string;
  items: Array<{
    name: string;
    dosage: string;
    quantity: number;
    instructions: string;
  }>;
}

const prescriptions: Prescription[] = prescriptionsData as Prescription[];

interface PageProps {
  params: {
    id: string;
  };
}

export default function PrescriptionDetailPage({ params }: PageProps) {
  const router = useRouter();
  const prescription = prescriptions.find((p: Prescription) => p.id === params.id);

  const handleEmergency = () => {
    alert('Emergency services contacted! Help is on the way.');
  };

  const handlePickPharmacy = () => {
    alert('Pick from Verified Pharmacy feature coming soon!');
  };

  const handleOrderDelivery = () => {
    alert('Home delivery order placed! Expected delivery in 2-3 hours.');
  };

  const handleSpecialists = () => {
    router.push('/patient/specialists');
  };

  const handlePharmacy = () => {
    router.push('/patient/prescriptions');
  };

  const handleCare = () => {
    router.push('/patient/home');
  };

  const handleDiagnostics = () => {
    router.push('/patient/diagnostics');
  };

  const handleProfile = () => {
    router.push('/patient/profile');
  };

  if (!prescription) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-700 mb-4">Prescription Not Found</h1>
          <Link href="/patient/prescriptions" className="text-primary-600 hover:text-primary-700">
            ← Back to Prescriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/patient/prescriptions" className="text-primary-600 hover:text-primary-700">
              ← Back to Prescriptions
            </Link>
            <h1 className="text-lg font-semibold text-primary-700">Prescription Details</h1>
            <button 
              onClick={handleEmergency}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Emergency
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Status card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Ready for collection</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-sm font-medium">Ready</span>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">Prescription ID: {prescription.id}</div>
          </div>

          {/* Medications list */}
          <section className="mt-6 space-y-4">
            <h2 className="text-md font-semibold text-neutral-900">Medications</h2>
            <div className="space-y-3">
              {prescription.items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-md p-3">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.dosage}</div>
                  <div className="text-sm text-gray-500 mt-1">{item.instructions}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <Link 
              href={`/patient/prescriptions/${prescription.id}/qr`} 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Show QR Code
            </Link>
            <button 
              onClick={handlePickPharmacy}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Pick from Verified Pharmacy
            </button>
            <button className="ml-auto inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-md">🔽</button>
          </div>

          {/* History */}
          <div className="mt-8 bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold">Prescription History</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <div className="flex justify-between">
                  <div>Prescription issued</div>
                  <div className="text-gray-500">286d ago</div>
                </div>
              </li>
              <li>
                <div className="flex justify-between">
                  <div>Prescription verified</div>
                  <div className="text-gray-500">286d ago</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleOrderDelivery}
              className="w-full bg-white border border-gray-200 rounded-md py-3 hover:bg-gray-50"
            >
              Order Home Delivery
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <button 
              onClick={handleSpecialists}
              className="text-xs text-gray-600 hover:text-indigo-600"
            >
              Specialists
            </button>
            <button 
              onClick={handlePharmacy}
              className="text-xs text-indigo-600"
            >
              Pharmacy
            </button>
            <button 
              onClick={handleCare}
              className="text-xs text-gray-600 hover:text-indigo-600"
            >
              Care
            </button>
            <button 
              onClick={handleDiagnostics}
              className="text-xs text-gray-600 hover:text-indigo-600"
            >
              Diagnostics
            </button>
            <button 
              onClick={handleProfile}
              className="text-xs text-gray-600 hover:text-indigo-600"
            >
              Profile
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}