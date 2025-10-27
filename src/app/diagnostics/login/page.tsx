'use client';

import RoleLogin from '@/components/RoleLogin';

export default function DiagnosticsLogin() {
  const handleLogin = () => {
    // RoleLogin handles session persistence and redirects for diagnostics users
  };

  return <RoleLogin role="diagnostics" onLogin={handleLogin} />;
}
