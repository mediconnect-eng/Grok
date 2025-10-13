'use client';

import RoleLogin from '@/components/RoleLogin';

interface PageProps { params: { role: string } }

export default function RoleLoginPage({ params }: PageProps) {
  const role = params.role;

  const handleLogin = (userId: string) => {
    // nothing special here - RoleLogin will persist currentUser in localStorage
  };

  return <RoleLogin role={role} onLogin={handleLogin} />;
}
