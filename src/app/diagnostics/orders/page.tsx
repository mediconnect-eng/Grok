'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DiagnosticOrder {
  id: string;
  patientId: string;
  gpId: string;
  diagnosticsId: string;
  dateOrdered: string;
  status: string;
  tests: Array<{
    name: string;
    code: string;
    status: string;
  }>;
  results?: Array<{
    testName: string;
    result: string;
    referenceRange: string;
    date: string;
  }>;
}

export default function DiagnosticsOrders() {
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock API call - in real app, fetch from API
    const mockOrders: DiagnosticOrder[] = [
      {
        id: 'order-1',
        patientId: 'patient-1',
        gpId: 'gp-1',
        diagnosticsId: 'diagnostics-1',
        dateOrdered: '2024-10-01',
        status: 'pending',
        tests: [
          {
            name: 'Blood Test - Full Blood Count',
            code: 'FBC',
            status: 'pending'
          },
          {
            name: 'X-Ray - Chest',
            code: 'CXR',
            status: 'pending'
          }
        ]
      },
      {
        id: 'order-2',
        patientId: 'patient-2',
        gpId: 'gp-1',
        diagnosticsId: 'diagnostics-1',
        dateOrdered: '2024-09-28',
        status: 'completed',
        tests: [
          {
            name: 'Urine Analysis',
            code: 'UA',
            status: 'completed'
          }
        ],
        results: [
          {
            testName: 'Urine Analysis',
            result: 'Normal',
            referenceRange: 'Standard ranges',
            date: '2024-09-30'
          }
        ]
      }
    ];

    setOrders(mockOrders);
    setLoading(false);
  }, []);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const handleAddResult = (orderId: string) => {
    // Mock adding result
    alert('Add result functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading diagnostic orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Mediconnect
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Diagnostics Portal - Anytown Diagnostics Lab</span>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Diagnostic Orders</h1>
          <p className="mt-2 text-gray-600">Manage lab orders and test results</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No diagnostic orders found</h3>
            <p className="text-gray-600 mb-6">There are no diagnostic orders at the moment.</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                      <p className="text-sm text-gray-600">Patient ID: {order.patientId}</p>
                      <p className="text-sm text-gray-600">Ordered: {order.dateOrdered}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tests Ordered:</h4>
                  <div className="space-y-2">
                    {order.tests.map((test, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{test.name} ({test.code})</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          test.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : test.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {test.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.results && order.results.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Results:</h4>
                    <div className="space-y-2">
                      {order.results.map((result, index) => (
                        <div key={index} className="border border-gray-200 rounded p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{result.testName}</h5>
                              <p className="text-sm text-gray-600">Result: {result.result}</p>
                              <p className="text-sm text-gray-600">Reference: {result.referenceRange}</p>
                              <p className="text-sm text-gray-600">Date: {result.date}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'in-progress')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                      Start Processing
                    </button>
                  )}
                  {order.status === 'in-progress' && (
                    <>
                      <button
                        onClick={() => handleAddResult(order.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                      >
                        Add Results
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
                      >
                        Mark Complete
                      </button>
                    </>
                  )}
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
