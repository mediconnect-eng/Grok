'use client';

import Link from 'next/link';
import {
  StethoscopeIcon,
  CapsuleIcon,
  FlaskIcon,
  BadgeIcon,
  VideoCallIcon,
  ShieldIcon,
  QRIcon,
  LockIcon,
  MapPinIcon,
  HeartPulseIcon,
  UsersIcon,
  ClipboardIcon,
} from '@/components/BrandIcons';

const partnerLinks = [
  {
    label: 'General Practitioner',
    href: '/gp/login',
    description: 'Run digital triage, track referrals, and keep patients informed without phone tag.',
    Icon: StethoscopeIcon,
  },
  {
    label: 'Specialist',
    href: '/specialist/login',
    description: 'Review multidisciplinary notes, deliver consults, and hand back actionable plans.',
    Icon: BadgeIcon,
  },
  {
    label: 'Pharmacy',
    href: '/pharmacy/login',
    description: 'Verify scripts, log dispensing, and send counselling notes to the care team.',
    Icon: CapsuleIcon,
  },
  {
    label: 'Diagnostics',
    href: '/diagnostics/login',
    description: 'Publish imaging and lab updates directly to the shared patient timeline.',
    Icon: FlaskIcon,
  },
];

const heroHighlights = [
  {
    title: 'Orchestrated care plans',
    copy: 'Keep every stakeholder aligned with shared consult timelines, notes, and tasks.',
    Icon: ClipboardIcon,
  },
  {
    title: 'Partner-specific workspaces',
    copy: 'GPs, specialists, diagnostics, and pharmacy teams see tailored tools for their role.',
    Icon: UsersIcon,
  },
  {
    title: 'Security at the core',
    copy: 'Consent-driven permissions, encryption, and audit logs protect sensitive health data.',
    Icon: ShieldIcon,
  },
];

const journeyMilestones = [
  {
    title: 'Welcome and triage',
    copy: 'Guide patients through digital intake, consents, and pre-consult checklists before day one.',
    Icon: MapPinIcon,
  },
  {
    title: 'Collaborative consults',
    copy: 'GPs and specialists share video calls, decisions, and action lists without switching apps.',
    Icon: VideoCallIcon,
  },
  {
    title: 'Diagnostics in lockstep',
    copy: 'Orders, results, and imaging land in the shared thread with alerts for the whole care team.',
    Icon: FlaskIcon,
  },
  {
    title: 'Medication and follow-up',
    copy: 'Pharmacies confirm dispensing and provide counselling notes while patients get clear reminders.',
    Icon: CapsuleIcon,
  },
];

const securityCommitments = [
  {
    title: 'Role-based access controls',
    copy: "Every action is scoped to the partner's approved permissions to minimise data exposure.",
    Icon: LockIcon,
  },
  {
    title: 'Verified identities',
    copy: 'Multi-factor sign in and unique portal invitations keep identities trusted end to end.',
    Icon: QRIcon,
  },
  {
    title: 'Audit-ready history',
    copy: 'Immutable event logs make it easy to evidence compliance and respond to accreditation reviews.',
    Icon: ShieldIcon,
  },
];

export default function Home() {
  const scrollToPartners = () => {
    const partnersSection = document.getElementById('partner-portals');
    if (partnersSection) {
      partnersSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-950 via-primary-900 to-primary-950 text-white">
      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 bg-primary-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-secondary-500 shadow-lg">
              <HeartPulseIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">HealthHub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/patient/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/patient/signup"
              className="rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/3 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute left-0 top-1/2 h-[300px] w-[300px] -translate-x-1/3 -translate-y-1/2 rounded-full bg-primary-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-20 text-center lg:px-8 lg:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 shadow-lg backdrop-blur-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-sm font-semibold tracking-wide text-white">
              Healthcare coordination platform
            </span>
          </div>
          <div className="max-w-4xl space-y-6">
            <h1 className="bg-gradient-to-br from-white via-white to-white/80 bg-clip-text text-5xl font-bold leading-tight text-transparent sm:text-6xl lg:text-7xl lg:leading-tight">
              Connected healthcare in one digital home
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl">
              HealthHub unites patients, GPs, specialists, diagnostics, and pharmacy teams on a single secure platform
              where every moment of care stays coordinated.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/patient/signup"
              className="group flex items-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-primary-900 shadow-2xl transition hover:-translate-y-1 hover:shadow-3xl"
            >
              Create patient account
              <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <button
              onClick={scrollToPartners}
              className="rounded-full border-2 border-white/40 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10"
            >
              Explore partner portals
            </button>
          </div>
          <div className="mt-8 grid w-full gap-6 rounded-3xl border border-white/20 bg-white/5 p-8 text-left backdrop-blur-md shadow-2xl md:grid-cols-3">
            {heroHighlights.map(({ title, copy, Icon }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 shadow-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-sm leading-relaxed text-white/80">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="relative space-y-24 bg-white pb-24 pt-16 text-gray-900">
        <section className="mx-auto max-w-6xl px-6 lg:px-8" id="partner-portals">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-50 to-secondary-50 px-4 py-2 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-primary-500" />
                <span className="text-sm font-semibold uppercase tracking-wider text-primary-700">
                  Partner portals
                </span>
              </div>
              <h2 className="text-4xl font-bold text-primary-900 sm:text-5xl">
                Purpose-built spaces for every care partner
              </h2>
              <p className="text-lg leading-relaxed text-gray-600">
                Each portal is designed for specific roles—GPs, specialists, diagnostics, and pharmacies—with tools that
                keep teams focused while maintaining a unified patient narrative.
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                {partnerLinks.map(({ label, description, href, Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex h-full flex-col gap-4 rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg">
                          <Icon className="h-6 w-6" />
                        </div>
                        <p className="font-semibold text-primary-900">{label}</p>
                      </div>
                      <svg className="h-5 w-5 text-primary-500 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600">{description}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 p-10 text-white shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <HeartPulseIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold">Why teams choose HealthHub</h3>
              <ul className="mt-8 space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white/95">Secure messaging, video, tasks, and documents live on one patient timeline</p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white/95">Automated consent checks and permissions keep sensitive data scoped to each role</p>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white/95">Real-time analytics give providers visibility across throughput, wait times, and outcomes</p>
                </li>
              </ul>
              <Link
                href="/contact"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-primary-700 shadow-xl transition hover:shadow-2xl hover:brightness-105"
              >
                Request a walkthrough
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="space-y-5">
              <span className="inline-block rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-600">
                Care journeys
              </span>
              <h2 className="text-3xl font-semibold text-primary-900 sm:text-4xl">
                Every handoff stays visible and on time
              </h2>
              <p className="text-base text-body">
                Guide patients from first booking through specialist care and long-term follow-up. HealthHub keeps tasks,
                notes, and decisions in context so nothing drops between teams.
              </p>
              <ol className="space-y-6 border-l-2 border-primary-100 pl-6">
                {journeyMilestones.map(({ title, copy, Icon }, index) => (
                  <li key={title} className="relative space-y-1">
                    <span className="absolute -left-10 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Step {index + 1}</p>
                    <p className="text-lg font-semibold text-primary-900">{title}</p>
                    <p className="text-sm text-body">{copy}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-surface p-10 shadow-lg">
              <h3 className="text-xl font-semibold text-primary-900">Care room snapshot</h3>
              <p className="mt-3 text-sm text-body">
                Inside each patient record you can see upcoming consults, open tasks, medication status, diagnostic
                orders, and notes from the entire extended care team.
              </p>
              <div className="mt-8 space-y-5">
                <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Live status</p>
                  <p className="mt-2 text-sm text-primary-800">
                    Instant alerts when a specialist clears a plan or a pharmacy confirms fulfilment keep patients
                    informed without phone tag.
                  </p>
                </div>
                <div className="rounded-2xl border border-secondary-100 bg-secondary-50/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary-600">Shared documents</p>
                  <p className="mt-2 text-sm text-secondary-800">
                    Upload imaging, care plans, and discharge summaries with automatic versioning and read receipts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-10">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-4">
                <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
                  Security and trust
                </span>
                <h2 className="text-3xl font-semibold text-primary-900 sm:text-4xl">
                  Built for safe, compliant healthcare delivery
                </h2>
                <p className="text-base text-body">
                  HealthHub is engineered with the safeguards clinics expect from enterprise healthcare platforms. Every
                  action is observable and every data exchange is encrypted.
                </p>
              </div>
              <div className="grid flex-1 gap-6 sm:grid-cols-2">
                {securityCommitments.map(({ title, copy, Icon }) => (
                  <div
                    key={title}
                    className="flex h-full flex-col gap-3 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600/10 text-primary-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-primary-900">{title}</p>
                      <p className="text-sm text-body">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="rounded-3xl bg-primary-900 px-10 py-12 text-white shadow-2xl">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-semibold">Ready to bring your care network together?</h2>
              <p className="text-sm text-white/80">
                HealthHub activates in days, not months. Invite your first cohort of patients and partners to experience
                a seamless, secure digital clinic.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/patient/signup"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Create patient account
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Schedule a discovery call
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-primary-950/90 py-10 text-center text-sm text-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 px-6">
          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
        </div>
        <p className="mt-6 text-xs text-white/60">&copy; {new Date().getFullYear()} HealthHub. All rights reserved.</p>
      </footer>
    </div>
  );
}


