'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import Pagination, { usePagination } from '@/components/Pagination';

interface HistoryItem {
  id: string;
  type: 'consultation' | 'prescription' | 'referral' | 'diagnostic';
  title: string;
  description: string;
  date: string;
  status: string;
  provider?: string;
  details?: any;
}

export default function PatientHistoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'consultation' | 'prescription' | 'referral' | 'diagnostic'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }
    fetchHistory();
  }, [session]);

  const fetchHistory = async () => {
    try {
      const [consultationsRes, prescriptionsRes, diagnosticsRes, referralsRes] = await Promise.all([
        fetch(`/api/consultations/patient?patientId=${session?.user?.id}`),
        fetch(`/api/prescriptions/patient?patientId=${session?.user?.id}`),
        fetch(`/api/diagnostic-orders/patient?patientId=${session?.user?.id}`),
        fetch(`/api/referrals/patient?patientId=${session?.user?.id}`)
      ]);

      const items: HistoryItem[] = [];

      // Process consultations
      if (consultationsRes.ok) {
        const consultationsData = await consultationsRes.json();
        consultationsData.consultations?.forEach((c: any) => {
          items.push({
            id: c.id,
            type: 'consultation',
            title: 'Consultation',
            description: c.chief_complaint,
            date: c.created_at,
            status: c.status,
            provider: c.doctor_name || 'Doctor',
            details: c
          });
        });
      }

      // Process prescriptions
      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json();
        prescriptionsData.prescriptions?.forEach((p: any) => {
          items.push({
            id: p.id,
            type: 'prescription',
            title: 'Prescription',
            description: `${p.medications?.length || 0} medication(s) prescribed`,
            date: p.created_at,
            status: p.status,
            provider: p.doctor_name || 'Doctor',
            details: p
          });
        });
      }

      // Process diagnostic orders
      if (diagnosticsRes.ok) {
        const diagnosticsData = await diagnosticsRes.json();
        diagnosticsData.orders?.forEach((d: any) => {
          items.push({
            id: d.id,
            type: 'diagnostic',
            title: 'Diagnostic Test',
            description: d.test_types?.join(', ') || 'Diagnostic tests ordered',
            date: d.created_at,
            status: d.status,
            provider: d.doctor_name || 'Doctor',
            details: d
          });
        });
      }

      // Process referrals
      if (referralsRes.ok) {
        const referralsData = await referralsRes.json();
        referralsData.referrals?.forEach((r: any) => {
          items.push({
            id: r.id,
            type: 'referral',
            title: `Referral to ${r.specialization}`,
            description: r.reason,
            date: r.created_at,
            status: r.status,
            provider: r.referring_provider_name || 'Doctor',
            details: r
          });
        });
      }

      // Sort by date (newest first)
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistory(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return '👨‍⚕️';
      case 'prescription':
        return '💊';
      case 'diagnostic':
        return '🔬';
      case 'referral':
        return '🏥';
      default:
        return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-700';
      case 'prescription':
        return 'bg-green-100 text-green-700';
      case 'diagnostic':
        return 'bg-purple-100 text-purple-700';
      case 'referral':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'fulfilled':
      case 'ready':
      case 'results_available':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'requested':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
      case 'preparing':
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
      case 'rejected':
      case 'declined':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredHistory = history.filter(item => {
    // Filter by type
    if (filter !== 'all' && item.type !== filter) return false;
    
    // Filter by search query
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.provider?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Apply pagination to filtered results
  const { currentPage, totalPages, currentItems, setCurrentPage } = usePagination(filteredHistory, 10);

  const getDetailLink = (item: HistoryItem) => {
    switch (item.type) {
      case 'consultation':
        return `/patient/consultations/${item.id}`;
      case 'prescription':
        return `/patient/prescriptions/${item.id}`;
      case 'diagnostic':
        return `/patient/diagnostics/${item.id}`;
      case 'referral':
        return `/patient/referrals/${item.id}`;
      default:
        return '#';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/patient" className="text-primary-600 hover:text-primary-700 font-medium">
              ← Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Medical History</h1>
            <div className="w-40"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-card">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by title, description, or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {(['all', 'consultation', 'prescription', 'diagnostic', 'referral'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-button text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'all' && ` (${history.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* History Timeline */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filter !== 'all' ? 'No results found' : 'No medical history yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Your medical history will appear here as you use HealthHub services'}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-button hover:bg-primary-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Timeline items */}
            <div className="space-y-6">
              {currentItems.map((item, index) => (
                <div key={item.id} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className="absolute left-6 top-6 w-4 h-4 bg-white border-4 border-primary-600 rounded-full"></div>

                  {/* Timeline card */}
                  <Link
                    href={getDetailLink(item)}
                    className="block bg-white rounded-card shadow-card p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getTypeIcon(item.type)}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(item.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3">{item.description}</p>

                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {item.provider && (
                            <span className="text-sm text-gray-600">
                              Provider: <span className="font-medium">{item.provider}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={10}
                  totalItems={filteredHistory.length}
                  showItemsInfo
                />
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {['consultation', 'prescription', 'diagnostic', 'referral'].map((type) => {
            const count = history.filter(item => item.type === type).length;
            return (
              <div key={type} className="bg-white rounded-card shadow-card p-4 text-center">
                <div className="text-3xl mb-2">{getTypeIcon(type)}</div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{type}s</div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
