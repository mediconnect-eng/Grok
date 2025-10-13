'use client';

import { useRouter } from 'next/navigation';
import RoleLogin from '@/components/RoleLogin';

export default function PharmacyLogin() {
  const router = useRouter();

  const handleLogin = (userId: string) => {
    // Store user session (in real app, use proper auth)
    localStorage.setItem('userRole', 'pharmacy');
    localStorage.setItem('userId', userId);
    router.push('/pharmacy/scanner');
  };

  return <RoleLogin role="pharmacy" onLogin={handleLogin} />;
}
