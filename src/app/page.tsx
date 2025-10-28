import Link from 'next/link';
import {
  StethoscopeIcon,
  CapsuleIcon,
  FlaskIcon,
  BadgeIcon,
  VideoCallIcon,
  ShieldIcon,
} from '@/components/BrandIcons';

const partnerLinks = [
  {
    label: 'General Practitioner',
    href: '/gp/login',
    description: 'Coordinate primary care, referrals, and shared consult threads.',
    Icon: StethoscopeIcon,
  },
  {
    label: 'Specialist',
    href: '/specialist/login',
    description: 'Review referral packets, run consults, and record post-visit plans.',
    Icon: BadgeIcon,
  },
  {
    label: 'Pharmacy',
    href: '/pharmacy/login',
    description: 'Verify digital prescriptions and manage dispensing workflows.',
    Icon: CapsuleIcon,
  },
  {
    label: 'Diagnostics',
    href: '/diagnostics/login',
    description: 'Process specialist orders and publish results to the consult thread.',
    Icon: FlaskIcon,
  },
];

const highlights = [
  {
    title: 'One connected care stack',
    copy: 'Patient, GP, specialist, pharmacy, and diagnostics collaborate on a single auditable thread.',
    Icon: VideoCallIcon,
  },
  {
    title: 'Trusted by regulators',
    copy: 'Purpose-based access, strong encryption, and full audit logs built for Healthcare-as-a-Service.',
    Icon: ShieldIcon,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.35),_transparent_55%)]" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom,_rgba(79,70,229,0.35),_transparent_55%)]" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-24 text-center lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium tracking-wide backdrop-blur-md">
            Mediconnect Healthcare Network
          </span>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl lg:leading-snug">
            Seamless digital care for patients, providers, and partners
          </h1>
          <p className="max-w-2xl text-lg text-white/80 sm:text-xl">
            Activate secure GP triage, specialist referrals, diagnostics, pharmacy fulfilment, and patient follow-up—
            all inside one Healthcare-as-a-Service platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/patient/login"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Continue as Patient
            </Link>
            <Link
              href="/specialist/login"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Explore Partner Portals
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-16 space-y-20 rounded-t-[48px] bg-white pb-24 pt-16 text-gray-900">
        <section className="mx-auto grid max-w-5xl gap-8 px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-primary-900 sm:text-4xl">
              Choose how you want to sign in
            </h2>
            <p className="text-base text-body">
              Patients can jump straight into their care plan. Partners pick the secure workspace that matches their
              role. Every login sits on top of the same governed, consented patient thread.
            </p>
            <div className="flex flex-col gap-4 md:flex-row">
              <Link
                href="/patient/login"
                className="flex flex-1 items-center justify-between rounded-card border border-primary-100 bg-primary-50/70 p-6 shadow-card transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl"
              >
                <div>
                  <p className="text-sm font-semibold text-primary-700 uppercase tracking-wide">Patients</p>
                  <h3 className="mt-1 text-xl font-semibold text-primary-900">Access your care journey</h3>
                  <p className="mt-2 text-sm text-primary-700">
                    Check consult notes, manage prescriptions, and follow your specialist plans.
                  </p>
                </div>
                <span className="ml-4 hidden text-lg font-semibold text-primary-700 md:block">→</span>
              </Link>
              <div className="flex-1 rounded-card border border-gray-200 bg-white p-6 shadow-card">
                <p className="text-sm font-semibold uppercase tracking-wide text-subtle">Partners</p>
                <p className="mt-1 text-sm text-body">
                  Select your portal to collaborate on shared patient workflows.
                </p>
                <div className="mt-5 space-y-3">
                  {partnerLinks.map(({ label, href, description, Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm transition hover:border-primary-200 hover:bg-primary-50/70 hover:text-primary-800"
                    >
                      <Icon className="mt-1 h-5 w-5 text-primary-500" />
                      <div>
                        <p className="font-semibold">{label}</p>
                        <p className="text-xs text-subtle">{description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <aside className="rounded-3xl bg-gradient-to-br from-primary-600 to-secondary-600 p-6 text-white shadow-xl">
            <h3 className="text-lg font-semibold">Platform highlights</h3>
            <div className="mt-6 space-y-5 divide-y divide-white/20">
              {highlights.map(({ title, copy, Icon }) => (
                <div key={title} className="flex gap-4 pt-5 first:pt-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-white/80">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mx-auto max-w-6xl space-y-12 px-6 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-teal-600">CARE JOURNEYS</span>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Every handoff stays visible and on time</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Guide patients from first booking through specialist care and long-term follow-up. HealthHub keeps tasks, notes, refills, and consult records in one shared thread so nothing slips between teams.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Welcome and triage</h3>
              <p className="mt-3 text-sm text-slate-600">
                Guide patients through digital intake, consents, and pre-consult checklists before the first session.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Collaborative consults</h3>
              <p className="mt-3 text-sm text-slate-600">
                GPs, specialists share notes and decisions, and access full context without needing to call or chase files.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Diagnostics in lockstep</h3>
              <p className="mt-3 text-sm text-slate-600">
                Orders transfer with a click, and results post back into the shared thread with alerts to the relevant practitioner.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <span className="text-2xl font-bold">4</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Medication and follow-up</h3>
              <p className="mt-3 text-sm text-slate-600">
                Pharmacies confirm dispensing and provide counseling notes while patients get clear reminders.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <ShieldIcon className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Role-based secure controls</h3>
              <p className="mt-3 text-sm text-slate-600">
                Each partner sees only what's needed for their role. Logs track who accessed what and when for full compliance.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <VideoCallIcon className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Audit-ready history</h3>
              <p className="mt-3 text-sm text-slate-600">
                Every care event is timestamped, logged, and tied to the patient thread so audits stay simple and transparent.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 to-slate-800 p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">Ready to bring your care network together?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-100">
              HealthHub is agile enough to grow your network, versatile enough to handle any care model, and secure enough for regulated healthcare delivery.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/patient/signup"
                className="rounded-full bg-white px-8 py-4 text-base font-semibold text-teal-900 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                Create patient account
              </Link>
              <Link
                href="/contact"
                className="rounded-full border-2 border-white px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Schedule a discovery call
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900 py-12 text-center text-sm text-slate-400">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 px-6">
          <Link href="/privacy" className="hover:text-teal-400">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-teal-400">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:text-teal-400">
            Contact
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-500">&copy; {new Date().getFullYear()} HealthHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
