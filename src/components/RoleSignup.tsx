"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from '@/lib/password-validation';

interface RoleSignupProps {
  role: string;
}

const LOGIN_REDIRECTS: Record<string, string> = {
  patient: '/auth/patient/login',
  gp: '/auth/gp/login',
  specialist: '/auth/specialist/login',
  pharmacy: '/auth/pharmacy/login',
  diagnostics: '/auth/diagnostics/login',
  admin: '/admin/login',
};

const toRoleKey = (value: string): string => value.trim().toLowerCase();

const resolveLoginRedirect = (roleValue: string): string => {
  const key = toRoleKey(roleValue);
  return LOGIN_REDIRECTS[key] ?? `/auth/${key}/login`;
};

export default function RoleSignup({ role }: RoleSignupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]); // Show first error
      setShowPasswordRequirements(true);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const roleKey = toRoleKey(role);
      const response = await fetch('/api/auth/signup-with-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role: roleKey,
        }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        return;
      }

      const nextRole = typeof data.role === 'string' ? data.role : roleKey;
      router.push(resolveLoginRedirect(nextRole));
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-700">
          Sign up as {role}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your account to access the {role} portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setShowPasswordRequirements(true);
                }}
                onFocus={() => setShowPasswordRequirements(true)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Min 12 characters with uppercase, lowercase, number, special char"
                required
              />
              
              {/* Password Strength Indicator */}
              {password && showPasswordRequirements && (
                <div className="mt-2 text-sm">
                  {(() => {
                    const validation = validatePassword(password);
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Strength:</span>
                          <span className={`font-medium ${getPasswordStrengthColor(validation.strength)}`}>
                            {getPasswordStrengthLabel(validation.strength)}
                          </span>
                        </div>
                        
                        {/* Password Requirements */}
                        <div className="mt-2 space-y-1 text-xs">
                          <p className={password.length >= 12 ? 'text-green-600' : 'text-gray-500'}>
                            {password.length >= 12 ? '✓' : '○'} At least 12 characters
                          </p>
                          <p className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                            {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                          </p>
                          <p className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                            {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                          </p>
                          <p className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                            {/\d/.test(password) ? '✓' : '○'} One number
                          </p>
                          <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                            {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '○'} One special character (!@#$%...)
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            <div className="text-sm text-center">
              <span className="text-gray-600">Already have an account? </span>
              <a
                href={`/auth/${role.toLowerCase()}/login`}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
