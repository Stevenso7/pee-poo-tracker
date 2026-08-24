import { supabase } from './supabase';
import type { AnalysisReport } from '@pee-poo/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

// ---- Typed models ----

export interface RecordItem {
  id: string;
  type: 'PEE' | 'POO';
  recordedAt: string;
  peeColor?: string | null;
  peeFoam?: string | null;
  peeVolume?: string | null;
  pooColor?: string | null;
  pooConsistency?: number | null;
  notes?: string | null;
  photoStoragePath?: string | null;
  analysis?: AnalysisItem | null;
}

export interface AnalysisItem {
  id: string;
  recordId: string;
  model: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  reportJson?: AnalysisReport | null;
  reportText?: string | null;
  disclaimer?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface AnalysisQuota {
  limit: number;
  usedThisMonth: number;
  remaining: number;
}

export interface StatsSummary {
  from: string;
  to: string;
  daily: Array<{ date: string; peeCount: number; pooCount: number }>;
  totals: { peeCount: number; pooCount: number };
}

export interface SettingsView {
  language: string;
  reminderEnabled: boolean;
  reminderTimes: string[];
  photoRetentionDays: number;
  plan: string;
  analysisQuota: AnalysisQuota;
}

export const api = {
  createRecord: (body: Record<string, unknown>) =>
    apiFetch<{
      record: RecordItem;
      photoUploadUrl?: string;
      photoStoragePath?: string;
    }>('/records', { method: 'POST', body: JSON.stringify(body) }),

  confirmPhoto: (
    id: string,
    body: { storagePath: string; contentType: string; sizeBytes: number },
  ) =>
    apiFetch<RecordItem>(`/records/${id}/photo/confirm`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listRecords: () => apiFetch<{ items: RecordItem[] }>('/records?limit=100'),

  getRecord: (id: string) => apiFetch<RecordItem>(`/records/${id}`),

  getPhotoUrl: (id: string) => apiFetch<{ url: string }>(`/records/${id}/photo`),

  analyze: (id: string, force = false) =>
    apiFetch<{ analysis: AnalysisItem; quota: AnalysisQuota }>(
      `/records/${id}/analyze`,
      { method: 'POST', body: JSON.stringify({ force }) },
    ),

  getSummary: (params?: { from?: string; to?: string; tz?: number }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.tz != null) qs.set('tz', String(params.tz));
    const query = qs.toString();
    return apiFetch<StatsSummary>(`/stats/summary${query ? `?${query}` : ''}`);
  },

  getSettings: () => apiFetch<SettingsView>('/settings'),

  updateSettings: (body: Record<string, unknown>) =>
    apiFetch<SettingsView>('/settings', { method: 'PATCH', body: JSON.stringify(body) }),
};
