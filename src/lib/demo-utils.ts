/**
 * Demo mode utilities
 * These functions help manage demo vs. real user data
 */
import { seedSharedState, SharedPrescription, GpRequest, Referral } from './shared-state';

export const setDemoMode = (isDemo: boolean) => {
  if (isDemo) {
    localStorage.setItem('isDemoUser', 'true');
  } else {
    localStorage.removeItem('isDemoUser');
  }
};

export const isDemoUser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('isDemoUser') === 'true';
};

export const clearAllUserData = () => {
  // Remove all profile data
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('profile_') || key === 'currentUserProfile' || key === 'isDemoUser') {
      localStorage.removeItem(key);
    }
  });
};

// Initialize demo data for testing
export const initializeDemoData = () => {
  setDemoMode(true);
  
  const demoRequests: GpRequest[] = [
    {
      id: 'req-demo-1',
      patientName: 'Demo User',
      patientId: 'demo-user-1',
      reason: 'Recurring chest discomfort during light activity. Needs GP triage.',
      createdAt: new Date().toISOString(),
      status: 'referred'
    }
  ];

  const demoReferrals: Referral[] = [
    {
      id: 'ref-demo-1',
      requestId: 'req-demo-1',
      patientName: 'Demo User',
      specialistName: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      scheduledAt: 'Dec 15, 2024 • 14:30',
      channel: 'online_wa',
      status: 'booked',
      diagnostics: [
        {
          id: 'diag-demo-1',
          testName: 'Echocardiogram',
          labName: 'MedLab Diagnostics',
          status: 'ordered',
          orderedOn: 'Dec 10, 2024'
        },
        {
          id: 'diag-demo-2',
          testName: 'Lipid Profile',
          labName: 'MedLab Diagnostics',
          status: 'completed',
          orderedOn: 'Nov 20, 2024',
          resultUrl: '#'
        }
      ],
      procedures: [
        {
          id: 'proc-demo-1',
          name: 'Coronary Angiography (radial access)',
          setting: 'outpatient',
          status: 'proposed',
          estCost: '$1,200'
        },
        {
          id: 'proc-demo-2',
          name: 'Cardiac Rehabilitation Programme',
          setting: 'outpatient',
          status: 'selected',
          estCost: '$750'
        }
      ],
      notes: 'GP referral for recurring chest discomfort and abnormal ECG trend.'
    }
  ];

  const demoPrescriptions: SharedPrescription[] = [
    {
      id: 'prescription-1',
      patientName: 'Demo User',
      issuedBy: 'Dr. Sarah Johnson',
      qrToken: 'QR123456789',
      status: 'active',
      createdAt: '2024-12-10T10:00:00Z',
      items: [
        {
          name: 'Amoxicillin 500mg',
          dosage: '500mg three times daily',
          quantity: 21,
          instructions: 'Take with food'
        },
        {
          name: 'Ibuprofen 200mg',
          dosage: '200mg as needed',
          quantity: 14,
          instructions: 'For pain relief'
        }
      ]
    }
  ];

  const demoProfile = {
    id: 'demo-user-1',
    name: 'Demo User',
    email: 'demo@mediconnect.com',
    phone: '+254 700 000 000',
    dateOfBirth: '1990-01-01',
    gender: 'prefer-not-to-say',
    dependents: [
      {
        id: 'dep-1',
        name: 'Sarah Smith',
        relationship: 'Daughter',
        dateOfBirth: '2015-05-10',
      },
      {
        id: 'dep-2',
        name: 'Emily Smith',
        relationship: 'Daughter',
        dateOfBirth: '2018-08-15',
      }
    ],
    addresses: [
      {
        id: 'addr-1',
        type: 'home' as const,
        label: 'Home',
        street: '123 Main Street',
        city: 'Nairobi',
        state: 'Nairobi',
        zipCode: '00100',
        country: 'Kenya',
        isDefault: true,
      }
    ],
    paymentMethods: [
      {
        id: 'pay-1',
        type: 'card' as const,
        label: 'Visa ending in 4242',
        lastFour: '4242',
        expiryDate: '12/25',
        isDefault: true,
      }
    ],
    healthDocuments: [
      {
        id: 'doc-1',
        title: 'Blood Test Results - December 2',
        type: 'lab-report' as const,
        category: 'Lab Report',
        date: 'Dec 15, 2024',
        size: '245 KB',
        providerName: 'City Labs',
        description: 'Complete blood count and metabolic panel'
      },
      {
        id: 'doc-2',
        title: 'Prescription - Antibiotics',
        type: 'prescription' as const,
        category: 'Prescription',
        date: 'Dec 10, 2024',
        size: '85 KB',
        providerName: 'Dr. Sarah Johnson',
        description: 'Amoxicillin 500mg - 7 days'
      },
      {
        id: 'doc-3',
        title: 'X-Ray - Chest',
        type: 'medical-image' as const,
        category: 'Medical Image',
        date: 'Dec 5, 2024',
        size: '1.2 MB',
        providerName: 'Imaging Center',
        description: 'Chest X-ray for respiratory evaluation'
      }
    ],
    emergencyContact: {
      name: 'John Smith',
      phone: '+254 700 000 001',
      relationship: 'Spouse',
    },
    medicalInfo: {
      bloodType: 'O+',
      allergies: ['Penicillin', 'Shellfish'],
      medications: ['Lisinopril 10mg daily'],
      conditions: ['Hypertension'],
    },
    preferences: {
      whatsappEnabled: true,
      whatsappNumber: '+254 700 000 000',
      marketingEmails: false,
      appointmentReminders: true,
    },
    consents: {
      dataSharing: true,
      researchParticipation: false,
      thirdPartySharing: false,
    }
  };
  
  localStorage.setItem('profile_demo@mediconnect.com', JSON.stringify(demoProfile));
  localStorage.setItem('currentUserProfile', JSON.stringify(demoProfile));

  seedSharedState({
    gpRequests: demoRequests,
    referrals: demoReferrals,
    prescriptions: demoPrescriptions,
    activePrescriptionId: null
  });
};
