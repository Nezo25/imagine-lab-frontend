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

const STORAGE_KEY = 'imaginelab_reviews_v4';

export const DEFAULT_SAMPLE_REVIEWS: CustomerReview[] = [];

export function getStoredReviews(): CustomerReview[] {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('imaginelab_reviews_v1');
      localStorage.removeItem('imaginelab_reviews_v2');
      localStorage.removeItem('imaginelab_reviews_v3');
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Garante que nenhum depoimento de Pokemon ou Guts do Chico apareça
          return parsed.filter(r => {
            const str = JSON.stringify(r).toLowerCase();
            return !str.includes('mimikyu') && !str.includes('zorua') && !str.includes('berserk') && !str.includes('fuecoco') && !str.includes('chico');
          });
        }
      }
    }
  } catch (e) {}
  return [];
}

export function saveStoredReviews(reviews: CustomerReview[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
      window.dispatchEvent(new Event('imaginelab_reviews_updated'));
    }
  } catch (e) {}
}

/**
 * Busca avaliações públicas aprovadas (para a vitrine da loja)
 */
export async function fetchPublicReviews(): Promise<CustomerReview[]> {
  const local = getStoredReviews().filter(r => r.isApproved);
  return local;
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

  const current = getStoredReviews();
  saveStoredReviews([localReview, ...current]);
  return localReview;
}

/**
 * Busca todas as avaliações para o painel administrativo
 */
export async function fetchAdminReviews(status: string = 'ALL'): Promise<CustomerReview[]> {
  const stored = getStoredReviews();
  if (status === 'PENDING') return stored.filter(r => !r.isApproved);
  if (status === 'APPROVED') return stored.filter(r => r.isApproved);
  return stored;
}

/**
 * Aprova ou oculta uma avaliação no site
 */
export async function toggleReviewApproval(id: number): Promise<CustomerReview> {
  const current = getStoredReviews();
  let updatedReview: CustomerReview | null = null;
  const next = current.map(r => {
    if (r.id === id) {
      updatedReview = { ...r, isApproved: !r.isApproved };
      return updatedReview;
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
  const current = getStoredReviews();
  let updatedReview: CustomerReview | null = null;
  const next = current.map(r => {
    if (r.id === id) {
      updatedReview = {
        ...r,
        customerName: payload.customerName,
        rating: payload.rating,
        comment: payload.comment,
        productName: payload.productName,
        customerCity: payload.customerCity || null
      };
      return updatedReview;
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
  const current = getStoredReviews();
  saveStoredReviews(current.filter(r => r.id !== id));
}
