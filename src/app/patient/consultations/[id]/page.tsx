'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

interface Consultation {
  id: string;
  patient_id: string;
  provider_id: string | null;
  provider_name: string | null;
  provider_email: string | null;
  provider_type: string;
  chief_complaint: string;
  symptoms: string | null;
  medical_history: string | null;
  current_medications: string | null;
  allergies: string | null;
  urgency: string;
  status: string;
  consultation_fee: number;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  created_at: string;
  read: boolean;
}

export default function ConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const consultationId = params.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/patient/login');
      return;
    }

    fetchConsultationDetails();
    fetchMessages();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchConsultationDetails();
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [session, consultationId, router]);

  const fetchConsultationDetails = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch consultation details');
      }

      const data = await response.json();
      setConsultation(data.consultation);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load consultation');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}/messages`);
      
      if (!response.ok) {
        return; // Silently fail for messages
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/consultations/${consultationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage('');
    } catch (err: any) {
      console.error('Send error:', err);
      alert('Failed to send message: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-ink-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-ink-light">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-ink mb-4">Consultation Not Found</h2>
          <p className="text-ink-light mb-6">{error || 'Unable to load consultation details'}</p>
          <Link
            href="/patient/consultations"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-button hover:bg-primary-700 transition font-semibold"
          >
            Back to Consultations
          </Link>
        </div>
      </div>
    );
  }

  const canStartCall = ['accepted', 'in_progress', 'scheduled'].includes(consultation.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link
              href="/patient/consultations"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Consultations
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Health Hub</h1>
            <div className="text-sm text-gray-600">Patient Portal</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation Info Card */}
            <div className="bg-white rounded-card shadow-card p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(consultation.status)}`}>
                      {consultation.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {consultation.provider_type === 'gp' ? 'General Practitioner' : 'Specialist'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-ink">{consultation.chief_complaint}</h2>
                </div>
                {canStartCall && (
                  <Link
                    href={`/consultations/${consultationId}/call`}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-button font-semibold flex items-center gap-2 transition shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Start Video Call
                  </Link>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Consultation Fee</h3>
                  <p className="text-lg font-bold text-ink">${consultation.consultation_fee}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Urgency</h3>
                  <p className="text-lg font-semibold text-ink capitalize">{consultation.urgency}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Created</h3>
                  <p className="text-ink">{new Date(consultation.created_at).toLocaleString()}</p>
                </div>
                {consultation.accepted_at && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Accepted</h3>
                    <p className="text-ink">{new Date(consultation.accepted_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Medical Information */}
              <div className="space-y-4 border-t pt-6">
                {consultation.symptoms && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Symptoms</h3>
                    <p className="text-ink">{consultation.symptoms}</p>
                  </div>
                )}
                {consultation.medical_history && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Medical History</h3>
                    <p className="text-ink">{consultation.medical_history}</p>
                  </div>
                )}
                {consultation.current_medications && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Current Medications</h3>
                    <p className="text-ink">{consultation.current_medications}</p>
                  </div>
                )}
                {consultation.allergies && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Allergies</h3>
                    <p className="text-ink">{consultation.allergies}</p>
                  </div>
                )}
                {consultation.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Provider Notes</h3>
                    <p className="text-ink">{consultation.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Section */}
            <div className="bg-white rounded-card shadow-card p-6">
              <h3 className="text-xl font-bold text-ink mb-4">Messages</h3>
              
              {/* Messages List */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No messages yet</p>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === session.user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwnMessage ? 'bg-primary-100' : 'bg-gray-100'} rounded-lg p-4`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-ink">
                              {isOwnMessage ? 'You' : message.sender_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-ink">{message.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              {(consultation.status === 'accepted' || consultation.status === 'in_progress' || consultation.status === 'scheduled') && (
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-button font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider Card */}
            {consultation.provider_name && (
              <div className="bg-white rounded-card shadow-card p-6">
                <h3 className="text-lg font-bold text-ink mb-4">Your Provider</h3>
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink">Dr. {consultation.provider_name}</h4>
                    <p className="text-sm text-gray-600">{consultation.provider_email}</p>
                    <p className="text-sm text-gray-600">
                      {consultation.provider_type === 'gp' ? 'General Practitioner' : 'Specialist'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-card shadow-card p-6">
              <h3 className="text-lg font-bold text-ink mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {canStartCall && (
                  <Link
                    href={`/consultations/${consultationId}/call`}
                    className="block w-full bg-green-600 hover:bg-green-700 text-white text-center px-4 py-3 rounded-button font-semibold transition"
                  >
                    Join Video Call
                  </Link>
                )}
                <button
                  onClick={() => window.print()}
                  className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center px-4 py-3 rounded-button font-semibold transition"
                >
                  Print Details
                </button>
                {consultation.status === 'pending' && (
                  <button
                    className="block w-full bg-red-100 hover:bg-red-200 text-red-700 text-center px-4 py-3 rounded-button font-semibold transition"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-blue-50 rounded-card p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-4">
                Contact our support team if you have any questions about your consultation.
              </p>
              <Link
                href="/patient/help"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-button font-semibold transition"
              >
                Get Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
