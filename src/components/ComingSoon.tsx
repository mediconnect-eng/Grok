'use client';

import { useState } from 'react';

interface ComingSoonProps {
  feature: string;
  description?: string;
}

export default function ComingSoon({ feature, description }: ComingSoonProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission - store in localStorage
    const notifications = JSON.parse(localStorage.getItem('comingSoonNotifications') || '[]');
    notifications.push({ feature, email, phone, timestamp: new Date().toISOString() });
    localStorage.setItem('comingSoonNotifications', JSON.stringify(notifications));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-2xl mb-2"></div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Thank you!</h3>
        <p className="text-green-700">We&apos;ll notify you when {feature} becomes available.</p>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 border border-primary-100 rounded-lg p-6">
      <div className="text-center mb-4">
        <div className="text-blue-600 text-4xl mb-2"></div>
        <h3 className="text-xl font-semibold text-primary-700 mb-2">Coming Soon</h3>
        <p className="text-ink mb-4">
          {description || `${feature} is currently under development and will be available soon.`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-1">
            Email (optional)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-primary-700 mb-1">
            Phone (optional)
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          Notify Me When Available
        </button>
      </form>
    </div>
  );
}
