'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GPHome() {
  const router = useRouter();

  useEffect(() => {
    // Bypass authentication - directly redirect to consultations
    router.push('/gp/consultations');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-ink-light">Loading GP dashboard...</p>
      </div>
    </div>
  );
}


