'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';
import TabNav from '@/components/TabNav';
import ComingSoon from '@/components/ComingSoon';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { addGpRequest } from '@/lib/shared-state';
import { useSharedState } from '@/lib/use-shared-state';
import Calendar, { CalendarEvent, UpcomingEvents } from '@/components/Calendar';
import {
  StethoscopeIcon,
  CapsuleIcon,
  FlaskIcon,
  VideoCallIcon,
  BadgeIcon,
} from '@/components/BrandIcons';

const tabs = ['Specialists', 'Pharmacy', 'Care', 'Diagnostics', 'Profile'];

export default function PatientHome() {
  const [activeTab, setActiveTab] = useState('Specialists');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const sharedState = useSharedState();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const handleEmergency = () => {
    // Mock emergency action
    alert('Emergency services contacted! Help is on the way.');
  };

  const handleStartAIChat = () => {
    // Redirect to new consultation request page
    router.push('/patient/consultations/request');
  };

  const handleAskQuestion = () => {
    // Navigate to consultation intake as mock for asking a question
    router.push('/patient/intake');
  };

  const handleSpecialists = () => {
    router.push('/patient/specialists');
  };

  const handlePharmacy = () => {
    router.push('/patient/prescriptions');
  };

  const handleDiagnostics = () => {
    router.push('/patient/diagnostics');
  };

  const handleEducation = () => {
    // Mock education navigation - could be implemented later
    alert('Education section coming soon!');
  };

  const handleContinueCare = () => {
    router.push('/patient/consult-waiting');
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Navigate to appropriate page based on event type
    switch (event.type) {
      case 'consultation':
        router.push(`/patient/consultations/${event.id}`);
        break;
      case 'prescription':
        router.push(`/patient/prescriptions`);
        break;
      case 'diagnostic':
        router.push(`/patient/diagnostics`);
        break;
      case 'referral':
        router.push(`/patient/specialists`);
        break;
    }
  };

  const handleDateClick = (date: Date) => {
    // Navigate to consultation request page with date pre-filled
    router.push(`/patient/consultations/request?date=${date.toISOString()}`);
  };

  // Load user profile with dependents
  useEffect(() => {
    // Don't do anything while session is still loading
    if (isPending) {
      return;
    }
    
    // If session loaded and no user, redirect to login
    if (!session?.user) {
      console.log('No session found, redirecting to login...');
      router.push('/patient/login');
      return;
    }
    
    // Session exists, load profile
    if (session.user.email) {
      const savedProfile = localStorage.getItem(`profile_${session.user.email}`);
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    }
  }, [session, isPending, router]);
  
  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-ink-light text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If no session after loading, don't render (will redirect)
  if (!session?.user) {
    return null;
  }

  // Fetch calendar events (consultations, prescriptions, diagnostics)
  useEffect(() => {
    const fetchEvents = async () => {
      if (!session?.user) return;

      setIsLoadingEvents(true);
      try {
        const events: CalendarEvent[] = [];

        // Fetch consultations
        const consultationsRes = await fetch('/api/consultations/patient');
        if (consultationsRes.ok) {
          const consultations = await consultationsRes.json();
          consultations.forEach((consultation: any) => {
            const eventDate = consultation.preferred_date 
              ? new Date(consultation.preferred_date)
              : new Date(consultation.created_at);
            
            events.push({
              id: consultation.id,
              title: `Consultation with ${consultation.doctor_name || 'Doctor'}`,
              date: eventDate,
              time: consultation.preferred_time,
              type: 'consultation',
              status: consultation.status,
              description: consultation.chief_complaint,
              provider: consultation.doctor_name,
            });
          });
        }

        // Fetch prescriptions
        const prescriptionsRes = await fetch('/api/prescriptions');
        if (prescriptionsRes.ok) {
          const prescriptions = await prescriptionsRes.json();
          prescriptions.forEach((prescription: any) => {
            // Add pickup date if available
            if (prescription.pickup_date) {
              events.push({
                id: prescription.id,
                title: `Pick up prescription`,
                date: new Date(prescription.pickup_date),
                time: '09:00 AM',
                type: 'prescription',
                status: prescription.status,
                description: `${prescription.medications?.length || 0} medication(s)`,
                provider: prescription.pharmacy_name,
              });
            }
          });
        }

        // Fetch diagnostic orders
        const diagnosticsRes = await fetch('/api/diagnostic-orders/patient');
        if (diagnosticsRes.ok) {
          const diagnostics = await diagnosticsRes.json();
          diagnostics.forEach((diagnostic: any) => {
            const eventDate = diagnostic.scheduled_date 
              ? new Date(diagnostic.scheduled_date)
              : new Date(diagnostic.created_at);
            
            events.push({
              id: diagnostic.id,
              title: `${diagnostic.test_types?.join(', ') || 'Diagnostic test'}`,
              date: eventDate,
              time: diagnostic.scheduled_time,
              type: 'diagnostic',
              status: diagnostic.status,
              description: 'Diagnostic tests',
              provider: diagnostic.diagnostic_center_name,
            });
          });
        }

        setCalendarEvents(events);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [session]);

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    router.push('/patient/login');
    return null;
  }

  const userName = session.user.name || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  const patientIdentifier = session.user.id || session.user.email || userName;
  const patientRequests = sharedState.gpRequests.filter(
    (request) => request.patientId === patientIdentifier || request.patientName === userName
  );

  // Keep Tab-driven content for accessibility; primary UI mirrors the Figma CareHome layout
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top App Bar */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Mediconnect
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={handleEmergency}
                className="inline-flex items-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-md text-sm hover:bg-rose-700"
              >
                Emergency
              </button>
              <div className="relative">
                <button className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">{userInitials}</button>
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-indigo-600 rounded">3</span>
              </div>
            </div>
          </div>

          {patientRequests.length > 0 && (
            <div className="mt-6 bg-white rounded-card shadow-card p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">GP consult requests</h3>
              <div className="space-y-3">
                {patientRequests.map((request) => (
                  <div key={request.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{request.reason}</p>
                        <p className="text-xs text-gray-500">
                          Requested {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : request.status === 'referred'
                            ? 'bg-indigo-100 text-indigo-700'
                            : request.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : request.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {request.status === 'pending' && 'Waiting for GP'}
                        {request.status === 'in_progress' && 'GP reviewing'}
                        {request.status === 'referred' && 'Specialist booked'}
                        {request.status === 'completed' && 'Closed'}
                        {request.status === 'cancelled' && 'Cancelled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Profile Switcher */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          {/* Main user */}
          <button className="flex items-center gap-3 px-3 py-2 rounded-md bg-white shadow border-2 border-primary-600"> 
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">{userInitials}</div>
            <span className="text-sm font-medium">{userName}</span>
          </button>
          
          {/* Dependents from profile */}
          {userProfile?.dependents && userProfile.dependents.length > 0 ? (
            userProfile.dependents.map((dependent: any) => {
              const depInitials = dependent.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
              return (
                <button 
                  key={dependent.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md bg-white shadow hover:border-2 hover:border-gray-300" 
                > 
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm">{depInitials}</div>
                  <span className="text-sm">{dependent.name}</span>
                </button>
              );
            })
          ) : (
            // Show add dependent button if no dependents
            <button 
              onClick={() => router.push('/patient/profile?section=dependents')}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-white shadow border-2 border-dashed border-gray-300 hover:border-primary-600"
            > 
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm text-gray-600">Add Dependent</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero / Care Card */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-2xl font-semibold text-white">M</div>
              <div>
                <h2 className="text-lg font-semibold text-primary-900">How can we help today?</h2>
                <p className="text-sm text-gray-600">Start with AI or talk to a GP</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={handleStartAIChat}
                className="flex w-full items-center gap-3 rounded-md bg-primary-600 px-4 py-3 text-white shadow-sm transition hover:bg-primary-700"
              >
                <VideoCallIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Start AI Chat or Consult a GP</span>
              </button>

              <button
                onClick={handleAskQuestion}
                className="flex w-full items-center gap-3 rounded-md border border-primary-200 bg-primary-50/60 px-4 py-3 text-primary-700 transition hover:border-primary-300 hover:bg-primary-50"
              >
                <StethoscopeIcon className="h-5 w-5 text-primary-500" />
                <span className="text-sm font-medium">Ask a Question</span>
              </button>
            </div>
          </div>

          {/* Continue Care Card - Only show for demo users */}
          {localStorage.getItem('isDemoUser') === 'true' && (
            <button
              onClick={handleContinueCare}
              className="mt-6 flex w-full items-center justify-between rounded-card bg-white p-4 shadow-card transition hover:bg-primary-50"
            >
              <div>
                <p className="font-medium text-primary-800">Continue with Dr. Sarah Wilson</p>
                <p className="text-sm text-gray-500">WhatsApp video ETA 5 mins</p>
              </div>
              <VideoCallIcon className="h-6 w-6 text-primary-500" />
            </button>
          )}
          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button
              onClick={handleSpecialists}
              className="flex flex-col items-center gap-2 rounded-button bg-white py-4 shadow-card transition hover:-translate-y-0.5 hover:bg-primary-50"
            >
              <BadgeIcon className="h-8 w-8 text-primary-500" />
              <span className="text-xs font-medium text-primary-800">Specialists</span>
            </button>
            <button
              onClick={handlePharmacy}
              className="flex flex-col items-center gap-2 rounded-button bg-white py-4 shadow-card transition hover:-translate-y-0.5 hover:bg-primary-50"
            >
              <CapsuleIcon className="h-8 w-8 text-primary-500" />
              <span className="text-xs font-medium text-primary-800">Pharmacy</span>
            </button>
            <button
              onClick={handleDiagnostics}
              className="flex flex-col items-center gap-2 rounded-button bg-white py-4 shadow-card transition hover:-translate-y-0.5 hover:bg-primary-50"
            >
              <FlaskIcon className="h-8 w-8 text-primary-500" />
              <span className="text-xs font-medium text-primary-800">Diagnostics</span>
            </button>
            <button
              onClick={handleEducation}
              className="flex flex-col items-center gap-2 rounded-button bg-white py-4 shadow-card transition hover:-translate-y-0.5 hover:bg-primary-50"
            >
              <VideoCallIcon className="h-8 w-8 text-primary-500" />
              <span className="text-xs font-medium text-primary-800">Education</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/patient/profile')}
              className="flex items-center gap-3 rounded-button bg-white px-4 py-3 shadow-card transition hover:bg-primary-50"
            >
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-primary-800">My Profile</span>
            </button>
            <button
              onClick={() => router.push('/patient/history')}
              className="flex items-center gap-3 rounded-button bg-white px-4 py-3 shadow-card transition hover:bg-primary-50"
            >
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-primary-800">Medical History</span>
            </button>
          </div>

          {/* Calendar Section */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Calendar - takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <div className="rounded-card bg-white p-6 shadow-card">
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Your Appointments</h3>
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <Calendar 
                    events={calendarEvents} 
                    onEventClick={handleEventClick}
                    onDateClick={handleDateClick}
                    highlightToday
                  />
                )}
              </div>
            </div>

            {/* Upcoming Events - takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <div className="rounded-card bg-white p-6 shadow-card">
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Upcoming</h3>
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <UpcomingEvents 
                    events={calendarEvents}
                    onEventClick={handleEventClick}
                    maxEvents={5}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-card bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-800">Health video playlist</h3>
                <p className="text-sm text-gray-600">
                  We&apos;re curating short explainers to guide you through consult prep and follow-ups.
                </p>
              </div>
              <VideoCallIcon className="h-6 w-6 text-primary-500" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[1, 2].map((slot) => (
                <div
                  key={`video-slot-${slot}`}
                  className="flex h-28 flex-col justify-between rounded-2xl border border-dashed border-primary-200 bg-primary-50/70 p-4 text-primary-700"
                >
                  <p className="text-sm font-medium">Video slot {slot}</p>
                  <p className="text-xs text-primary-600">
                    Placeholder content—personalised videos will unlock soon.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white shadow mt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={handleSpecialists}
              className="flex flex-col items-center text-sm text-gray-700 hover:text-indigo-600"
            >
              Specialists
            </button>
            <button 
              onClick={handlePharmacy}
              className="flex flex-col items-center text-sm text-gray-700 hover:text-indigo-600"
            >
              Pharmacy
            </button>
            <button className="flex flex-col items-center text-sm text-indigo-600">Care</button>
            <button 
              onClick={handleDiagnostics}
              className="flex flex-col items-center text-sm text-gray-700 hover:text-indigo-600"
            >
              Diagnostics
            </button>
            <button 
              onClick={() => router.push('/patient/profile')}
              className="flex flex-col items-center text-sm text-gray-700 hover:text-indigo-600"
            >
              Profile
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}




