"use client";

import Link from 'next/link';

export default function AgeVerification() {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-2">Age verification required</h1>
        <p className="text-sm text-gray-600 mb-4">To use HealthHub, you must be 18 years or older.</p>

        <div className="space-y-3">
          <Link href="/onboarding/terms" className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-md">Yes, I&apos;m 18 or older</Link>
          <button className="block w-full text-center px-4 py-2 rounded-md bg-gray-100">No, I&apos;m under 18</button>
        </div>
      </div>
    </div>
  );
}
