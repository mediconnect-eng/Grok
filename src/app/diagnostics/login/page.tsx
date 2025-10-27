'use client';

import RoleLogin from '@/components/RoleLogin';

export default function DiagnosticsLogin() {
  const handleLogin = () => {
    // RoleLogin manages redirecting diagnostics users into their workspace
  };

  return <RoleLogin role="diagnostics" onLogin={handleLogin} />;
}
