'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Import Agora components dynamically to avoid SSR issues
const VideoCallRoom = dynamic(
  () => import('@/components/video/VideoCallRoom'),
  { ssr: false }
);

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [callData, setCallData] = useState<{
    token: string;
    appId: string;
    channelName: string;
    uid: number;
  } | null>(null);

  useEffect(() => {
    // Fetch Agora token
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/video/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            consultationId,
            channelName: `consultation-${consultationId}`,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get video token');
        }

        const data = await response.json();
        setCallData({
          token: data.token,
          appId: data.appId,
          channelName: data.channelName,
          uid: data.uid,
        });
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize video call');
        setLoading(false);
      }
    };

    fetchToken();
  }, [consultationId]);

  const handleLeave = () => {
    // Navigate back to consultation details
    router.push(`/patient/consultations/${consultationId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to video call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleLeave}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!callData) {
    return null;
  }

  return (
    <VideoCallRoom
      appId={callData.appId}
      channelName={callData.channelName}
      token={callData.token}
      uid={callData.uid}
      consultationId={consultationId}
      onLeave={handleLeave}
    />
  );
}
