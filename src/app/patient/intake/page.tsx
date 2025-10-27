'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientIntake() {
  const [formData, setFormData] = useState({
    symptoms: '',
    duration: '',
    severity: 'mild',
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    emergency: false
  });
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission - in real app, send to API
    console.log('Intake form submitted:', formData);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4"></div>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Intake Complete</h2>
          <p className="text-ink mb-6">
            Thank you for providing your information. A healthcare provider will review your intake and contact you soon.
          </p>
          <Link
            href="/patient/consult-waiting"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-700"
          >
            Continue to Waiting Room
          </Link>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-primary-50">
      {/* Header */}
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-700">Health Intake Form</h1>
          <p className="mt-2 text-ink">
            Please provide information about your current health concerns. This will help your healthcare provider prepare for your consultation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
          {/* Emergency */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <input
                id="emergency"
                name="emergency"
                type="checkbox"
                checked={formData.emergency}
                onChange={handleChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="emergency" className="ml-2 block text-sm text-red-800 font-medium">
                This is a medical emergency - call emergency services immediately
              </label>
            </div>
            <p className="mt-2 text-sm text-red-700">
              If this is an emergency, please hang up and call 911 (or your local emergency number) immediately.
            </p>
          </div>

          {/* Symptoms */}
          <div>
            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
              What symptoms are you experiencing? *
            </label>
            <textarea
              id="symptoms"
              name="symptoms"
              rows={4}
              required
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="Please describe your symptoms in detail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              How long have you been experiencing these symptoms? *
            </label>
            <input
              type="text"
              id="duration"
              name="duration"
              required
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 3 days, 2 weeks, 1 month"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Severity */}
          <div>
            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
              How would you rate the severity of your symptoms? *
            </label>
            <select
              id="severity"
              name="severity"
              required
              value={formData.severity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="mild">Mild - Not interfering with daily activities</option>
              <option value="moderate">Moderate - Somewhat interfering with daily activities</option>
              <option value="severe">Severe - Significantly interfering with daily activities</option>
              <option value="critical">Critical - Unable to perform daily activities</option>
            </select>
          </div>

          {/* Medical History */}
          <div>
            <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
              Relevant medical history
            </label>
            <textarea
              id="medicalHistory"
              name="medicalHistory"
              rows={3}
              value={formData.medicalHistory}
              onChange={handleChange}
              placeholder="Any relevant medical conditions, previous surgeries, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Current Medications */}
          <div>
            <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700 mb-2">
              Current medications
            </label>
            <textarea
              id="currentMedications"
              name="currentMedications"
              rows={2}
              value={formData.currentMedications}
              onChange={handleChange}
              placeholder="List any medications you are currently taking"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Allergies */}
          <div>
            <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-2">
              Allergies
            </label>
            <textarea
              id="allergies"
              name="allergies"
              rows={2}
              value={formData.allergies}
              onChange={handleChange}
              placeholder="Any known allergies to medications, foods, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Submit Intake Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
