'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

export default function RequestConsultationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [formData, setFormData] = useState({
    providerType: 'gp',
    chiefComplaint: '',
    symptoms: '',
    duration: '',
    urgency: 'routine',
    preferredDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/patient/login');
    }
  }, [session, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.chiefComplaint.trim() || formData.chiefComplaint.length < 10) {
      newErrors.chiefComplaint = 'Please describe your health concern (minimum 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    if (!session?.user?.id) {
      setSubmitError('You must be logged in to request a consultation');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/consultations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: session.user.id,
          providerType: formData.providerType,
          chiefComplaint: formData.chiefComplaint,
          symptoms: formData.symptoms || null,
          duration: formData.duration || null,
          urgency: formData.urgency,
          preferredDate: formData.preferredDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit consultation request');
      }

      setSuccess(true);

      // Redirect to consultations page after 2 seconds
      setTimeout(() => {
        router.push('/patient/consultations');
      }, 2000);

    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'Failed to submit consultation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-card shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Request Submitted!</h1>
          <p className="text-ink-light mb-4">
            Your consultation request has been sent to available {formData.providerType === 'gp' ? 'general practitioners' : 'specialists'}.
          </p>
          <p className="text-sm text-ink-light mb-6">
            You'll receive a notification when a doctor accepts your request.
          </p>
          <p className="text-sm text-ink-light">
            Redirecting to your consultations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/patient/home" className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-ink">Request Consultation</h1>
          <p className="text-ink-light mt-2">Tell us about your health concern and we'll connect you with a healthcare provider</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-card shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button">
                {submitError}
              </div>
            )}

            {/* Provider Type */}
            <div>
              <label className="block text-sm font-medium text-ink mb-3">
                Type of Provider <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, providerType: 'gp' })}
                  className={`p-4 border-2 rounded-button transition ${
                    formData.providerType === 'gp'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">🩺</div>
                    <div className="font-semibold text-ink">General Practitioner</div>
                    <div className="text-sm text-ink-light mt-1">For general health concerns</div>
                    <div className="text-sm text-primary-600 font-medium mt-2">$50</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, providerType: 'specialist' })}
                  className={`p-4 border-2 rounded-button transition ${
                    formData.providerType === 'specialist'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">👨‍⚕️</div>
                    <div className="font-semibold text-ink">Specialist</div>
                    <div className="text-sm text-ink-light mt-1">For specialized care</div>
                    <div className="text-sm text-primary-600 font-medium mt-2">$100</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label htmlFor="chiefComplaint" className="block text-sm font-medium text-ink mb-2">
                What's your main health concern? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                rows={3}
                className={`w-full px-4 py-2 border ${
                  errors.chiefComplaint ? 'border-red-500' : 'border-gray-300'
                } rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="e.g., I've been experiencing persistent headaches for the past week..."
              />
              {errors.chiefComplaint && (
                <p className="mt-1 text-sm text-red-500">{errors.chiefComplaint}</p>
              )}
            </div>

            {/* Symptoms */}
            <div>
              <label htmlFor="symptoms" className="block text-sm font-medium text-ink mb-2">
                Additional Symptoms (Optional)
              </label>
              <textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="List any other symptoms you're experiencing..."
              />
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-ink mb-2">
                How long have you had these symptoms? (Optional)
              </label>
              <input
                type="text"
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 3 days, 2 weeks, 1 month"
              />
            </div>

            {/* Urgency */}
            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-ink mb-2">
                Urgency Level <span className="text-red-500">*</span>
              </label>
              <select
                id="urgency"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="routine">Routine - Can wait a few days</option>
                <option value="urgent">Urgent - Need attention soon</option>
                <option value="emergency">Emergency - Need immediate care</option>
              </select>
              {formData.urgency === 'emergency' && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  ⚠️ For life-threatening emergencies, please call 911 or visit your nearest emergency room immediately.
                </p>
              )}
            </div>

            {/* Preferred Date */}
            <div>
              <label htmlFor="preferredDate" className="block text-sm font-medium text-ink mb-2">
                Preferred Consultation Date/Time (Optional)
              </label>
              <input
                type="datetime-local"
                id="preferredDate"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-button hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Consultation Request'}
              </button>
              <Link
                href="/patient/home"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-button hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-button p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">What happens next?</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Your request is sent to available doctors</li>
                <li>A doctor reviews and accepts your request</li>
                <li>You'll receive a notification when accepted</li>
                <li>Start your consultation via chat or video</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
