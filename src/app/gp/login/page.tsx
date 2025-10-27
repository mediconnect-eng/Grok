'use client';

import RoleLogin from '@/components/RoleLogin';

export default function GPLogin() {
  const handleLogin = () => {
    // RoleLogin handles session persistence and redirects for GP users
  };

  return <RoleLogin role="gp" onLogin={handleLogin} />;
}
