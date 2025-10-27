'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from '@/lib/auth-client';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { data: session } = useSession();
  return (
    <header className="bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/mediconnect_brand_pack/mediconnect-logo-wordmark.svg" 
                alt="Mediconnect" 
                width={160} 
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <nav className="hidden md:flex ml-8 space-x-6">
              {/* Link to role-specific login pages so each portal requires authentication */}
              <Link href="/auth/patient/login" className="text-sm text-body hover:text-primary-600 transition-colors">Patient</Link>
              <Link href="/auth/gp/login" className="text-sm text-body hover:text-primary-600 transition-colors">GP</Link>
              <Link href="/auth/specialist/login" className="text-sm text-body hover:text-primary-600 transition-colors">Specialist</Link>
              <Link href="/auth/pharmacy/login" className="text-sm text-body hover:text-primary-600 transition-colors">Pharmacy</Link>
              <Link href="/auth/diagnostics/login" className="text-sm text-body hover:text-primary-600 transition-colors">Diagnostics</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Show notification bell if user is logged in */}
            {session?.user && <NotificationBell userId={session.user.id} />}
            <Link href="/contact" className="text-sm text-body hover:text-primary-600 transition-colors">Contact</Link>
            <Link href="/privacy" className="text-sm text-body hover:text-primary-600 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
