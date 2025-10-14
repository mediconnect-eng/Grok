'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

interface DiagnosticOrder {
  id: string;
  test_types: string[];
  special_instructions: string | null;
  urgency: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  results_url: string | null;
  results_notes: string | null;
  created_at: string;
  doctor_name: string;
  doctor_email: string;
  diagnostic_center_name: string | null;
  diagnostic_center_email: string | null;
  diagnostic_center_phone: string | null;
}

interface StatusCounts {
  pending: number;
  scheduled: number;
  sample_collected: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export default function PatientDiagnosticOrdersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<DiagnosticOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    scheduled: 0,
    sample_collected: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/patient/login');
      return;
    }

    if ((session.user as any).role !== 'patient') {
      router.push('/');
      return;
    }

    fetchOrders(session.user.id);
    // Poll every 10 seconds for updates
    const interval = setInterval(() => fetchOrders(session.user.id), 10000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    filterOrders();
  }, [activeTab, orders]);

  const fetchOrders = async (patientId: string) => {
    try {
      const response = await fetch(`/api/diagnostic-orders/patient?patientId=${patientId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setStatusCounts(data.statusCounts || {
        pending: 0,
        scheduled: 0,
        sample_collected: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      });
    } catch (error) {
      console.error('Error fetching diagnostic orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (activeTab === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === activeTab));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
      sample_collected: 'bg-purple-100 text-purple-800 border-purple-300',
      in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getUrgencyBadgeColor = (urgency: string) => {
    const colors: Record<string, string> = {
      routine: 'bg-gray-100 text-gray-700 border-gray-300',
      urgent: 'bg-orange-100 text-orange-700 border-orange-300',
      emergency: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'pending', label: 'Pending', count: statusCounts.pending },
    { key: 'scheduled', label: 'Scheduled', count: statusCounts.scheduled },
    { key: 'in_progress', label: 'In Progress', count: statusCounts.in_progress + statusCounts.sample_collected },
    { key: 'completed', label: 'Completed', count: statusCounts.completed },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your diagnostic orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Diagnostic Orders</h1>
              <p className="mt-1 text-sm text-gray-600">View your lab tests and imaging orders</p>
            </div>
            <button
              onClick={() => router.push('/patient/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🔬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'all' ? 'No diagnostic orders yet' : `No ${activeTab.replace('_', ' ')} orders`}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'all' 
                ? 'Your doctor will order diagnostic tests when needed'
                : `You don't have any ${activeTab.replace('_', ' ')} orders at the moment`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyBadgeColor(order.urgency)}`}>
                        {order.urgency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ordered on {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>

                {/* Test Types */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tests Ordered:</h4>
                  <div className="flex flex-wrap gap-2">
                    {order.test_types.map((test, index) => (
                      <span key={index} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                        {test}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">Ordered by:</span> {order.doctor_name}
                  </p>
                </div>

                {/* Special Instructions */}
                {order.special_instructions && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Special Instructions:</h4>
                    <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      ⚠️ {order.special_instructions}
                    </p>
                  </div>
                )}

                {/* Diagnostic Center Info */}
                {order.diagnostic_center_name && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Diagnostic Center:</h4>
                    <p className="text-sm text-gray-700 font-medium">{order.diagnostic_center_name}</p>
                    {order.diagnostic_center_phone && (
                      <p className="text-sm text-gray-600">📞 {order.diagnostic_center_phone}</p>
                    )}
                    {order.diagnostic_center_email && (
                      <p className="text-sm text-gray-600">✉️ {order.diagnostic_center_email}</p>
                    )}
                  </div>
                )}

                {/* Scheduled Info */}
                {order.status === 'scheduled' && order.scheduled_date && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">📅 Appointment Scheduled:</h4>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{formatDate(order.scheduled_date)}</span>
                      {order.scheduled_time && <span> at {order.scheduled_time}</span>}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Please arrive 15 minutes early and bring a valid ID
                    </p>
                  </div>
                )}

                {/* In Progress Info */}
                {(order.status === 'sample_collected' || order.status === 'in_progress') && (
                  <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      {order.status === 'sample_collected' 
                        ? '✅ Your samples have been collected and are being sent to the lab'
                        : '🔬 Your tests are currently being processed'
                      }
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      You'll be notified when the results are ready
                    </p>
                  </div>
                )}

                {/* Results */}
                {order.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">✅ Results Available</h4>
                    {order.results_notes && (
                      <p className="text-sm text-gray-700 mb-3">{order.results_notes}</p>
                    )}
                    {order.results_url && (
                      <a
                        href={order.results_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                      >
                        📄 View/Download Results
                      </a>
                    )}
                  </div>
                )}

                {/* Cancelled Info */}
                {order.status === 'cancelled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      ❌ This order has been cancelled. Please contact the diagnostic center or your doctor for more information.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
