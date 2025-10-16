'use client';

import { useState, useEffect } from 'react';
import { signIn } from '@/lib/auth-client';

export default function OAuthTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addLog('🚀 OAuth Test Page Loaded');
    addLog(`📍 Base URL: ${window.location.origin}`);
    addLog(`🔐 Auth URL: ${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'Not set'}`);
  }, []);

  const testGoogleOAuth = async () => {
    setIsLoading(true);
    addLog('🔄 Starting Google OAuth...');
    
    try {
      addLog('📤 Calling signIn.social()...');
      
      const result = await signIn.social({
        provider: 'google',
        callbackURL: '/patient/home',
      });
      
      addLog('✅ OAuth initiated successfully');
      addLog(`📥 Result: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error?.message || 'Unknown error'}`);
      addLog(`📋 Full error: ${JSON.stringify(error, null, 2)}`);
      setIsLoading(false);
    }
  };

  const testAuthEndpoint = async () => {
    addLog('🧪 Testing /api/auth endpoint...');
    
    try {
      const response = await fetch('/api/auth/health');
      addLog(`📡 Response status: ${response.status}`);
      const data = await response.text();
      addLog(`📥 Response: ${data}`);
    } catch (error: any) {
      addLog(`❌ Fetch error: ${error.message}`);
    }
  };

  const testGoogleAuthEndpoint = async () => {
    addLog('🧪 Testing Google OAuth endpoint...');
    
    try {
      const authUrl = `${window.location.origin}/api/auth/sign-in/social`;
      addLog(`📡 Calling: ${authUrl}`);
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: '/patient/home',
        }),
      });
      
      addLog(`📡 Response status: ${response.status}`);
      const data = await response.text();
      addLog(`📥 Response: ${data.substring(0, 200)}...`);
    } catch (error: any) {
      addLog(`❌ Fetch error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">🧪 OAuth Debug Tool</h1>
          <p className="text-gray-600 mb-4">
            Testing Google OAuth integration for healthhubinternational.com
          </p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={testGoogleOAuth}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Loading...' : '🔐 Test Google Sign-In'}
            </button>
            
            <button
              onClick={testAuthEndpoint}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🧪 Test Auth API
            </button>
            
            <button
              onClick={testGoogleAuthEndpoint}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              🔍 Test Google Endpoint
            </button>
            
            <button
              onClick={() => setLogs([])}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              🗑️ Clear Logs
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click a button to start testing.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">📋 Current Configuration</h2>
          
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="font-bold">Window Origin:</span>{' '}
              <span className="text-blue-600">{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</span>
            </div>
            <div>
              <span className="font-bold">NEXT_PUBLIC_BETTER_AUTH_URL:</span>{' '}
              <span className="text-blue-600">{process.env.NEXT_PUBLIC_BETTER_AUTH_URL || '❌ Not set'}</span>
            </div>
            <div>
              <span className="font-bold">Expected Callback:</span>{' '}
              <span className="text-blue-600">/api/auth/callback/google</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              <li>Make sure Google Cloud Console has the correct redirect URI</li>
              <li>Check that environment variables are set correctly</li>
              <li>OAuth callbacks can take 5-10 minutes to propagate after changes</li>
              <li>Clear browser cookies if you see authentication issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
