'use client';

import { useEffect, useRef, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';
import { useSharedState } from '@/lib/use-shared-state';
import { createReferralFromRequest, updateGpRequestStatus } from '@/lib/shared-state';

interface Patient {
  id: string;
  name: string;
  lastVisit: string;
  nextAppointment?: string;
  conditions: string[];
}

export default function GPHome() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const sharedState = useSharedState();
  const previousRequestCount = useRef(0);

  useEffect(() => {
    if (sharedState.seeded && patients.length === 0) {
      setPatients([
        {
          id: 'patient-1',
          name: 'Demo User',
          lastVisit: '2024-12-01',
          nextAppointment: '2024-12-15',
          conditions: ['Hypertension']
        }
      ]);
    }
    setLoading(false);
  }, [sharedState.seeded, patients.length]);

  useEffect(() => {
    const currentCount = sharedState.gpRequests.length;
    if (currentCount > previousRequestCount.current) {
      setNotification('New GP consult request received.');
      const timeout = window.setTimeout(() => setNotification(null), 4000);
      previousRequestCount.current = currentCount;
      return () => window.clearTimeout(timeout);
    }
    previousRequestCount.current = currentCount;
  }, [sharedState.gpRequests.length]);

  const handleAcknowledge = (requestId: string) => {
    updateGpRequestStatus(requestId, 'in_progress');
  };

  const handleRefer = (requestId: string, patientName: string) => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    createReferralFromRequest({
      requestId,
      specialistName: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      channel: 'online_wa',
      scheduledAt: tomorrow.toLocaleString()
    });
    setNotification(`Referral created for ${patientName}.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading GP dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard role="gp">
      <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className="bg-indigo-600 text-white text-center py-2 text-sm">
          {notification}
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Mediconnect
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">GP Portal - Dr. Sarah Johnson</span>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GP Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your patients and consultations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Intakes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Intake Forms</h2>
            {sharedState.gpRequests.length === 0 ? (
              <p className="text-gray-600">No pending intake forms</p>
            ) : (
              <div className="space-y-4">
                {sharedState.gpRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{request.patientName}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : request.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : request.status === 'referred'
                            ? 'bg-indigo-100 text-indigo-700'
                            : request.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {request.status === 'pending' && 'Awaiting triage'}
                        {request.status === 'in_progress' && 'In review'}
                        {request.status === 'referred' && 'Specialist booked'}
                        {request.status === 'completed' && 'Completed'}
                        {request.status === 'cancelled' && 'Cancelled'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(request.createdAt).toLocaleString()}
                    </p>
                    {request.status === 'pending' && (
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => handleAcknowledge(request.id)}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleRefer(request.id, request.patientName)}
                          className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                        >
                          Refer to Specialist
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today&apos;s Appointments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today&apos;s Appointments</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">John Doe</h3>
                    <p className="text-sm text-gray-600">Follow-up consultation</p>
                    <p className="text-xs text-gray-500">2:00 PM - 2:30 PM</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      Join Call
                    </button>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">Jane Smith</h3>
                    <p className="text-sm text-gray-600">Annual check-up</p>
                    <p className="text-xs text-gray-500">3:00 PM - 3:30 PM</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                      Start
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Patients</h2>
          {patients.length === 0 ? (
            <p className="text-gray-600 text-sm">You do not have any linked patients yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Appointment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conditions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.lastVisit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.nextAppointment || 'None scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.conditions.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                          <button className="text-green-600 hover:text-green-900">Consult</button>
                          <button className="text-purple-600 hover:text-purple-900">Prescribe</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {sharedState.referrals.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Specialist referrals</h2>
            <div className="space-y-3">
              {sharedState.referrals.map((referral) => (
                <div key={referral.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{referral.patientName}</p>
                      <p className="text-xs text-gray-500">{referral.specialistName} · {referral.specialty}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                      {referral.status}
                    </span>
                  </div>
                  {referral.scheduledAt && (
                    <p className="mt-2 text-xs text-gray-500">Scheduled for {referral.scheduledAt}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </AuthGuard>
  );
}
