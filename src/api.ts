const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://backend-aqua-chain.vercel.app';

type Pond = {
  pond_id: string;
  name: string | null;
  fish_type: string | null;
  capacity: number | null;
  status: string | null;
  created_at: string | null;
};

type Telemetry = {
  telemetry_id: string;
  pond_id: string;
  ph: number | null;
  temperature: number | null;
  turbidity: number | null;
  timestamp: string | null;
};

type TelemetryFhi = {
  percent?: number | null;
  fhi?: number | null;
  description?: string | null;
  label?: string | null;
};

type FeederSchedule = {
  schedule_id: string;
  pond_id: string;
  time: string | null;
  dosage: number | null;
  is_active: boolean | null;
};

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Ponds
  getPonds: (): Promise<Pond[]> => request('/api/ponds'),
  getPond: (pondId: string): Promise<Pond> => request(`/api/ponds/${pondId}`),
  createPond: (data: Partial<Pond>) => request('/api/ponds', { method: 'POST', body: JSON.stringify(data) }),
  patchPondStatus: (pondId: string, status: string) => request(`/api/ponds/${pondId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Telemetry
  postTelemetry: (data: any) => request('/api/telemetry', { method: 'POST', body: JSON.stringify(data) }),
  getTelemetryByPond: (pondId: string): Promise<Telemetry[]> => request(`/api/telemetry/${pondId}`),
  getTelemetryFhi: (pondId: string): Promise<TelemetryFhi> => request(`/api/telemetry/fhi/${pondId}`),

  // Feeder
  getFeederSchedules: (pondId: string): Promise<FeederSchedule[]> => request(`/api/feeder/${pondId}/schedules`),
  createFeederSchedule: (data: { scheduleId?: string; pondId: string; time: string; dosage: number | null }) =>
    request('/api/feeder/schedules', {
      method: 'POST',
      body: JSON.stringify({
        schedule_id: data.scheduleId,
        pond_id: data.pondId,
        pondId: data.pondId,
        time: data.time,
        dosage: data.dosage,
      }),
    }),
  activateFeederSchedule: (id: string) => request(`/api/feeder/schedules/${id}/activate`, { method: 'PATCH' }),
  deactivateFeederSchedule: (id: string) => request(`/api/feeder/schedules/${id}/deactivate`, { method: 'PATCH' }),
  deleteFeederSchedule: (id: string) => request(`/api/feeder/schedules/${id}`, { method: 'DELETE' }),
  postFeederLog: (data: any) => request('/api/feeder/logs', { method: 'POST', body: JSON.stringify(data) }),
  getFeederLogs: (pondId: string) => request(`/api/feeder/${pondId}/logs`),

  // Blockchain
  getBlockchainLogs: (pondId: string) => request(`/api/blockchain/logs/${pondId}`),
  verifyBlockchainTx: (txHash: string) => request(`/api/blockchain/verify/${txHash}`),
};

export type { FeederSchedule, Pond, Telemetry, TelemetryFhi };

export default api;
