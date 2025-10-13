'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DoctorApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Optional fields
    specialization: '',
    licenseNumber: '',
    qualifications: '',
    experienceYears: '',
    hospitalAffiliation: '',
    consultationFee: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields only
    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim() || formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number (min 10 digits)';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data for submission
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('password', formData.password);
      
      // Optional fields - only add if filled
      if (formData.specialization) submitData.append('specialization', formData.specialization);
      if (formData.licenseNumber) submitData.append('licenseNumber', formData.licenseNumber);
      if (formData.qualifications) submitData.append('qualifications', formData.qualifications);
      if (formData.experienceYears) submitData.append('experienceYears', formData.experienceYears);
      if (formData.hospitalAffiliation) submitData.append('hospitalAffiliation', formData.hospitalAffiliation);
      if (formData.consultationFee) submitData.append('consultationFee', formData.consultationFee);
      
      if (licenseFile) {
        submitData.append('licenseDocument', licenseFile);
      }

      const response = await fetch('/api/apply/doctor', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Application submission failed');
      }

      // Success!
      setApplicationSubmitted(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/auth/gp/login');
      }, 3000);

    } catch (error: any) {
      console.error('Application error:', error);
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, license: 'File size must be less than 5MB' });
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, license: 'Please upload a PDF or image file (JPG, PNG)' });
        return;
      }

      setLicenseFile(file);
      setErrors({ ...errors, license: '' });
    }
  };

  if (applicationSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-card shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Application Submitted!</h1>
          <p className="text-ink-light mb-6">
            Thank you for applying as a healthcare provider. We've sent a confirmation email to <strong>{formData.email}</strong>.
          </p>
          <p className="text-sm text-ink-light mb-4">
            Our team will review your application within 24-48 hours. You'll receive an email once your application is approved.
          </p>
          <p className="text-sm text-ink-light">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-card shadow-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-ink mb-2">Doctor Application</h1>
            <p className="text-ink-light">
              Join our network of healthcare providers. Only <span className="text-primary-600 font-semibold">name, email, phone & password</span> are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button">
                {submitError}
              </div>
            )}

            {/* Required Fields Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-ink mb-4">
                Required Information <span className="text-red-500">*</span>
              </h2>

              {/* Name */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  placeholder="Dr. John Smith"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  placeholder="doctor@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-ink mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  placeholder="Minimum 8 characters"
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-ink mb-2">
                Optional Information
              </h2>
              <p className="text-sm text-ink-light mb-4">
                Fill these out now or complete your profile later
              </p>

              {/* Specialization */}
              <div className="mb-4">
                <label htmlFor="specialization" className="block text-sm font-medium text-ink mb-2">
                  Specialization
                </label>
                <select
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select specialization (optional)</option>
                  <option value="gp">General Practitioner</option>
                  <option value="cardiologist">Cardiologist</option>
                  <option value="dermatologist">Dermatologist</option>
                  <option value="pediatrician">Pediatrician</option>
                  <option value="psychiatrist">Psychiatrist</option>
                  <option value="orthopedic">Orthopedic Surgeon</option>
                  <option value="gynecologist">Gynecologist</option>
                  <option value="neurologist">Neurologist</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* License Number */}
              <div className="mb-4">
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-ink mb-2">
                  Medical License Number
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., MED123456"
                />
              </div>

              {/* Qualifications */}
              <div className="mb-4">
                <label htmlFor="qualifications" className="block text-sm font-medium text-ink mb-2">
                  Qualifications
                </label>
                <textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., MBBS, MD, Fellowship details..."
                />
              </div>

              {/* Experience Years */}
              <div className="mb-4">
                <label htmlFor="experienceYears" className="block text-sm font-medium text-ink mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  id="experienceYears"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  min="0"
                  max="60"
                  className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 10"
                />
              </div>

              {/* Hospital Affiliation */}
              <div className="mb-4">
                <label htmlFor="hospitalAffiliation" className="block text-sm font-medium text-ink mb-2">
                  Hospital/Clinic Affiliation
                </label>
                <input
                  type="text"
                  id="hospitalAffiliation"
                  value={formData.hospitalAffiliation}
                  onChange={(e) => setFormData({ ...formData, hospitalAffiliation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., City General Hospital"
                />
              </div>

              {/* Consultation Fee */}
              <div className="mb-4">
                <label htmlFor="consultationFee" className="block text-sm font-medium text-ink mb-2">
                  Consultation Fee (USD)
                </label>
                <input
                  type="number"
                  id="consultationFee"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 50.00"
                />
              </div>

              {/* License Document Upload */}
              <div>
                <label htmlFor="licenseDocument" className="block text-sm font-medium text-ink mb-2">
                  Medical License Document
                </label>
                <input
                  type="file"
                  id="licenseDocument"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className={`w-full px-4 py-2 border ${errors.license ? 'border-red-500' : 'border-gray-300'} rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                />
                {licenseFile && (
                  <p className="mt-1 text-sm text-green-600">✓ {licenseFile.name}</p>
                )}
                {errors.license && <p className="mt-1 text-sm text-red-500">{errors.license}</p>}
                <p className="mt-1 text-xs text-ink-light">
                  PDF or image (JPG, PNG) - Max 5MB
                </p>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-ink">
                  I accept the{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-700 underline">
                    Terms and Conditions
                  </Link>{' '}
                  and confirm that all information provided is accurate.
                </label>
              </div>
              {errors.terms && <p className="mt-1 text-sm text-red-500">{errors.terms}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-button hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-light">
              Already have an account?{' '}
              <Link href="/auth/gp/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Login here
              </Link>
            </p>
            <p className="text-sm text-ink-light mt-2">
              Applying as a patient?{' '}
              <Link href="/auth/patient/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
