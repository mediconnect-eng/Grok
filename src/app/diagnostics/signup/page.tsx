'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';

export default function DiagnosticsSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    labName: '',
    accreditationNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setIsLoading(true);
    setError('');
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp.email({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
      });

      if (result.error) {
        setError(result.error.message || 'Signup failed. Please try again.');
      } else if (result.data?.user?.id) {
        await fetch('/api/auth/update-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: result.data.user.id,
            role: 'diagnostic-center',
          }),
        });

        router.push('/diagnostics/login?signup=success');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/diagnostics/login');
  };

  const handleBackClick = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">🔬</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Diagnostics Account</h1>
          <p className="text-gray-600 mt-2">Join as a Diagnostic Center</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Smith"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab/Center Name (Optional)
            </label>
            <input
              type="text"
              value={formData.labName}
              onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
              placeholder="MedLab Diagnostics"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="lab@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min. 6 characters"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Re-enter password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accreditation Number (Optional)
            </label>
            <input
              type="text"
              value={formData.accreditationNumber}
              onChange={(e) => setFormData({ ...formData, accreditationNumber: e.target.value })}
              placeholder="NABL/ISO Accreditation #"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? 'Creating Account...' : 'Create Diagnostics Account'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleLogin}
              className="text-teal-600 hover:text-teal-800 text-sm"
            >
              Already have an account? Sign in
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleBackClick}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
