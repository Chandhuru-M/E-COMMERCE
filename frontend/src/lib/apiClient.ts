const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api';

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export const apiClient = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { timeoutMs: requestedTimeout, signal, headers, ...rest } = options;
  const controller = signal ? null : new AbortController();
  const timeoutMs = requestedTimeout ?? 10000;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? {})
      },
      signal: signal ?? controller?.signal
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Request failed');
    }

    return (await response.json()) as T;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};
