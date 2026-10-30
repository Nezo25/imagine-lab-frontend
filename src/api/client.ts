const getBaseUrl = () => {
  const custom = typeof window !== 'undefined'
    ? (localStorage.getItem('imaginelab_api_url') || localStorage.getItem('forja_api_url'))
    : null;
  
  const root = custom || 
    (typeof import.meta !== 'undefined' && (import.meta.env.VITE_API_URL || (import.meta.env as any).NEXT_PUBLIC_API_URL)) ||
    'https://api.imaginelab.seudominio.com.br';

  const clean = root.trim().replace(/\/+$/, '');
  if (clean.endsWith('/api/v1')) return clean;
  return `${clean}/api/v1`;
};

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('__adm_token') : null;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos

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
    return text ? JSON.parse(text) : {} as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Tempo limite de conexão esgotado. Verifique sua conexão com a internet.');
    }
    throw error;
  }
}
