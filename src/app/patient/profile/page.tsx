'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';

interface Dependent {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'insurance' | 'mobile';
  label: string;
  lastFour: string;
  expiryDate?: string;
  isDefault: boolean;
}

interface HealthDocument {
  id: string;
  title: string;
  type: 'lab-report' | 'prescription' | 'medical-image' | 'visit-summary' | 'referral' | 'other';
  category: string; // e.g., "Lab Report", "Prescription", "Medical Image"
  date: string;
  size: string; // e.g., "245 KB"
  fileUrl?: string;
  providerName?: string;
  description?: string;
}

interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender?: string;
  profilePhoto?: string;
  dependents?: Dependent[];
  addresses?: Address[];
  paymentMethods?: PaymentMethod[];
  healthDocuments?: HealthDocument[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
  };
  preferences?: {
    whatsappEnabled: boolean;
    whatsappNumber?: string;
    marketingEmails: boolean;
    appointmentReminders: boolean;
  };
  consents?: {
    dataSharing: boolean;
    researchParticipation: boolean;
    thirdPartySharing: boolean;
  };
}

type ProfileSection = 'home' | 'edit' | 'dependents' | 'addresses' | 'payments' | 'medical' | 'emergency' | 'permissions' | 'whatsapp' | 'support' | 'ehr';

export default function PatientProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ProfileSection>('home');
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  });
  const [showAddDependentForm, setShowAddDependentForm] = useState(false);
  const [newDependent, setNewDependent] = useState({
    name: '',
    relationship: '',
    dateOfBirth: ''
  });
  const [editingMedical, setEditingMedical] = useState(false);
  const [medicalFormData, setMedicalFormData] = useState({
    bloodType: '',
    allergies: '',
    medications: '',
    conditions: ''
  });
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyFormData, setEmergencyFormData] = useState({
    name: '',
    phone: '',
    relationship: ''
  });
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  useEffect(() => {
    const loadProfile = () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const savedProfile = localStorage.getItem(`profile_${session.user.email}`);
      
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        const newProfile: PatientProfile = {
          id: session.user.id || 'new-user',
          name: session.user.name || '',
          email: session.user.email || '',
          phone: '',
          dateOfBirth: '',
          dependents: [],
          addresses: [],
          paymentMethods: [],
          healthDocuments: [],
          preferences: {
            whatsappEnabled: false,
            marketingEmails: false,
            appointmentReminders: true,
          },
          consents: {
            dataSharing: false,
            researchParticipation: false,
            thirdPartySharing: false,
          }
        };
        setProfile(newProfile);
        localStorage.setItem(`profile_${session.user.email}`, JSON.stringify(newProfile));
      }
      
      setLoading(false);
    };

    if (!isPending) {
      loadProfile();
    }
  }, [session, isPending]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setEditFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender || ''
    });

    setMedicalFormData({
      bloodType: profile.medicalInfo?.bloodType || '',
      allergies: (profile.medicalInfo?.allergies || []).join(', '),
      medications: (profile.medicalInfo?.medications || []).join(', '),
      conditions: (profile.medicalInfo?.conditions || []).join(', ')
    });

    setEmergencyFormData({
      name: profile.emergencyContact?.name || '',
      phone: profile.emergencyContact?.phone || '',
      relationship: profile.emergencyContact?.relationship || ''
    });
  }, [profile]);

  const saveProfile = (updatedProfile: PatientProfile) => {
    setProfile(updatedProfile);
    if (session?.user?.email) {
      localStorage.setItem(`profile_${session.user.email}`, JSON.stringify(updatedProfile));
      // Also save to a general key for access across pages
      localStorage.setItem('currentUserProfile', JSON.stringify(updatedProfile));
    }
  };

  const addDependent = (dependent: Dependent) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      dependents: [...(profile.dependents || []), dependent]
    };
    saveProfile(updatedProfile);
  };

  const removeDependent = (id: string) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      dependents: profile.dependents?.filter(d => d.id !== id) || []
    };
    saveProfile(updatedProfile);
  };

  const addAddress = (address: Address) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      addresses: [...(profile.addresses || []), address]
    };
    saveProfile(updatedProfile);
  };

  const removeAddress = (id: string) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      addresses: profile.addresses?.filter(a => a.id !== id) || []
    };
    saveProfile(updatedProfile);
  };

  const addPaymentMethod = (payment: PaymentMethod) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      paymentMethods: [...(profile.paymentMethods || []), payment]
    };
    saveProfile(updatedProfile);
  };

  const removePaymentMethod = (id: string) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      paymentMethods: profile.paymentMethods?.filter(p => p.id !== id) || []
    };
    saveProfile(updatedProfile);
  };

  if (loading || isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    router.push('/patient/login');
    return null;
  }

  const userInitials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  // Render Profile Home - Main Menu
  const renderProfileHome = () => (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-semibold">
            {userInitials}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-600">{profile.email}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setActiveSection('edit')}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Edit Profile
        </button>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-lg shadow divide-y">
        <MenuButton
          icon={<FileTextIcon />}
          label="Electronic Health Records"
          badge={profile.healthDocuments?.length || 0}
          onClick={() => setActiveSection('ehr')}
        />
        <MenuButton
          icon={<UsersIcon />}
          label="Dependents"
          badge={profile.dependents?.length || 0}
          onClick={() => setActiveSection('dependents')}
        />
        <MenuButton
          icon={<LocationIcon />}
          label="Addresses"
          badge={profile.addresses?.length || 0}
          onClick={() => setActiveSection('addresses')}
        />
        <MenuButton
          icon={<CreditCardIcon />}
          label="Payment & Accounts"
          onClick={() => setActiveSection('payments')}
        />
        <MenuButton
          icon={<DocumentIcon />}
          label="Medical Information"
          onClick={() => setActiveSection('medical')}
        />
        <MenuButton
          icon={<AlertIcon />}
          label="Emergency Contact"
          onClick={() => setActiveSection('emergency')}
        />
        <MenuButton
          icon={<ShieldIcon />}
          label="Manage Permissions"
          onClick={() => setActiveSection('permissions')}
        />
        <MenuButton
          icon={<ChatIcon />}
          label="WhatsApp Preferences"
          onClick={() => setActiveSection('whatsapp')}
        />
        <MenuButton
          icon={<SupportIcon />}
          label="WhatsApp Support"
          onClick={() => setActiveSection('support')}
        />
      </div>

      {/* Sign Out Button */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={handleLogout}
          className="w-full px-6 py-4 flex items-center justify-center gap-3 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
        >
          <LogoutIcon />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  // Render Edit Profile Section
  const renderEditProfile = () => {
    if (!profile) {
      return null;
    }

    const handleSave = () => {
      const updatedProfile = { ...profile, ...editFormData };
      saveProfile(updatedProfile);
      setEditMode(false);
      setActiveSection('home');
    };

    return (
      <div className="space-y-6 rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={editFormData.dateOfBirth}
              onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Gender</label>
            <select
              value={editFormData.gender}
              onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            Save Changes
          </button>
          <button
            onClick={() => setActiveSection('home')}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Render Dependents Section
  const renderDependents = () => {
    if (!profile) {
      return null;
    }

    const handleAddDependent = () => {
      if (!newDependent.name || !newDependent.relationship) return;
      
      const dependent: Dependent = {
        id: `dep-${Date.now()}`,
        name: newDependent.name,
        relationship: newDependent.relationship,
        dateOfBirth: newDependent.dateOfBirth,
      };
      
      addDependent(dependent);
      setNewDependent({ name: '', relationship: '', dateOfBirth: '' });
      setShowAddDependentForm(false);
    };

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Dependents</h2>
            <button
              onClick={() => setShowAddDependentForm(!showAddDependentForm)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              {showAddDependentForm ? 'Cancel' : '+ Add Dependent'}
            </button>
          </div>

          {showAddDependentForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newDependent.name}
                onChange={(e) => setNewDependent({ ...newDependent, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Relationship (e.g., Child, Parent)"
                value={newDependent.relationship}
                onChange={(e) => setNewDependent({ ...newDependent, relationship: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                value={newDependent.dateOfBirth}
                onChange={(e) => setNewDependent({ ...newDependent, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleAddDependent}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Save Dependent
              </button>
            </div>
          )}

          {(!profile.dependents || profile.dependents.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No dependents added yet</p>
              <p className="text-sm text-gray-400 mt-2">Add dependents to manage their healthcare</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.dependents.map((dependent) => (
                <div key={dependent.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{dependent.name}</p>
                    <p className="text-sm text-gray-600">{dependent.relationship}</p>
                    {dependent.dateOfBirth && (
                      <p className="text-xs text-gray-500">DOB: {dependent.dateOfBirth}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeDependent(dependent.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Addresses Section - Similar pattern as dependents
  const renderAddresses = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Addresses</h2>
      {(!profile.addresses || profile.addresses.length === 0) ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No addresses saved</p>
          <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            + Add Address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {profile.addresses.map((address) => (
            <div key={address.id} className="p-4 border border-gray-200 rounded-lg">
              <p className="font-medium">{address.label}</p>
              <p className="text-sm text-gray-600">{address.street}</p>
              <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render Payment & Accounts Section
  const renderPayments = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment & Accounts</h2>
      {(!profile.paymentMethods || profile.paymentMethods.length === 0) ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No payment methods saved</p>
          <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            + Add Payment Method
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {profile.paymentMethods.map((payment) => (
            <div key={payment.id} className="p-4 border border-gray-200 rounded-lg">
              <p className="font-medium">{payment.label}</p>
              <p className="text-sm text-gray-600">**** {payment.lastFour}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render Medical Information Section
  const renderMedicalInfo = () => {
    if (!profile) {
      return null;
    }

    const handleSaveMedical = () => {
      const updatedProfile = {
        ...profile,
        medicalInfo: {
          bloodType: medicalFormData.bloodType,
          allergies: medicalFormData.allergies.split(',').map((item) => item.trim()).filter(Boolean),
          medications: medicalFormData.medications.split(',').map((item) => item.trim()).filter(Boolean),
          conditions: medicalFormData.conditions.split(',').map((item) => item.trim()).filter(Boolean)
        }
      };
      saveProfile(updatedProfile);
      setEditingMedical(false);
    };

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Medical Information</h2>
          <button
            onClick={() => setEditingMedical(!editingMedical)}
            className="text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            {editingMedical ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingMedical ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Blood Type</label>
              <select
                value={medicalFormData.bloodType}
                onChange={(e) => setMedicalFormData({ ...medicalFormData, bloodType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select blood type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Allergies (comma-separated)</label>
              <textarea
                value={medicalFormData.allergies}
                onChange={(e) => setMedicalFormData({ ...medicalFormData, allergies: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Current Medications (comma-separated)
              </label>
              <textarea
                value={medicalFormData.medications}
                onChange={(e) => setMedicalFormData({ ...medicalFormData, medications: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Medical Conditions (comma-separated)
              </label>
              <textarea
                value={medicalFormData.conditions}
                onChange={(e) => setMedicalFormData({ ...medicalFormData, conditions: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>
            <button
              onClick={handleSaveMedical}
              className="w-full rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              Save Medical Information
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Blood Type</label>
              <p className="text-gray-900">{profile.medicalInfo?.bloodType || 'Not specified'}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Allergies</label>
              {profile.medicalInfo?.allergies && profile.medicalInfo.allergies.length > 0 ? (
                <ul className="list-inside list-disc text-gray-900">
                  {profile.medicalInfo.allergies.map((allergy, index) => (
                    <li key={index}>{allergy}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">None reported</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Current Medications</label>
              {profile.medicalInfo?.medications && profile.medicalInfo.medications.length > 0 ? (
                <ul className="list-inside list-disc text-gray-900">
                  {profile.medicalInfo.medications.map((medication, index) => (
                    <li key={index}>{medication}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">None reported</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Medical Conditions</label>
              {profile.medicalInfo?.conditions && profile.medicalInfo.conditions.length > 0 ? (
                <ul className="list-inside list-disc text-gray-900">
                  {profile.medicalInfo.conditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">None reported</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Emergency Contact Section
  const renderEmergencyContact = () => {
    if (!profile) {
      return null;
    }

    const handleSaveEmergency = () => {
      const updatedProfile = {
        ...profile,
        emergencyContact: emergencyFormData
      };
      saveProfile(updatedProfile);
      setEditingEmergency(false);
    };

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Emergency Contact</h2>
          <button
            onClick={() => setEditingEmergency(!editingEmergency)}
            className="text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            {editingEmergency ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingEmergency ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Contact Name"
              value={emergencyFormData.name}
              onChange={(e) => setEmergencyFormData({ ...emergencyFormData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={emergencyFormData.phone}
              onChange={(e) => setEmergencyFormData({ ...emergencyFormData, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              placeholder="Relationship"
              value={emergencyFormData.relationship}
              onChange={(e) => setEmergencyFormData({ ...emergencyFormData, relationship: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSaveEmergency}
              className="w-full rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              Save Emergency Contact
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {profile.emergencyContact?.name ? (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{profile.emergencyContact.name}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{profile.emergencyContact.phone}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Relationship</label>
                  <p className="text-gray-900">{profile.emergencyContact.relationship}</p>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">No emergency contact added</p>
                <button
                  onClick={() => setEditingEmergency(true)}
                  className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                >
                  Add Emergency Contact
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Permissions Section
  const renderPermissions = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Permissions</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Data Sharing</p>
            <p className="text-sm text-gray-600">Share your data with healthcare providers</p>
          </div>
          <input
            type="checkbox"
            checked={profile.consents?.dataSharing || false}
            onChange={(e) => {
              const updatedProfile = {
                ...profile,
                consents: { ...profile.consents, dataSharing: e.target.checked } as any
              };
              saveProfile(updatedProfile);
            }}
            className="w-5 h-5 text-primary-600"
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Research Participation</p>
            <p className="text-sm text-gray-600">Participate in medical research studies</p>
          </div>
          <input
            type="checkbox"
            checked={profile.consents?.researchParticipation || false}
            onChange={(e) => {
              const updatedProfile = {
                ...profile,
                consents: { ...profile.consents, researchParticipation: e.target.checked } as any
              };
              saveProfile(updatedProfile);
            }}
            className="w-5 h-5 text-primary-600"
          />
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Third Party Sharing</p>
            <p className="text-sm text-gray-600">Allow third parties to access your data</p>
          </div>
          <input
            type="checkbox"
            checked={profile.consents?.thirdPartySharing || false}
            onChange={(e) => {
              const updatedProfile = {
                ...profile,
                consents: { ...profile.consents, thirdPartySharing: e.target.checked } as any
              };
              saveProfile(updatedProfile);
            }}
            className="w-5 h-5 text-primary-600"
          />
        </div>
      </div>
    </div>
  );

  // Render WhatsApp Preferences
  const renderWhatsAppPreferences = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">WhatsApp Preferences</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Enable WhatsApp Notifications</p>
            <p className="text-sm text-gray-600">Receive appointment reminders via WhatsApp</p>
          </div>
          <input
            type="checkbox"
            checked={profile.preferences?.whatsappEnabled || false}
            onChange={(e) => {
              const updatedProfile = {
                ...profile,
                preferences: { ...profile.preferences, whatsappEnabled: e.target.checked } as any
              };
              saveProfile(updatedProfile);
            }}
            className="w-5 h-5 text-primary-600"
          />
        </div>
        {profile.preferences?.whatsappEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
            <input
              type="tel"
              value={profile.preferences?.whatsappNumber || profile.phone || ''}
              onChange={(e) => {
                const updatedProfile = {
                  ...profile,
                  preferences: { ...profile.preferences, whatsappNumber: e.target.value } as any
                };
                saveProfile(updatedProfile);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}
      </div>
    </div>
  );

  // Render WhatsApp Support - As shown in the UI
  const renderWhatsAppSupport = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Support</h3>
        <p className="text-sm text-gray-600 mb-4">
          You&apos;ll be redirected to WhatsApp. Our team replies within ~10 minutes (9am-8pm).
        </p>
        <button
          onClick={() => window.open('https://wa.me/yourphonenumber', '_blank')}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Open WhatsApp chat
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Can&apos;t use WhatsApp?</h3>
        <p className="text-sm text-gray-600 mb-4">If WhatsApp is unavailable on your device, you can report an issue instead.</p>
        <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Report an issue
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Support Hours</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Monday - Friday:</span>
            <span className="font-medium text-gray-900">9:00 AM - 8:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Saturday:</span>
            <span className="font-medium text-gray-900">10:00 AM - 6:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sunday:</span>
            <span className="font-medium text-gray-900">Closed</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Emergency support available 24/7 for urgent medical issues.
        </p>
      </div>
    </div>
  );

  // Render Electronic Health Records Section
  const renderEHR = () => {
    const getDocumentIcon = (type: string) => {
      switch (type) {
        case 'lab-report':
          return (
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          );
        case 'prescription':
          return (
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          );
        case 'medical-image':
          return (
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          );
        default:
          return (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          );
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Electronic Health Records</h2>
              <p className="text-sm text-gray-600 mt-1">Your uploaded and provider-shared documents</p>
            </div>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
              + Upload Document
            </button>
          </div>

          {(!profile.healthDocuments || profile.healthDocuments.length === 0) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No health records yet</h3>
              <p className="text-gray-600 mb-6">Upload your medical documents or they will appear here when shared by providers</p>
              <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Your First Document
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.healthDocuments.map((doc) => (
                <button
                  key={doc.id}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  {getDocumentIcon(doc.type)}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span>{doc.category}</span>
                      <span>•</span>
                      <span>{doc.date}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                    </div>
                  </div>

                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Document Categories Filter (Optional Enhancement) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {['All', 'Lab Reports', 'Prescriptions', 'Medical Images', 'Visit Summaries', 'Referrals'].map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  category === 'All'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Storage Used</span>
            <span className="text-sm font-medium text-gray-900">
              {profile.healthDocuments?.reduce((acc, doc) => {
                const size = parseFloat(doc.size.replace(/[^\d.]/g, ''));
                return acc + size;
              }, 0).toFixed(2) || 0} MB of 500 MB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{
                width: `${Math.min(
                  ((profile.healthDocuments?.reduce((acc, doc) => {
                    const size = parseFloat(doc.size.replace(/[^\d.]/g, ''));
                    return acc + size;
                  }, 0) || 0) / 500) * 100,
                  100
                )}%`
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Upgrade to premium for unlimited storage
          </p>
        </div>
      </div>
    );
  };

  // Main render - section switcher
  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'home':
        return renderProfileHome();
      case 'edit':
        return renderEditProfile();
      case 'ehr':
        return renderEHR();
      case 'dependents':
        return renderDependents();
      case 'addresses':
        return renderAddresses();
      case 'payments':
        return renderPayments();
      case 'medical':
        return renderMedicalInfo();
      case 'emergency':
        return renderEmergencyContact();
      case 'permissions':
        return renderPermissions();
      case 'whatsapp':
        return renderWhatsAppPreferences();
      case 'support':
        return renderWhatsAppSupport();
      default:
        return renderProfileHome();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {activeSection !== 'home' ? (
              <button
                onClick={() => setActiveSection('home')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}
            <h1 className="text-xl font-bold text-gray-900">Mediconnect</h1>
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold">
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderCurrentSection()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white shadow mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => router.push('/patient/specialists')}
              className="flex flex-col items-center text-sm text-gray-700 hover:text-primary-600"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Specialists
            </button>
            <button 
              onClick={() => router.push('/patient/prescriptions')}
              className="flex flex-col items-center text-sm text-gray-700 hover:text-primary-600"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Pharmacy
            </button>
            <button 
              onClick={() => router.push('/patient/home')}
              className="flex flex-col items-center text-sm text-gray-700 hover:text-primary-600"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Care
            </button>
            <button 
              onClick={() => router.push('/patient/diagnostics')}
              className="flex flex-col items-center text-sm text-gray-700 hover:text-primary-600"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Diagnostics
            </button>
            <button className="flex flex-col items-center text-sm text-primary-600">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

// Helper Components
const MenuButton = ({ icon, label, badge, onClick }: { icon: React.ReactNode; label: string; badge?: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge !== undefined && <span className="text-sm text-gray-500">{badge}</span>}
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
);

// Icon Components
const UsersIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const SupportIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
