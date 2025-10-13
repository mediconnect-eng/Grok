'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface ApplicationDetail {
  id: string;
  type: 'provider' | 'partner';
  user_id: string;
  name: string;
  email: string;
  phone_number: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  
  // Provider fields
  provider_type?: string;
  specialization?: string;
  qualifications?: string;
  experience_years?: number;
  hospital_affiliation?: string;
  consultation_fee?: number;
  
  // Partner fields
  partner_type?: string;
  business_name?: string;
  owner_name?: string;
  address?: string;
  services_offered?: string[];
  
  // Common
  license_number?: string;
  license_document_url?: string;
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.id as string;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/applications/${applicationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch application');
      }

      const data = await response.json();
      setApplication(data.application);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this application? This will activate their account.')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application?.id,
          applicationType: application?.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      alert('Application approved successfully! Email sent to applicant.');
      router.push('/admin');
    } catch (err: any) {
      console.error('Approve error:', err);
      alert(err.message || 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application?.id,
          applicationType: application?.type,
          reason: rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      alert('Application rejected. Email sent to applicant.');
      router.push('/admin');
    } catch (err: any) {
      console.error('Reject error:', err);
      alert(err.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-ink-light">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-ink mb-2">Error</h2>
          <p className="text-ink-light mb-4">{error || 'Application not found'}</p>
          <Link href="/admin" className="text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-ink">Application Details</h1>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(application.status)}`}>
              {application.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Application Info */}
        <div className="bg-white rounded-card shadow-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-ink-light mb-1">Applicant Name</h3>
              <p className="text-lg font-semibold text-ink">{application.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-ink-light mb-1">Email</h3>
              <p className="text-lg text-ink">{application.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-ink-light mb-1">Phone Number</h3>
              <p className="text-lg text-ink">{application.phone_number}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-ink-light mb-1">Application Type</h3>
              <p className="text-lg text-ink capitalize">{application.type}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-ink-light mb-1">Applied On</h3>
              <p className="text-lg text-ink">{new Date(application.created_at).toLocaleString()}</p>
            </div>
            {application.license_number && (
              <div>
                <h3 className="text-sm font-medium text-ink-light mb-1">License Number</h3>
                <p className="text-lg text-ink">{application.license_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Provider Specific Details */}
        {application.type === 'provider' && (
          <div className="bg-white rounded-card shadow-card p-6 mb-6">
            <h2 className="text-xl font-bold text-ink mb-4">Provider Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-ink-light mb-1">Provider Type</h3>
                <p className="text-ink">{application.provider_type === 'gp' ? 'General Practitioner' : 'Specialist'}</p>
              </div>
              {application.specialization && (
                <div>
                  <h3 className="text-sm font-medium text-ink-light mb-1">Specialization</h3>
                  <p className="text-ink capitalize">{application.specialization}</p>
                </div>
              )}
              {application.experience_years && (
                <div>
                  <h3 className="text-sm font-medium text-ink-light mb-1">Years of Experience</h3>
                  <p className="text-ink">{application.experience_years} years</p>
                </div>
              )}
              {application.consultation_fee && (
                <div>
                  <h3 className="text-sm font-medium text-ink-light mb-1">Consultation Fee</h3>
                  <p className="text-ink">${application.consultation_fee}</p>
                </div>
              )}
              {application.hospital_affiliation && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-ink-light mb-1">Hospital Affiliation</h3>
                  <p className="text-ink">{application.hospital_affiliation}</p>
                </div>
              )}
              {application.qualifications && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-ink-light mb-1">Qualifications</h3>
                  <p className="text-ink whitespace-pre-line">{application.qualifications}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Partner Specific Details */}
        {application.type === 'partner' && (
          <div className="bg-white rounded-card shadow-card p-6 mb-6">
            <h2 className="text-xl font-bold text-ink mb-4">Partner Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-ink-light mb-1">Partner Type</h3>
                <p className="text-ink capitalize">{application.partner_type}</p>
              </div>
              {application.business_name && (
                <div>
                  <h3 className="text-sm font-medium text-ink-light mb-1">Business Name</h3>
                  <p className="text-ink">{application.business_name}</p>
                </div>
              )}
              {application.owner_name && (
                <div>
                  <h3 className="text-sm font-medium text-ink-light mb-1">Owner Name</h3>
                  <p className="text-ink">{application.owner_name}</p>
                </div>
              )}
              {application.address && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-ink-light mb-1">Address</h3>
                  <p className="text-ink">{application.address}</p>
                </div>
              )}
              {application.services_offered && application.services_offered.length > 0 && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-ink-light mb-1">Services Offered</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {application.services_offered.map((service, index) => (
                      <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* License Document */}
        {application.license_document_url && (
          <div className="bg-white rounded-card shadow-card p-6 mb-6">
            <h2 className="text-xl font-bold text-ink mb-4">License Document</h2>
            <a
              href={application.license_document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-button hover:bg-primary-200 transition"
            >
              📄 View License Document
            </a>
          </div>
        )}

        {/* Rejection Reason (if rejected) */}
        {application.status === 'rejected' && application.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-card p-6 mb-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Rejection Reason</h2>
            <p className="text-red-700">{application.rejection_reason}</p>
          </div>
        )}

        {/* Actions */}
        {application.status === 'pending' && (
          <div className="bg-white rounded-card shadow-card p-6">
            <h2 className="text-xl font-bold text-ink mb-4">Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-button hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                ✓ Approve Application
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-button hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                ✗ Reject Application
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-card shadow-card max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-ink mb-4">Reject Application</h2>
            <p className="text-ink-light mb-4">
              Please provide a reason for rejecting this application. This will be sent to the applicant.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              placeholder="e.g., License verification failed, Incomplete documentation, etc."
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-button hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-button hover:bg-gray-400 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
