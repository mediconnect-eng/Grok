'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

export default function GPHome() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        window.location.href = '/gp/login';
      } else {
        // Redirect to the real consultations dashboard
        window.location.href = '/gp/consultations';
      }
    }
  }, [session, isPending]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-ink-light">Loading GP dashboard...</p>
      </div>
    </div>
  );
}


