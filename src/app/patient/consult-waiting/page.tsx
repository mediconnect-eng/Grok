'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ConsultWaiting() {
  const [waitTime, setWaitTime] = useState(15); // minutes
  const [position, setPosition] = useState(3);
  const [consultationStarted, setConsultationStarted] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  useEffect(() => {
    // Mock waiting room - simulate consultation starting
    const timer = setTimeout(() => {
      setConsultationStarted(true);
    }, 10000); // Start consultation after 10 seconds for demo

    return () => clearTimeout(timer);
  }, []);

  if (consultationStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Consultation Starting</h2>
          <p className="text-gray-600 mb-6">
            Your healthcare provider is ready. Click below to join the video consultation.
          </p>
          <button className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium mb-4">
            Join Video Consultation
          </button>
          <p className="text-sm text-gray-500">
            If the consultation doesn&apos;t start, please refresh the page or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/patient/home" className="text-gray-400 hover:text-gray-600">
                 Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                HealthHub
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Patient Portal</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Virtual Consultation Waiting Room</h1>
          <p className="text-gray-600">Please wait while we connect you with a healthcare provider</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wait Time Card */}
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Estimated Wait Time</h2>
            <div className="text-5xl font-bold text-blue-600 mb-4">{waitTime} min</div>
            <p className="text-gray-600">
              Your position in queue: #{position}
            </p>
          </div>

          {/* Provider Info Card */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Healthcare Provider</h2>
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Dr. Sarah Johnson</h3>
                <p className="text-gray-600">General Practitioner</p>
                <p className="text-sm text-gray-500">Anytown Medical Center</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Consultation Details</h4>
              <p className="text-sm text-blue-800">
                 Review of your intake form<br/>
                 Discussion of symptoms<br/>
                 Treatment recommendations<br/>
                 Prescription if needed
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">While You Wait</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2"></div>
              <h4 className="font-medium text-blue-900">Stay Connected</h4>
              <p className="text-sm text-blue-800">Keep your phone nearby for notifications</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2"></div>
              <h4 className="font-medium text-blue-900">Test Audio/Video</h4>
              <p className="text-sm text-blue-800">Ensure your camera and microphone work</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2"></div>
              <h4 className="font-medium text-blue-900">Review Info</h4>
              <p className="text-sm text-blue-800">Check your intake form is complete</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/patient/intake"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
             Back to Intake Form
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Refresh Status
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm"></span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Intake Form Submitted</p>
                  <p className="text-sm text-gray-600">Your information has been received</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">2</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Provider Review</p>
                  <p className="text-sm text-gray-600">Your healthcare provider is reviewing your information</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm">3</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Video Consultation</p>
                  <p className="text-sm text-gray-600">Connect with your healthcare provider</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
