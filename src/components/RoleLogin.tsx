'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';

interface RoleLoginProps {
  role: string;
  onLogin: (userId: string) => void;
}

const roleRedirects: Record<string, string> = {
  patient: '/patient/home',
  gp: '/gp',
  specialist: '/specialist',
  pharmacy: '/pharmacy/login',
  diagnostics: '/diagnostics/login',
};

export default function RoleLogin({ role, onLogin }: RoleLoginProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Use Better Auth sign in with email/password
      const result = await signIn.email({
        email,
        password,
        callbackURL: roleRedirects[role.toLowerCase()] || '/',
      });

      if (result.error) {
        setError(
          result.error.message || 
          'Invalid email or password.\n\n' +
          '⚠️ Account not found? You need to sign up first!\n' +
          'Click the link below to create an account.'
        );
        return;
      }

      // If successful, trigger the onLogin callback and redirect
      onLogin(email);

      try {
        localStorage.setItem(
          'currentUser',
          JSON.stringify({ email, role: role.toLowerCase() }),
        );
      } catch (storageError) {
        console.warn('Unable to persist user locally', storageError);
      }

      const redirectPath = roleRedirects[role.toLowerCase()] ?? '/';
      router.push(redirectPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const roleKey = role.toLowerCase();
      const redirectPath = roleRedirects[roleKey] ?? '/';
      const baseURL = typeof window !== 'undefined' ? window.location.origin : undefined;

      await signIn?.social?.({
        provider: 'google',
        ...(baseURL
          ? {
              callbackURL: `${baseURL}${redirectPath}`,
              newUserCallbackURL: `${baseURL}${redirectPath}`,
            }
          : {}),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed. Please try again later.';
      setError(message);
      setIsGoogleLoading(false);
    }
  };

  const getRoleDisplayName = (value: string) => {
    const names = {
      patient: 'Patient',
      gp: 'GP',
      specialist: 'Specialist',
      pharmacy: 'Pharmacy',
      diagnostics: 'Diagnostics Lab',
    } as const;
    return names[value.toLowerCase() as keyof typeof names] ?? value;
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-700">
          Sign in as {getRoleDisplayName(role)}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email and password to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-card rounded-card sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`${role.toLowerCase()}@healthhub.com`}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-button placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-button placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-error text-sm text-center whitespace-pre-line">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-button text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Sign in
              </button>
            </div>

            {/* Sign up link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a
                  href={role === 'patient' ? '/patient/signup' : `/auth/${role.toLowerCase()}/signup`}
                  className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Sign up here
                </a>
              </p>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-button border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M21.35 11.1h-9.18v2.91h5.35c-.23 1.26-.93 2.33-1.99 3.04l3.21 2.49c1.88-1.73 2.96-4.28 2.96-7.3 0-.7-.06-1.37-.18-2.01z"
                  fill="#4285F4"
                />
                <path
                  d="M12.17 21c2.7 0 4.96-.9 6.61-2.45l-3.21-2.49c-.89.6-2.03.96-3.4.96-2.62 0-4.84-1.77-5.63-4.16l-3.31 2.55C5 18.78 8.32 21 12.17 21z"
                  fill="#34A853"
                />
                <path
                  d="M6.54 12.86c-.2-.6-.31-1.24-.31-1.9s.11-1.3.31-1.9l-3.32-2.55C2.45 8.2 2 9.81 2 11.45 2 13.1 2.45 14.7 3.22 16.24l3.32-2.55z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.17 6.1c1.47 0 2.78.5 3.81 1.49l2.85-2.85C16.99 2.69 14.73 1.7 12.17 1.7 8.32 1.7 5 3.92 3.22 6.66l3.32 2.55c.79-2.39 3.01-4.16 5.63-4.16z"
                  fill="#EA4335"
                />
              </svg>
              {isGoogleLoading ? 'Connecting to Google…' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
