'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Admin Guard Component
 * Protects admin routes by verifying user has admin role
 * Redirects non-admin users to admin login page
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function verifyAdmin() {
      // Wait for session to load
      if (isPending) {
        return;
      }

      // No session - redirect to login
      if (!session || !session.user) {
        router.push('/admin/login');
        return;
      }

      // Verify admin role
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include',
        });

        const data = await response.json();

        if (!data.isAdmin) {
          // Not an admin - redirect to login
          router.push('/admin/login');
          return;
        }

        // Admin verified
        setIsAdmin(true);
        setIsVerifying(false);

      } catch (error) {
        console.error('Admin verification failed:', error);
        router.push('/admin/login');
      }
    }

    verifyAdmin();
  }, [session, isPending, router]);

  // Loading state
  if (isPending || isVerifying) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-surfaceAlt">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-body">Verifying admin access...</p>
          </div>
        </div>
      )
    );
  }

  // Not admin - will redirect in useEffect
  if (!isAdmin) {
    return null;
  }

  // Admin verified - render children
  return <>{children}</>;
}

/**
 * Patient Guard Component
 * Protects patient routes
 */
export function PatientGuard({ children, fallback }: AdminGuardProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!session || !session.user)) {
      router.push('/auth/login');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-surfaceAlt">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-body">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!session || !session.user) {
    return null;
  }

  return <>{children}</>;
}
