const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL || '';
const PATHS_ENV = (import.meta.env.VITE_THREADS_PATHS as string | undefined) || '/api/threads,/threads';
const THREAD_PATH_CANDIDATES = PATHS_ENV.split(',').map(s => s.trim()).filter(Boolean);

export interface ThreadMeta {
  pk: string; // THREAD#<id>
  sk: 'META';
  name: string;
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

export interface FavoriteBaseItem {
  id: string;
  name: string;
  createdAt: string;
}

export interface FavoriteFileItem extends FavoriteBaseItem {
  kind: 'file';
  dataUrl: string;
  mime?: string;
}

export interface FavoriteTextItem extends FavoriteBaseItem {
  kind: 'text';
  text: string;
}

export type FavoriteItem = FavoriteFileItem | FavoriteTextItem;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${DEFAULT_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const ct = res.headers.get('content-type') || ''
    let message = res.statusText
    if (ct.includes('application/json')) {
      try {
        const data = (await res.json()) as { error?: string }
        message = data?.error || message
      } catch {
        // ignore parse errors
      }
    } else {
      const text = await res.text().catch(() => '')
      if (text && text.length < 200 && !text.trim().startsWith('<')) message = text
    }
    throw new Error(`HTTP ${res.status}: ${message}`)
  }
  return (await res.json()) as T
}

async function httpWithFallback<T>(relative: string, init?: RequestInit): Promise<T> {
  const errors: string[] = [];
  for (const basePath of THREAD_PATH_CANDIDATES) {
    const path = relative.replace('__PATH__', basePath);
    try {
      return await http<T>(path, init);
    } catch (e: any) {
      errors.push(String(e?.message || e));
      continue;
    }
  }
  throw new Error(errors.join(' | '));
}

type CreateThreadInput = { title: string; body: string } & Record<string, unknown>;

export const api = {
  listThreads(): Promise<ThreadMeta[]> {
    return httpWithFallback<ThreadMeta[]>('__PATH__');
  },
  getThread(id: string): Promise<ThreadDetailResponse> {
    return httpWithFallback<ThreadDetailResponse>(`__PATH__?id=${encodeURIComponent(id)}`);
  },
  createThread(input: CreateThreadInput): Promise<{ id: string }> {
    return httpWithFallback<{ id: string }>(`__PATH__`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  addReply(id: string, input: { name?: string; body: string }): Promise<{ ok: boolean }> {
    return httpWithFallback<{ ok: boolean }>(`__PATH__?id=${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  deleteThread(id: string): Promise<{ ok: boolean }> {
    return http<{ ok: boolean }>(`/api/threads?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
  listFavorites(): Promise<FavoriteItem[]> {
    return http<FavoriteItem[]>('/api/favorites');
  },
  addFavorite(input: { name: string; dataUrl?: string; mime?: string; text?: string }): Promise<{ id: string }> {
    return http<{ id: string }>('/api/favorites', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  deleteFavorite(id: string): Promise<{ ok: boolean }> {
    return http<{ ok: boolean }>(`/api/favorites?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export function extractIdFromPk(pk: string): string {
  return pk.replace(/^THREAD#/, '');
}

