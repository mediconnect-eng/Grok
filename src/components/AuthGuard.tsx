"use client";

import { useEffect, useState, PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  role: string; // expected role to access the wrapped content
}

export default function AuthGuard({ role, children }: PropsWithChildren<AuthGuardProps>) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) {
        router.replace(`/auth/${role}/login`);
        return;
      }
      const user = JSON.parse(raw);
      if (user?.role !== role.toLowerCase()) {
        router.replace(`/auth/${role}/login`);
        return;
      }
    } catch (e) {
      router.replace(`/auth/${role}/login`);
      return;
    } finally {
      setLoading(false);
    }
  }, [role, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Checking access...</div>;
  }

  return <>{children}</>;
}
