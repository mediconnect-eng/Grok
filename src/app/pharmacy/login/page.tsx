'use client';

import RoleLogin from '@/components/RoleLogin';

export default function PharmacyLogin() {
  const handleLogin = () => {
    // RoleLogin handles session persistence and redirects for pharmacy users
  };

  return <RoleLogin role="pharmacy" onLogin={handleLogin} />;
}
