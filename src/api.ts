const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://backend-aqua-chain.vercel.app';

type Pond = {
  id: string;
  label: string;
  status?: string;
};

type FeederSchedule = {
  id: string;
  pondId: string;
  time: string; // HH:MM
  amount?: number;
  isActive?: boolean;
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
  getTelemetryByPond: (pondId: string) => request(`/api/telemetry/${pondId}`),

  // Feeder
  getFeederSchedules: (pondId: string): Promise<FeederSchedule[]> => request(`/api/feeder/${pondId}/schedules`),
  createFeederSchedule: (data: { pondId: string; time: string; amount?: number }) => request('/api/feeder/schedules', { method: 'POST', body: JSON.stringify(data) }),
  deactivateFeederSchedule: (id: string) => request(`/api/feeder/schedules/${id}/deactivate`, { method: 'PATCH' }),
  postFeederLog: (data: any) => request('/api/feeder/logs', { method: 'POST', body: JSON.stringify(data) }),
  getFeederLogs: (pondId: string) => request(`/api/feeder/${pondId}/logs`),

  // Blockchain
  getBlockchainLogs: (pondId: string) => request(`/api/blockchain/logs/${pondId}`),
  verifyBlockchainTx: (txHash: string) => request(`/api/blockchain/verify/${txHash}`),
};

export type { FeederSchedule, Pond };

export default api;
