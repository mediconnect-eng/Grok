'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });

      if (result.error) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Check if user is admin by querying database
      const response = await fetch('/api/admin/verify', {
        credentials: 'include',
      });

      const verifyData = await response.json();

      if (!verifyData.isAdmin) {
        setError('Admin access required. Please use an admin account.');
        await authClient.signOut();
        setLoading(false);
        return;
      }

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surfaceAlt">
      <div className="bg-surface p-8 rounded-card shadow-card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">Admin Login</h1>
          <p className="text-body">HealthHub Administration Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-button">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-button focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="admin@healthhub.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-button focus:outline-none focus:ring-2 focus:ring-primary-600"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-button font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Login to Admin Portal'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            ← Back to Home
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-subtle text-center">
            🔒 This is a restricted area. Only authorized administrators can access this portal.
            All access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
