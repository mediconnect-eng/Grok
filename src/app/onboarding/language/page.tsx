"use client";

import Link from 'next/link';

export default function LanguageSelection() {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-2">Choose your language</h1>
        <p className="text-sm text-gray-600 mb-4">Select your preferred language for the app</p>

        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-md">English</button>
          <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-md">Kiswahili</button>
        </div>

        <div className="mt-6">
          <Link href="/onboarding/age" className="inline-block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-md">Continue</Link>
        </div>
      </div>
    </div>
  );
}
