'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

export default function RequestConsultationPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [consultationType, setConsultationType] = useState<'video' | 'chat'>('video');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/patient/login');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

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
          providerType: 'gp',
          consultationType,
          chiefComplaint:
            consultationType === 'video'
              ? 'Patient requested a video consultation'
              : 'Patient requested a chat consultation',
          symptoms: null,
          duration: null,
          urgency: 'routine',
          preferredDate: null,
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
          <h1 className="text-2xl font-bold text-ink mb-2">Consultation request sent!</h1>
          <p className="text-ink-light mb-4">
            We&apos;re notifying the next available GP about your {consultationType === 'video' ? 'video call' : 'chat'} session.
          </p>
          <p className="text-sm text-ink-light mb-6">We&apos;ll let you know as soon as they join.</p>
          <p className="text-sm text-ink-light">Redirecting to your consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/patient/home" className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-ink">Start your consultation</h1>
          <p className="text-ink-light mt-2">Choose how you&apos;d like to connect with the GP team.</p>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button">{submitError}</div>
            )}

            <div>
              <h2 className="text-base font-semibold text-ink mb-4">Consultation method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setConsultationType('video')}
                  className={`p-4 border-2 rounded-button transition text-left ${
                    consultationType === 'video'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📹</span>
                    <div>
                      <p className="font-semibold text-ink">Video chat</p>
                      <p className="text-sm text-ink-light">Face-to-face with your GP</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setConsultationType('chat')}
                  className={`p-4 border-2 rounded-button transition text-left ${
                    consultationType === 'chat'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💬</span>
                    <div>
                      <p className="font-semibold text-ink">Message chat</p>
                      <p className="text-sm text-ink-light">Great for quick updates</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-button bg-primary-50/70 border border-primary-100 px-4 py-3 text-sm text-primary-700">
              We&apos;ll connect you with the first available GP. Specialists are assigned only when a GP makes a referral.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-button hover:bg-primary-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Requesting...' : `Start ${consultationType === 'video' ? 'video' : 'chat'} consultation`}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-button p-4 text-sm text-blue-800">
          <p className="font-semibold text-blue-900 mb-1">What happens next?</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>We alert the GP care team.</li>
            <li>They accept your request and join the {consultationType === 'video' ? 'video room' : 'chat'}.</li>
            <li>You&apos;ll get a notification as soon as they connect.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
