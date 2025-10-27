'use client';

import RoleLogin from '@/components/RoleLogin';

export default function SpecialistLogin() {
  const handleLogin = () => {
    // RoleLogin handles session persistence and redirects for specialist users
  };

  return <RoleLogin role="specialist" onLogin={handleLogin} />;
}
