"use client";

import Link from 'next/link';

export default function TermsConsent() {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-2">Terms & consent</h1>
        <p className="text-sm text-gray-600 mb-4">Please review and accept the following to continue</p>

        <div className="space-y-4 max-h-64 overflow-y-auto mb-4 p-2 border rounded">
          <div>
            <h3 className="font-semibold">Privacy Policy</h3>
            <p className="text-sm text-gray-600">We collect and process your health data to provide care.</p>
          </div>
          <div>
            <h3 className="font-semibold">Telemedicine Terms</h3>
            <p className="text-sm text-gray-600">Telemedicine consultations have limitations. Emergency care may require in-person visit.</p>
          </div>
          <div>
            <h3 className="font-semibold">Terms of Service</h3>
            <p className="text-sm text-gray-600">By using HealthHub, you agree to our terms of service.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">I have read and agree to the Terms</span>
          </label>
        </div>

        <div className="mt-6">
          <Link href="/patient/login" className="inline-block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-md">Accept and continue</Link>
        </div>
      </div>
    </div>
  );
}
