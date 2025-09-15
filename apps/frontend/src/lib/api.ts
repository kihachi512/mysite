const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface ThreadMeta {
  pk: string; // THREAD#<id>
  sk: 'META';
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadReply {
  pk: string; // THREAD#<id>
  sk: string; // REPLY#<iso>
  name: string;
  body: string;
  createdAt: string;
}

export interface ThreadDetailResponse {
  thread: ThreadMeta;
  replies: ThreadReply[];
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${DEFAULT_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  listThreads(): Promise<ThreadMeta[]> {
    return http<ThreadMeta[]>('/api/threads');
  },
  getThread(id: string): Promise<ThreadDetailResponse> {
    return http<ThreadDetailResponse>(`/api/threads?id=${encodeURIComponent(id)}`);
  },
  createThread(input: { title: string; body: string }): Promise<{ id: string }> {
    return http<{ id: string }>(`/api/threads`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  addReply(id: string, input: { name?: string; body: string }): Promise<{ ok: boolean }> {
    return http<{ ok: boolean }>(`/api/threads?id=${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

export function extractIdFromPk(pk: string): string {
  return pk.replace(/^THREAD#/, '');
}

