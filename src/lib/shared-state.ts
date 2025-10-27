'use client';

/**
 * Shared state across Mediconnect partner and patient portals.
 * Data is persisted to localStorage and propagated between windows using BroadcastChannel
 * (falls back to the storage event when BroadcastChannel is unavailable).
 *
 * Unless seeded (`seedSharedState`) everything stays empty so new users see a blank slate.
 */

export type GpRequestStatus = 'pending' | 'in_progress' | 'referred' | 'completed' | 'cancelled';
export type ReferralStatus = 'proposed' | 'booked' | 'completed' | 'cancelled';
export type PrescriptionStatus = 'active' | 'filled' | 'cancelled';

export interface GpRequest {
  id: string;
  patientName: string;
  patientId?: string;
  reason: string;
  createdAt: string;
  status: GpRequestStatus;
}

export interface DiagnosticOrder {
  id: string;
  testName: string;
  labName: string;
  status: 'ordered' | 'awaiting' | 'completed';
  orderedOn: string;
  resultUrl?: string;
}

export interface ProcedureOption {
  id: string;
  name: string;
  setting: 'inpatient' | 'outpatient';
  status: 'proposed' | 'selected';
  estCost: string;
}

export interface Referral {
  id: string;
  requestId?: string;
  patientName: string;
  specialistName: string;
  specialty: string;
  scheduledAt?: string;
  channel: 'online_wa' | 'online_app' | 'in_person';
  status: ReferralStatus;
  diagnostics: DiagnosticOrder[];
  procedures: ProcedureOption[];
  notes?: string;
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

export interface SharedPrescription {
  id: string;
  patientName: string;
  issuedBy: string;
  qrToken: string;
  status: PrescriptionStatus;
  createdAt: string;
  items: PrescriptionItem[];
}

export interface SharedState {
  seeded: boolean;
  gpRequests: GpRequest[];
  referrals: Referral[];
  prescriptions: SharedPrescription[];
  activePrescriptionId?: string | null;
}

const STORAGE_KEY = 'mediconnect:shared-state';
const CHANNEL_NAME = 'mediconnect:shared-channel';

const defaultState: SharedState = {
  seeded: false,
  gpRequests: [],
  referrals: [],
  prescriptions: [],
  activePrescriptionId: null
};

const isBrowser = typeof window !== 'undefined';

let channel: BroadcastChannel | null = null;
const getChannel = () => {
  if (!isBrowser || !('BroadcastChannel' in window)) {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
};

export const getSharedState = (): SharedState => {
  if (!isBrowser) {
    return defaultState;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultState;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SharedState>;
    return {
      ...defaultState,
      ...parsed,
      gpRequests: parsed.gpRequests || [],
      referrals: parsed.referrals || [],
      prescriptions: parsed.prescriptions || [],
      activePrescriptionId: parsed.activePrescriptionId ?? null
    };
  } catch (error) {
    console.error('Failed to parse shared state', error);
    return defaultState;
  }
};

const writeSharedState = (state: SharedState) => {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const bc = getChannel();
  if (bc) {
    bc.postMessage(state);
  } else {
    // Fallback for browsers without BroadcastChannel support.
    localStorage.setItem(`${STORAGE_KEY}:signal`, Date.now().toString());
  }
};

export const updateSharedState = (updater: (current: SharedState) => SharedState) => {
  const current = getSharedState();
  const updated = updater(current);
  writeSharedState(updated);
  return updated;
};

type SharedStateListener = (state: SharedState) => void;

export const subscribeToSharedState = (listener: SharedStateListener): (() => void) => {
  if (!isBrowser) {
    return () => {};
  }

  const bc = getChannel();
  const handleMessage = (event: MessageEvent<SharedState>) => {
    listener(event.data);
  };
  bc?.addEventListener('message', handleMessage);

  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        listener(JSON.parse(event.newValue));
      } catch {
        listener(getSharedState());
      }
    }
    if (event.key === `${STORAGE_KEY}:signal`) {
      listener(getSharedState());
    }
  };

  window.addEventListener('storage', storageHandler);

  // Emit initial state so subscribers can sync immediately.
  listener(getSharedState());

  return () => {
    bc?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', storageHandler);
  };
};

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const addGpRequest = (input: { patientName: string; reason: string; patientId?: string }) => {
  const createdAt = new Date().toISOString();
  updateSharedState((state) => ({
    ...state,
    gpRequests: [
      ...state.gpRequests,
      {
        id: randomId('req'),
        patientName: input.patientName,
        patientId: input.patientId,
        reason: input.reason,
        status: 'pending',
        createdAt
      }
    ]
  }));
};

export const updateGpRequestStatus = (requestId: string, status: GpRequestStatus) => {
  updateSharedState((state) => ({
    ...state,
    gpRequests: state.gpRequests.map((request) =>
      request.id === requestId ? { ...request, status } : request
    )
  }));
};

export const createReferralFromRequest = (input: {
  requestId: string;
  specialistName: string;
  specialty: string;
  channel: Referral['channel'];
  scheduledAt?: string;
}) => {
  updateSharedState((state) => {
    const request = state.gpRequests.find((r) => r.id === input.requestId);
    if (!request) {
      return state;
    }

    const referral: Referral = {
      id: randomId('ref'),
      requestId: request.id,
      patientName: request.patientName,
      specialistName: input.specialistName,
      specialty: input.specialty,
      channel: input.channel,
      scheduledAt: input.scheduledAt,
      status: 'booked',
      diagnostics: [],
      procedures: [],
      notes: request.reason
    };

    return {
      ...state,
      gpRequests: state.gpRequests.map((r) =>
        r.id === request.id ? { ...r, status: 'referred' } : r
      ),
      referrals: [...state.referrals, referral]
    };
  });
};

export const selectActivePrescription = (prescriptionId: string | null) => {
  updateSharedState((state) => ({
    ...state,
    activePrescriptionId: prescriptionId
  }));
};

export const upsertPrescription = (prescription: SharedPrescription) => {
  updateSharedState((state) => {
    const existingIndex = state.prescriptions.findIndex((p) => p.id === prescription.id);
    const prescriptions =
      existingIndex >= 0
        ? state.prescriptions.map((p, idx) => (idx === existingIndex ? prescription : p))
        : [...state.prescriptions, prescription];

    return {
      ...state,
      prescriptions
    };
  });
};

export const clearSharedState = () => {
  if (!isBrowser) return;
  writeSharedState(defaultState);
};

export const seedSharedState = (seedData: Partial<SharedState>) => {
  const state: SharedState = {
    ...defaultState,
    ...seedData,
    seeded: true,
    gpRequests: seedData.gpRequests ?? [],
    referrals: seedData.referrals ?? [],
    prescriptions: seedData.prescriptions ?? [],
    activePrescriptionId: seedData.activePrescriptionId ?? null
  };
  writeSharedState(state);
};

export const emptySharedState: SharedState = { ...defaultState };
