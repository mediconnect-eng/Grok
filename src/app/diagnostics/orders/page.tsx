'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, authClient } from '@/lib/auth-client';

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
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  doctor_name: string;
  doctor_email: string;
  is_assigned: boolean;
}

interface StatusCounts {
  pending: number;
  scheduled: number;
  sample_collected: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export default function DiagnosticCenterDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<DiagnosticOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('unassigned');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    scheduled: 0,
    sample_collected: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [centerName, setCenterName] = useState('');
  const [centerId, setCenterId] = useState('');

  // Update order state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [resultsUrl, setResultsUrl] = useState<string>('');
  const [resultsNotes, setResultsNotes] = useState<string>('');

  useEffect(() => {
    if (!session?.user) {
      router.push('/diagnostics/login');
      return;
    }

    if ((session.user as any).role !== 'diagnostic_center') {
      router.push('/');
      return;
    }

    setCenterName(session.user.name || 'Diagnostic Center');
    setCenterId(session.user.id);
    fetchOrders(session.user.id);

    // Poll every 10 seconds for updates
    const interval = setInterval(() => {
      if (session.user.id) {
        fetchOrders(session.user.id);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    filterOrders();
  }, [activeTab, orders]);

  const fetchOrders = async (diagnosticCenterId: string) => {
    try {
      const response = await fetch(`/api/diagnostic-orders/diagnostic-center?diagnosticCenterId=${diagnosticCenterId}`);
      
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
    if (activeTab === 'unassigned') {
      setFilteredOrders(orders.filter(order => !order.is_assigned));
    } else if (activeTab === 'all') {
      setFilteredOrders(orders.filter(order => order.is_assigned));
    } else {
      setFilteredOrders(orders.filter(order => order.is_assigned && order.status === activeTab));
    }
  };

  const handleUpdateStatus = async (orderId: string) => {
    if (!updateStatus) {
      alert('Please select a status');
      return;
    }

    // Validation
    if (updateStatus === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      alert('Please provide scheduled date and time');
      return;
    }

    if (updateStatus === 'completed' && !resultsUrl) {
      alert('Please provide results URL');
      return;
    }

    try {
      setUpdatingOrderId(orderId);

      const response = await fetch(`/api/diagnostic-orders/${orderId}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosticCenterId: centerId,
          status: updateStatus,
          scheduledDate: updateStatus === 'scheduled' ? scheduledDate : undefined,
          scheduledTime: updateStatus === 'scheduled' ? scheduledTime : undefined,
          resultsUrl: updateStatus === 'completed' ? resultsUrl : undefined,
          resultsNotes: updateStatus === 'completed' ? resultsNotes : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Refresh orders
      await fetchOrders(centerId);

      // Reset form
      setUpdateStatus('');
      setScheduledDate('');
      setScheduledTime('');
      setResultsUrl('');
      setResultsNotes('');
      
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
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

  const getNextStatuses = (currentStatus: string): string[] => {
    const statusFlow: Record<string, string[]> = {
      pending: ['scheduled', 'cancelled'],
      scheduled: ['sample_collected', 'cancelled'],
      sample_collected: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    return statusFlow[currentStatus] || [];
  };

  const unassignedCount = orders.filter(o => !o.is_assigned).length;
  const assignedOrders = orders.filter(o => o.is_assigned);

  const tabs = [
    { key: 'unassigned', label: 'Available Orders', count: unassignedCount },
    { key: 'all', label: 'My Orders', count: assignedOrders.length },
    { key: 'scheduled', label: 'Scheduled', count: statusCounts.scheduled },
    { key: 'in_progress', label: 'In Progress', count: statusCounts.in_progress + statusCounts.sample_collected },
    { key: 'completed', label: 'Completed', count: statusCounts.completed },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">{centerName}</h1>
              <p className="mt-1 text-sm text-gray-600">Diagnostic Orders Dashboard</p>
            </div>
            <button
              onClick={async () => {
                await authClient.signOut();
                router.push('/diagnostics/login');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Sign Out
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
              {activeTab === 'unassigned' ? 'No available orders' : `No ${activeTab === 'all' ? '' : activeTab.replace('_', ' ')} orders`}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'unassigned' 
                ? 'Check back later for new diagnostic orders'
                : `You don't have any ${activeTab === 'all' ? '' : activeTab.replace('_', ' ')} orders at the moment`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                      {!order.is_assigned && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-300">
                          AVAILABLE TO CLAIM
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Ordered on {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="mb-4 pb-4 border-b border-gray-200 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Patient Information:</h4>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Name:</span> {order.patient_name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Email:</span> {order.patient_email}
                  </p>
                  {order.patient_phone && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Phone:</span> {order.patient_phone}
                    </p>
                  )}
                </div>

                {/* Doctor Info */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">Ordered by:</span> {order.doctor_name}
                  </p>
                  <p className="text-sm text-gray-600">{order.doctor_email}</p>
                </div>

                {/* Test Types */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tests Required:</h4>
                  <div className="flex flex-wrap gap-2">
                    {order.test_types.map((test, index) => (
                      <span key={index} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                        {test}
                      </span>
                    ))}
                  </div>
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

                {/* Scheduled Info */}
                {order.scheduled_date && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">📅 Scheduled Appointment:</h4>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{formatDate(order.scheduled_date)}</span>
                      {order.scheduled_time && <span> at {order.scheduled_time}</span>}
                    </p>
                  </div>
                )}

                {/* Results Display */}
                {order.status === 'completed' && order.results_url && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">✅ Results Uploaded:</h4>
                    {order.results_notes && (
                      <p className="text-sm text-gray-700 mb-2">{order.results_notes}</p>
                    )}
                    <a
                      href={order.results_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 underline"
                    >
                      View Results →
                    </a>
                  </div>
                )}

                {/* Update Status Section */}
                {order.is_assigned && order.status !== 'completed' && order.status !== 'cancelled' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Update Order Status:</h4>
                    
                    <div className="space-y-4">
                      {/* Status Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Status
                        </label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select status...</option>
                          {getNextStatuses(order.status).map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Schedule Form */}
                      {updateStatus === 'scheduled' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Time
                            </label>
                            <input
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Results Form */}
                      {updateStatus === 'completed' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Results URL <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="url"
                              value={resultsUrl}
                              onChange={(e) => setResultsUrl(e.target.value)}
                              placeholder="https://example.com/results.pdf"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Results Notes (Optional)
                            </label>
                            <textarea
                              value={resultsNotes}
                              onChange={(e) => setResultsNotes(e.target.value)}
                              placeholder="Any additional notes about the results..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Update Button */}
                      <button
                        onClick={() => handleUpdateStatus(order.id)}
                        disabled={!updateStatus || updatingOrderId === order.id}
                        className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingOrderId === order.id ? 'Updating...' : 'Update Status'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Claim Button for Unassigned Orders */}
                {!order.is_assigned && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setUpdateStatus('scheduled');
                        // Pre-fill today's date
                        setScheduledDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="w-full px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                    >
                      🎯 Claim Order & Schedule Appointment
                    </button>
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      Claiming this order will assign it to your diagnostic center
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
