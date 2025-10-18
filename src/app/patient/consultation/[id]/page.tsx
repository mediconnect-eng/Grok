'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import VideoCallRoom from '@/components/video/VideoCallRoom';

export default function PatientVideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const consultationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenData, setTokenData] = useState<any>(null);
  const [consultation, setConsultation] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      initializeCall();
    }
  }, [consultationId, session]);

  const initializeCall = async () => {
    try {
      if (!session?.user?.id) {
        throw new Error('You must be logged in');
      }

      // Fetch consultation details
      const consultationRes = await fetch(`/api/consultations/patient?patientId=${session.user.id}`);
      if (!consultationRes.ok) throw new Error('Failed to fetch consultation');
      
      const consultationData = await consultationRes.json();
      const activeConsultation = consultationData.consultations.find((c: any) => c.id === consultationId);
      
      if (!activeConsultation) throw new Error('Consultation not found');
      
      // Check if this is a video consultation
      if (activeConsultation.consultation_type !== 'video') {
        throw new Error('This is not a video consultation');
      }

      // Check if consultation is accepted or in progress
      if (!['accepted', 'in_progress'].includes(activeConsultation.status)) {
        throw new Error('Consultation is not ready for video call');
      }
      
      setConsultation(activeConsultation);

      // Generate Agora token
      const tokenRes = await fetch('/api/video/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId,
          channelName: `consultation-${consultationId}`,
        }),
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.json();
        throw new Error(errorData.error || 'Failed to generate video token');
      }

      const tokenResult = await tokenRes.json();
      setTokenData(tokenResult);
      setLoading(false);

    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLeave = () => {
    router.push('/patient/consultations');
  };

  if (!session?.user) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing video call...</p>
          <p className="text-gray-400 text-sm mt-2">Please allow camera and microphone access</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="max-w-md bg-gray-800 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Unable to Start Call</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/patient/consultations')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Back to Consultations
          </button>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return null;
  }

  return (
    <VideoCallRoom
      appId={tokenData.appId}
      channelName={tokenData.channelName}
      token={tokenData.token}
      uid={tokenData.uid}
      consultationId={consultationId}
      onLeave={handleLeave}
    />
  );
}
