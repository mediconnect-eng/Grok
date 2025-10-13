'use client';

import { useState } from 'react';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { selectActivePrescription } from '@/lib/shared-state';

interface PrescriptionItem {
  name: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

interface PrescriptionCardProps {
  prescription: {
    id: string;
    dateIssued: string;
    qrToken: string;
    status: string;
    items: PrescriptionItem[];
  };
  showItemsOnly?: boolean; // For pharmacy view - hide patient details
}

export default function PrescriptionCard({ prescription, showItemsOnly = false }: PrescriptionCardProps) {
  const [showQRModal, setShowQRModal] = useState(false);

  const handleDownloadPDF = () => {
    // Mock PDF download - create a simple text blob for demo
    const pdfContent = `Prescription ${prescription.id}\nIssued: ${prescription.dateIssued}\nQR Token: ${prescription.qrToken}\n\nItems:\n${prescription.items.map(item => `- ${item.name}: ${item.dosage}, Qty: ${item.quantity}`).join('\n')}`;
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${prescription.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewQR = () => {
    selectActivePrescription(prescription.id);
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    selectActivePrescription(null);
    setShowQRModal(false);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        {!showItemsOnly && (
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-primary-700">Prescription #{prescription.id}</h3>
                <p className="text-sm text-ink">Issued: {prescription.dateIssued}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                prescription.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {prescription.status}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {prescription.items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-primary-700">{item.name}</h4>
                  <p className="text-sm text-ink mt-1">{item.dosage}</p>
                  <p className="text-sm text-ink">Quantity: {item.quantity}</p>
                  <p className="text-sm text-ink mt-2">{item.instructions}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!showItemsOnly && FEATURE_FLAGS.PDF_PRESCRIPTION_DOWNLOAD && (
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Download PDF
            </button>
            <button
              onClick={handleViewQR}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              View QR Code
            </button>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary-700">QR Code for Prescription #{prescription.id}</h3>
              <button
                onClick={closeQRModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-md mb-4">
                <p className="text-sm text-gray-600">QR Token:</p>
                <p className="font-mono text-lg text-primary-700">{prescription.qrToken}</p>
              </div>
              <p className="text-sm text-gray-600">Scan this code at your pharmacy</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
