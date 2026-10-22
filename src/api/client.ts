// Client de API para conexão com backend ImagineLab (reaproveitado da arquitetura Forja/Chico)
// Suporta multi-instance na VPS com chave dinâmica no localStorage e fallback configurável

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('imaginelab_api_url') || localStorage.getItem('forja_api_url');
    if (saved) return saved.replace(/\/+$/, '');
  }
  const root = import.meta.env.VITE_API_URL || 'https://forja-backend-1.onrender.com';
  return `${root.replace(/\/+$/, '')}/api/v1`;
};

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('__adm_token') : null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s para cold-start da VPS/Render

  try {
    const response = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `Erro ${response.status}: ${response.statusText || 'Falha na requisição'}`;
      try {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          if (json.detail) errorMsg = json.detail;
          else if (json.message) errorMsg = json.message;
          else if (json.error) errorMsg = json.error;
        } catch {
          if (text && text.length < 200) errorMsg += ` - ${text}`;
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('A requisição demorou muito e foi cancelada (Timeout de 60s).');
    }
    throw error;
  }
}
