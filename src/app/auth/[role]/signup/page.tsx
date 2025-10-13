'use client';

import RoleSignup from '@/components/RoleSignup';

interface PageProps { params: { role: string } }

export default function RoleSignupPage({ params }: PageProps) {
  const role = params.role;
  return <RoleSignup role={role} />;
}
