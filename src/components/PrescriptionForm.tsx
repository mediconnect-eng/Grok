'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionFormProps {
  consultationId: string;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

export default function PrescriptionForm({
  consultationId,
  patientId,
  patientName,
  onSuccess
}: PrescriptionFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      setError('You must be logged in to create prescriptions');
      return;
    }

    // Validate medications
    const validMedications = medications.filter(
      med => med.name && med.dosage && med.frequency && med.duration
    );

    if (validMedications.length === 0) {
      setError('Please add at least one complete medication');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/prescriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId,
          patientId,
          providerId: session.user.id,
          providerName: session.user.name || 'Doctor',
          medications: validMedications,
          diagnosis: diagnosis || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create prescription');
      }

      setSuccess(true);
      
      // Call success callback or redirect
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/gp/consultations');
        }
      }, 2000);

    } catch (err: any) {
      console.error('Prescription creation error:', err);
      setError(err.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-card p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-900 mb-2">Prescription Created!</h3>
        <p className="text-green-700">The patient has been notified about the prescription.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-card p-4">
        <h4 className="font-semibold text-ink mb-1">Patient: {patientName}</h4>
        <p className="text-sm text-ink-light">Consultation ID: {consultationId.slice(0, 8)}...</p>
      </div>

      {/* Diagnosis */}
      <div>
        <label htmlFor="diagnosis" className="block text-sm font-medium text-ink mb-2">
          Diagnosis
        </label>
        <input
          type="text"
          id="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g., Upper Respiratory Tract Infection"
          className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-ink">
            Medications *
          </label>
          <button
            type="button"
            onClick={addMedication}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            + Add Medication
          </button>
        </div>

        <div className="space-y-4">
          {medications.map((med, index) => (
            <div key={index} className="border border-gray-200 rounded-card p-4 relative">
              {medications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    placeholder="e.g., Amoxicillin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    placeholder="e.g., 500mg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Frequency *
                  </label>
                  <select
                    value={med.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Every 12 hours">Every 12 hours</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    placeholder="e.g., 7 days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Instructions
                  </label>
                  <input
                    type="text"
                    value={med.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    placeholder="e.g., Take with food"
                    className="w-full px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-2">
          Additional Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any additional instructions or notes for the patient..."
          className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary-600 text-white py-3 rounded-button hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Creating Prescription...' : 'Create Prescription'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-button hover:bg-gray-50 transition font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
