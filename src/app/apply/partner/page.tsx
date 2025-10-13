'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PartnerApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Optional fields
    partnerType: 'pharmacy',
    businessName: '',
    licenseNumber: '',
    ownerName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    servicesOffered: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const pharmacyServices = [
    'Prescription Dispensing',
    'Over-the-Counter Medications',
    'Health Consultations',
    'Home Delivery',
    'Vaccination Services',
  ];

  const diagnosticsServices = [
    'Blood Tests',
    'X-Ray',
    'Ultrasound',
    'CT Scan',
    'MRI',
    'ECG/EKG',
    'Home Sample Collection',
  ];

  const availableServices = formData.partnerType === 'pharmacy' ? pharmacyServices : diagnosticsServices;

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

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('password', formData.password);
      submitData.append('partnerType', formData.partnerType);
      
      // Optional fields
      if (formData.businessName) submitData.append('businessName', formData.businessName);
      if (formData.licenseNumber) submitData.append('licenseNumber', formData.licenseNumber);
      if (formData.ownerName) submitData.append('ownerName', formData.ownerName);
      if (formData.address) submitData.append('address', formData.address);
      if (formData.city) submitData.append('city', formData.city);
      if (formData.state) submitData.append('state', formData.state);
      if (formData.zipCode) submitData.append('zipCode', formData.zipCode);
      if (formData.servicesOffered.length > 0) {
        submitData.append('servicesOffered', JSON.stringify(formData.servicesOffered));
      }
      
      if (licenseFile) {
        submitData.append('licenseDocument', licenseFile);
      }

      const response = await fetch('/api/apply/partner', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Application submission failed');
      }

      setApplicationSubmitted(true);
      
      setTimeout(() => {
        if (formData.partnerType === 'pharmacy') {
          router.push('/pharmacy/login');
        } else {
          router.push('/diagnostics/login');
        }
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
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, license: 'File size must be less than 5MB' });
        return;
      }

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
            Thank you for applying as a {formData.partnerType === 'pharmacy' ? 'pharmacy' : 'diagnostics'} partner. 
            We've sent a confirmation email to <strong>{formData.email}</strong>.
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
            <h1 className="text-3xl font-bold text-ink mb-2">Partner Application</h1>
            <p className="text-ink-light">
              Join our network as a pharmacy or diagnostics partner. Only <span className="text-primary-600 font-semibold">name, email, phone & password</span> are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button">
                {submitError}
              </div>
            )}

            {/* Partner Type Selection */}
            <div className="border-b border-gray-200 pb-6">
              <label className="block text-sm font-medium text-ink mb-3">
                Partner Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, partnerType: 'pharmacy', servicesOffered: [] })}
                  className={`p-4 border-2 rounded-button transition ${
                    formData.partnerType === 'pharmacy'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">💊</div>
                    <div className="font-semibold text-ink">Pharmacy</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, partnerType: 'diagnostics', servicesOffered: [] })}
                  className={`p-4 border-2 rounded-button transition ${
                    formData.partnerType === 'diagnostics'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">🔬</div>
                    <div className="font-semibold text-ink">Diagnostics</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Required Fields */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-ink mb-4">
                Required Information <span className="text-red-500">*</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
                    Contact Person Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    placeholder="John Smith"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    placeholder="contact@pharmacy.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>

                <div>
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

                <div>
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
            </div>

            {/* Optional Fields */}
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-ink mb-2">
                Optional Information
              </h2>
              <p className="text-sm text-ink-light mb-4">
                Fill these out now or complete your profile later
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-ink mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={formData.partnerType === 'pharmacy' ? 'e.g., MediCare Pharmacy' : 'e.g., HealthTest Diagnostics'}
                  />
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-ink mb-2">
                    License/Registration Number
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., PHR123456"
                  />
                </div>

                <div>
                  <label htmlFor="ownerName" className="block text-sm font-medium text-ink mb-2">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Full name of business owner"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-ink mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-ink mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-ink mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-ink mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-3">
                    Services Offered
                  </label>
                  <div className="space-y-2">
                    {availableServices.map((service) => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.servicesOffered.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-ink">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="licenseDocument" className="block text-sm font-medium text-ink mb-2">
                    License Document
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
            </div>

            {/* Terms */}
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-button hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-ink-light">
              Already have an account?{' '}
              <Link href={formData.partnerType === 'pharmacy' ? '/pharmacy/login' : '/diagnostics/login'} className="text-primary-600 hover:text-primary-700 font-medium">
                Login here
              </Link>
            </p>
            <p className="text-sm text-ink-light">
              Applying as a doctor?{' '}
              <Link href="/apply/doctor" className="text-primary-600 hover:text-primary-700 font-medium">
                Doctor application
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
