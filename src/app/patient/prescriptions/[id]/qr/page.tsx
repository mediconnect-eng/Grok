'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import prescriptionsData from '@/data/prescriptions.json';

interface Prescription {
  id: string;
  dateIssued: string;
  qrToken: string;
  status: string;
  items: Array<{ name: string; dosage: string; quantity: number; instructions: string }>;
}

interface PageProps {
  params: { id: string };
}

const prescriptions: Prescription[] = prescriptionsData as Prescription[];

export default function PrescriptionQRPage({ params }: PageProps) {
  const router = useRouter();
  const prescription = prescriptions.find((p) => p.id === params.id);

  const handleEmergency = () => {
    alert('Emergency services contacted! Help is on the way.');
  };

  const handleMaxBrightness = () => {
    // Mock brightness control
    alert('Screen brightness set to maximum!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Prescription QR Code',
        text: `Prescription QR: ${prescription?.qrToken}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
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
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/patient/prescriptions/${prescription.id}`} className="text-primary-600 hover:text-primary-700">← Back</Link>
            <h1 className="text-lg font-semibold text-primary-700">Prescription QR</h1>
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="mx-auto w-48 h-48 bg-gray-100 rounded-md mb-4 flex items-center justify-center">QR</div>
              <div className="text-sm text-gray-600">Show this QR code to any verified pharmacy to collect your medicines</div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={handleMaxBrightness}
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Max Brightness
              </button>
              <a 
                download 
                href={`/api/prescriptions/${prescription.id}/pdf`} 
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Backup PDF
              </a>
              <button 
                onClick={handleShare}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Share
              </button>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg p-4 shadow">
            <h3 className="font-semibold">Prescription Details</h3>
            <div className="mt-3 text-sm text-gray-700">
              <div className="font-medium">{prescription.items[0]?.name}</div>
              <div className="text-gray-600">{prescription.items[0]?.dosage}</div>
              <div className="text-sm text-gray-500 mt-2">Prescribed by Dr. Sarah Wilson</div>
            </div>
          </div>
        </div>
      </main>

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
              className="text-xs text-gray-600 hover:text-indigo-600"
            >
              Pharmacy
            </button>
            <button 
              onClick={handleCare}
              className="text-xs text-indigo-600"
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
