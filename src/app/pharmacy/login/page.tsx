'use client';

import RoleLogin from '@/components/RoleLogin';

export default function PharmacyLogin() {
  const handleLogin = () => {
    // RoleLogin manages redirecting pharmacy users into their workspace
  };

  return <RoleLogin role="pharmacy" onLogin={handleLogin} />;
}
