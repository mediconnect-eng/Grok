'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { addGpRequest, DiagnosticOrder, ProcedureOption, Referral } from '@/lib/shared-state';
import { useSharedState } from '@/lib/use-shared-state';

interface UpcomingAppointment {
  specialistName: string;
  specialty: string;
  scheduledAt: string;
  channel: 'online_wa' | 'online_app' | 'in_person';
  location?: string;
}

export default function PatientSpecialists() {
  const router = useRouter();
  const { data: session } = useSession();
  const sharedState = useSharedState();

  const handleSpecialists = () => router.push('/patient/specialists');
  const handlePharmacy = () => router.push('/patient/prescriptions');
  const handleCare = () => router.push('/patient/home');
  const handleDiagnostics = () => router.push('/patient/diagnostics');
  const handleProfile = () => router.push('/patient/profile');

  const patientName = session?.user?.name || 'Patient';
  const patientId = session?.user?.id || session?.user?.email || patientName;

  const patientReferrals: Referral[] = sharedState.referrals.filter(
    (referral) => referral.patientName === patientName
  );
  const activeReferral =
    patientReferrals.find((referral) => referral.status === 'booked') || patientReferrals[0];

  const upcomingAppointment: UpcomingAppointment | null = activeReferral
    ? {
        specialistName: activeReferral.specialistName,
        specialty: activeReferral.specialty,
        scheduledAt: activeReferral.scheduledAt || 'Awaiting schedule confirmation',
        channel: activeReferral.channel,
        location: activeReferral.channel === 'in_person' ? 'Clinic address shared after confirmation' : undefined
      }
    : null;

  const referralSummary = activeReferral
    ? {
        rationale: activeReferral.notes || 'Referral details will appear after the GP shares their note.',
        selectedOption: `${activeReferral.specialty} • ${
          activeReferral.channel === 'in_person' ? 'In-person' : 'Virtual'
        }`,
        consentedAt: activeReferral.scheduledAt || 'Pending schedule'
      }
    : null;

  const diagnosticOrders: DiagnosticOrder[] = activeReferral?.diagnostics ?? [];
  const procedureOptions: ProcedureOption[] = activeReferral?.procedures ?? [];
  const pastVisits = patientReferrals.filter((referral) => referral.status === 'completed');

  const handleStartGpConsult = () => {
    if (session?.user) {
      addGpRequest({
        patientName,
        patientId,
        reason: 'Patient requested GP consult from the Specialist tab.'
      });
      alert('We have asked your GP to review your case. You will see updates in the Care tab.');
    }
    router.push('/patient/consult-waiting');
  };

  return (
    <div className="flex min-h-screen flex-col bg-primary-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/patient/home" className="text-sm text-primary-600 hover:text-primary-700">
            Back to Home
          </Link>
          <h1 className="text-lg font-semibold text-primary-700">Specialists</h1>
          <button
            onClick={() => alert('For emergencies please contact local services immediately.')}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Emergency
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-900">
              Specialist visits are curated by your GP. Share new symptoms or follow ups via a GP consult and we will
              coordinate the referral and booking for you.
            </p>
            <button
              onClick={handleStartGpConsult}
              className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Start GP Consult Session
            </button>
          </section>

          <section className="rounded-lg bg-white p-5 shadow">
            <h2 className="mb-3 text-base font-semibold text-primary-700">Referral Overview</h2>
            {referralSummary ? (
              <div className="space-y-2 text-sm text-ink">
                <p>
                  <span className="font-medium text-primary-700">Specialist selected:</span>{' '}
                  {referralSummary.selectedOption}
                </p>
                <p>
                  <span className="font-medium text-primary-700">GP rationale:</span> {referralSummary.rationale}
                </p>
                <p>
                  <span className="font-medium text-primary-700">Consent recorded:</span> {referralSummary.consentedAt}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                You do not have any specialist referrals yet. Request a GP consult to get started.
              </p>
            )}
          </section>

          {upcomingAppointment && (
            <section className="space-y-4 rounded-lg bg-white p-5 shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-primary-700">Upcoming Appointment</h2>
                  <p className="text-sm text-ink">{upcomingAppointment.specialistName}</p>
                  <p className="text-xs text-gray-500">{upcomingAppointment.specialty}</p>
                </div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 capitalize">
                  {upcomingAppointment.channel === 'online_wa'
                    ? 'Online · WhatsApp'
                    : upcomingAppointment.channel === 'online_app'
                    ? 'Online · In-app'
                    : 'In-person'}
                </span>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-ink">
                Scheduled for {upcomingAppointment.scheduledAt}
                {upcomingAppointment.location && (
                  <p className="mt-1 text-xs text-gray-600">Location: {upcomingAppointment.location}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {upcomingAppointment.channel === 'online_wa' && (
                  <button className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                    Join via WhatsApp
                  </button>
                )}
                <button className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-primary-700 hover:border-indigo-300 hover:text-indigo-700">
                  Request new time
                </button>
                <button className="flex-1 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  Cancel
                </button>
              </div>
            </section>
          )}

          <section className="rounded-lg bg-white p-5 shadow">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary-700">Diagnostics</h2>
              <span className="text-xs text-gray-500">Ordered by your specialist</span>
            </div>
            {diagnosticOrders.length === 0 ? (
              <p className="text-sm text-gray-600">
                No diagnostics ordered yet. When your specialist orders tests they will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {diagnosticOrders.map((order) => (
                  <div key={order.id} className="rounded-md border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary-700">{order.testName}</p>
                        <p className="text-xs text-gray-500">
                          Ordered {order.orderedOn} · {order.labName}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.status === 'completed' ? 'Result available' : 'Awaiting result'}
                      </span>
                    </div>
                    {order.resultUrl && (
                      <button className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                        View result & specialist summary
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg bg-white p-5 shadow">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary-700">Procedure Options</h2>
              <span className="text-xs text-gray-500">Selections sync with your consult thread</span>
            </div>
            {procedureOptions.length === 0 ? (
              <p className="text-sm text-gray-600">No procedure recommendations at this time.</p>
            ) : (
              <div className="space-y-3">
                {procedureOptions.map((procedure) => (
                  <div key={procedure.id} className="rounded-md border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-primary-700">{procedure.name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {procedure.setting} · Est. {procedure.estCost}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          procedure.status === 'selected'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {procedure.status === 'selected' ? 'Selected' : 'Proposed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg bg-white p-5 shadow">
            <h2 className="mb-3 text-base font-semibold text-primary-700">Past Specialist Visits</h2>
            {pastVisits.length === 0 ? (
              <p className="text-sm text-gray-600">No specialist visits yet.</p>
            ) : (
              <div className="space-y-3">
                {pastVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between rounded-md border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-primary-700">{visit.specialistName}</p>
                      <p className="text-xs text-gray-500">
                        {visit.specialty} · {visit.scheduledAt || 'Date TBD'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Completed
                      </span>
                      <button className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-primary-700 hover:border-indigo-300 hover:text-indigo-700">
                        View summary
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <nav className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={handleSpecialists} className="text-xs text-indigo-600">
            Specialists
          </button>
          <button onClick={handlePharmacy} className="text-xs text-gray-600 hover:text-indigo-600">
            Pharmacy
          </button>
          <button onClick={handleCare} className="text-xs text-gray-600 hover:text-indigo-600">
            Care
          </button>
          <button onClick={handleDiagnostics} className="text-xs text-gray-600 hover:text-indigo-600">
            Diagnostics
          </button>
          <button onClick={handleProfile} className="text-xs text-gray-600 hover:text-indigo-600">
            Profile
          </button>
        </div>
      </nav>
    </div>
  );
}


