'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';
import { useSharedState } from '@/lib/use-shared-state';
import { SharedPrescription, Referral } from '@/lib/shared-state';

export default function SpecialistDashboard() {
  const sharedState = useSharedState();
  const [activeTab, setActiveTab] = useState<'referrals' | 'diagnostics' | 'procedures'>('referrals');
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const previousReferralCount = useRef(0);

  const referrals = sharedState.referrals;

  useEffect(() => {
    if (!selectedReferralId && referrals.length > 0) {
      setSelectedReferralId(referrals[0].id);
    }
    if (referrals.length === 0) {
      setSelectedReferralId(null);
    }
  }, [referrals, selectedReferralId]);

  useEffect(() => {
    const count = referrals.length;
    if (count > previousReferralCount.current) {
      setToast('New referral received from GP.');
      const id = window.setTimeout(() => setToast(null), 4000);
      previousReferralCount.current = count;
      return () => window.clearTimeout(id);
    }
    previousReferralCount.current = count;
  }, [referrals.length]);

  const selectedReferral: Referral | undefined = useMemo(
    () => referrals.find((referral) => referral.id === selectedReferralId) || referrals[0],
    [referrals, selectedReferralId]
  );

  const diagnostics = selectedReferral?.diagnostics ?? [];
  const procedures = selectedReferral?.procedures ?? [];

  const activePrescription: SharedPrescription | undefined = useMemo(() => {
    if (!sharedState.activePrescriptionId) return undefined;
    return sharedState.prescriptions.find((p) => p.id === sharedState.activePrescriptionId);
  }, [sharedState.activePrescriptionId, sharedState.prescriptions]);

  return (
    <AuthGuard role="specialist">
      <div className="min-h-screen bg-gray-50">
        {toast && (
          <div className="bg-indigo-600 text-white text-sm text-center py-2">{toast}</div>
        )}

        <header className="bg-white shadow">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Mediconnect
            </Link>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Specialist Portal · Dr. Sarah Johnson (Cardiology)</span>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Specialist Workspace</h1>
            <p className="mt-2 text-sm text-gray-600">
              Review GP referrals, coordinate diagnostics, and manage post-consult follow ups. Data stays empty until
              you seed the environment.
            </p>
          </div>

          <nav className="mb-6 flex gap-6 border-b border-gray-200 text-sm">
            {[
              { id: 'referrals', label: 'Referrals' },
              { id: 'diagnostics', label: 'Diagnostics' },
              { id: 'procedures', label: 'Procedures' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`border-b-[3px] px-1 pb-2 font-medium ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'referrals' && (
            <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="space-y-4">
                {referrals.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No referrals yet. When the GP escalates a patient, the packet will appear here instantly.
                  </p>
                )}
                {referrals.map((referral) => (
                  <button
                    key={referral.id}
                    onClick={() => setSelectedReferralId(referral.id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      selectedReferral?.id === referral.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">{referral.patientName}</span>
                      <span className="text-gray-500">{referral.specialistName}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{referral.specialty}</p>
                    <p className="mt-2 text-xs text-gray-500 capitalize">Status: {referral.status}</p>
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                {!selectedReferral ? (
                  <p className="text-sm text-gray-500">Select a referral to view the patient packet.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Referral {selectedReferral.id} · {selectedReferral.patientName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedReferral.specialistName} · {selectedReferral.specialty}
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                        {selectedReferral.status}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-gray-700">Channel</dt>
                        <dd>
                          {selectedReferral.channel === 'online_wa'
                            ? 'WhatsApp video'
                            : selectedReferral.channel === 'online_app'
                            ? 'In-app call'
                            : 'In-person'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-700">Scheduled</dt>
                        <dd>{selectedReferral.scheduledAt || 'Awaiting scheduling'}</dd>
                      </div>
                    </dl>

                    {selectedReferral.notes && (
                      <section className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-700">GP notes</h3>
                        <p className="mt-1 text-sm text-gray-600">{selectedReferral.notes}</p>
                      </section>
                    )}

                    <div className="mt-6 grid gap-2 sm:grid-cols-3">
                      <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        Open consult
                      </button>
                      <button className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700">
                        Order diagnostics
                      </button>
                      <button className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700">
                        Post summary
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {activeTab === 'diagnostics' && (
            <section className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                {!selectedReferral ? (
                  <p className="text-sm text-gray-500">
                    Select a referral first to review the diagnostics that were ordered.
                  </p>
                ) : diagnostics.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No diagnostics ordered for this referral yet. Use &ldquo;Order diagnostics&rdquo; from the referral
                    view to create one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {diagnostics.map((order) => (
                      <div key={order.id} className="rounded-md border border-gray-100 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{order.testName}</p>
                            <p className="text-xs text-gray-500">
                              {order.labName} · Ordered {order.orderedOn}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {order.status === 'completed' ? 'Result available' : 'Pending'}
                          </span>
                        </div>
                        {order.resultUrl && (
                          <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                            View result package
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activePrescription && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Active prescription shared from patient</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Prescription #{activePrescription.id} · QR {activePrescription.qrToken}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                    {activePrescription.items.map((item, index) => (
                      <li key={index}>
                        {item.name} — {item.dosage} (Quantity {item.quantity})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {activeTab === 'procedures' && (
            <section className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                {!selectedReferral ? (
                  <p className="text-sm text-gray-500">
                    Choose a referral to see or propose procedure options for that patient.
                  </p>
                ) : procedures.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No procedure options recorded. Add a proposal from the referral view when needed.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {procedures.map((procedure) => (
                      <div key={procedure.id} className="rounded-md border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{procedure.name}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {procedure.setting} · Est. {procedure.estCost}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              procedure.status === 'selected'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {procedure.status === 'selected' ? 'Selected by patient' : 'Awaiting patient decision'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
