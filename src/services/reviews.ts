import { fetchApi } from '@/api/client';

export interface CustomerReview {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  productName: string;
  customerCity?: string | null;
  isApproved: boolean;
  createdAt: string;
}

export interface ReviewSubmitPayload {
  customerName: string;
  rating: number;
  comment: string;
  productName: string;
  customerCity?: string;
}

const STORAGE_KEY = 'forja_reviews_v1';

export const DEFAULT_SAMPLE_REVIEWS: CustomerReview[] = [
  {
    id: 101,
    customerName: 'Beatriz S.',
    rating: 5,
    comment: 'Comprei o Mimikyu e superou todas as expectativas. Textura limpa sem marcas de impressão, peso muito bom e acabamento impecável na estante. Atendimento pelo WhatsApp nota 10!',
    productName: 'Mimikyu (10 cm)',
    customerCity: 'São Paulo - SP',
    isApproved: true,
    createdAt: '2026-03-20T14:30:00.000Z'
  },
  {
    id: 102,
    customerName: 'Lucas M.',
    rating: 5,
    comment: 'A pintura do Zorua ficou absurda de linda! O degradê nos detalhes e olhos é perfeito. Veio muito bem embalado e protegido.',
    productName: 'Zorua (Pintado à Mão)',
    customerCity: 'Curitiba - PR',
    isApproved: true,
    createdAt: '2026-03-25T16:45:00.000Z'
  },
  {
    id: 103,
    customerName: 'Rodrigo Albuquerque',
    rating: 5,
    comment: 'O relevo 3D da arte do Guts é sensacional. O contraste e os detalhes das sombras ficaram muito fiéis ao mangá. Chegou rápido e extremamente protegido.',
    productName: 'Quadro Guts Berserk',
    customerCity: 'Florianópolis - SC',
    isApproved: true,
    createdAt: '2026-04-02T11:20:00.000Z'
  },
  {
    id: 104,
    customerName: 'Matheus K.',
    rating: 5,
    comment: 'Simplesmente perfeito! As cores vivas e o acabamento manual deixaram a peça viva. Já encomendei outra para presentear. Parabéns pelo trabalho, equipe ImagineLab!',
    productName: 'Fuecoco (Escala 1:10)',
    customerCity: 'Belo Horizonte - MG',
    isApproved: true,
    createdAt: '2026-04-10T09:15:00.000Z'
  }
];

export function getStoredReviews(): CustomerReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_SAMPLE_REVIEWS;
}

export function saveStoredReviews(reviews: CustomerReview[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    window.dispatchEvent(new Event('forja_reviews_updated'));
  } catch (e) {}
}

/**
 * Busca avaliações públicas aprovadas (para a vitrine da loja)
 */
export async function fetchPublicReviews(): Promise<CustomerReview[]> {
  try {
    const data = await fetchApi<CustomerReview[]>('/reviews/public');
    if (Array.isArray(data) && data.length > 0) {
      saveStoredReviews(data);
      return data;
    }
  } catch (err) {
    console.warn('API /reviews/public offline, verificando cache local:', err);
  }

  // Fallback para avaliações locais que foram aprovadas ou amostras iniciais
  const local = getStoredReviews().filter(r => r.isApproved);
  return local.length > 0 ? local : DEFAULT_SAMPLE_REVIEWS;
}

/**
 * Submissão de avaliação pelo cliente na vitrine
 */
export async function submitCustomerReview(payload: ReviewSubmitPayload): Promise<CustomerReview> {
  const localReview: CustomerReview = {
    id: Date.now(),
    customerName: payload.customerName.trim(),
    rating: payload.rating,
    comment: payload.comment.trim(),
    productName: payload.productName.trim(),
    customerCity: payload.customerCity?.trim() || null,
    isApproved: false,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetchApi<CustomerReview>('/reviews/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res && res.id) {
      // Salva no cache local para backup
      const current = getStoredReviews();
      saveStoredReviews([res, ...current.filter(r => r.id !== res.id)]);
      return res;
    }
  } catch (err) {
    console.warn('API de reviews indisponível para envio remoto, guardando localmente:', err);
  }

  const current = getStoredReviews();
  saveStoredReviews([localReview, ...current]);
  return localReview;
}

/**
 * Busca todas as avaliações para o painel administrativo
 */
export async function fetchAdminReviews(status: string = 'ALL'): Promise<CustomerReview[]> {
  try {
    const data = await fetchApi<CustomerReview[]>(`/admin/reviews?status=${status}`);
    if (Array.isArray(data)) {
      saveStoredReviews(data);
      return data;
    }
  } catch (err) {
    console.warn('API /admin/reviews indisponível, usando armazenamento local:', err);
  }

  const stored = getStoredReviews();
  if (status === 'PENDING') return stored.filter(r => !r.isApproved);
  if (status === 'APPROVED') return stored.filter(r => r.isApproved);
  return stored;
}

/**
 * Aprova ou oculta uma avaliação no site
 */
export async function toggleReviewApproval(id: number): Promise<CustomerReview> {
  let updatedReview: CustomerReview | null = null;

  try {
    updatedReview = await fetchApi<CustomerReview>(`/admin/reviews/${id}/toggle-approval`, {
      method: 'PATCH'
    });
  } catch (err) {
    console.warn('Erro ao alternar aprovação via API, atualizando localmente:', err);
  }

  const current = getStoredReviews();
  const next = current.map(r => {
    if (r.id === id) {
      return updatedReview || { ...r, isApproved: !r.isApproved };
    }
    return r;
  });

  saveStoredReviews(next);
  return updatedReview || next.find(r => r.id === id)!;
}

/**
 * Atualiza o conteúdo de uma avaliação (nota, comentário, cliente, etc.)
 */
export async function updateCustomerReview(id: number, payload: ReviewSubmitPayload): Promise<CustomerReview> {
  let updatedReview: CustomerReview | null = null;

  try {
    updatedReview = await fetchApi<CustomerReview>(`/admin/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Erro ao atualizar avaliação via API, atualizando localmente:', err);
  }

  const current = getStoredReviews();
  const next = current.map(r => {
    if (r.id === id) {
      return updatedReview || {
        ...r,
        customerName: payload.customerName,
        rating: payload.rating,
        comment: payload.comment,
        productName: payload.productName,
        customerCity: payload.customerCity || null
      };
    }
    return r;
  });

  saveStoredReviews(next);
  return updatedReview || next.find(r => r.id === id)!;
}

/**
 * Remove uma avaliação
 */
export async function deleteReview(id: number): Promise<void> {
  try {
    await fetchApi(`/admin/reviews/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Erro ao deletar avaliação via API:', err);
  }

  const current = getStoredReviews();
  saveStoredReviews(current.filter(r => r.id !== id));
}
