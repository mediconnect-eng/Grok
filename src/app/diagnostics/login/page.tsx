'use client';

import { useRouter } from 'next/navigation';
import RoleLogin from '@/components/RoleLogin';

export default function DiagnosticsLogin() {
  const router = useRouter();

  const handleLogin = (userId: string) => {
    // Store user session (in real app, use proper auth)
    localStorage.setItem('userRole', 'diagnostics');
    localStorage.setItem('userId', userId);
    router.push('/diagnostics/orders');
  };

  return <RoleLogin role="diagnostics" onLogin={handleLogin} />;
}
