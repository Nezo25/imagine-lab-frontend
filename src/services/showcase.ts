import { fetchApi } from '@/api/client';
import { type Product } from '@/data/products';
import { getStoredProducts } from './storage';

export interface PublicShowcaseSlot {
  slotNumber: number;
  productId?: number | string | null;
  name?: string | null;
  category?: string | null;
  universe?: string | null;
  primaryType?: string | null;
  secondaryType?: string | null;
  scale?: string | null;
  imageUrl?: string | null;
  originalPrice?: number | null;
  promotionalPrice?: number | null;
  discountAmount?: number | null;
  discountPercentage?: number | null;
  badgeLabel?: string | null;
  allowCouponStacking?: boolean | null;
}

export interface PublicMysteryDrop {
  slotNumber: number;
  title: string;
  subtitle: string;
  category: string;
  universe?: string | null;
  imageUrl?: string | null;
  whatsappText: string;
}

export interface PublicShowcaseResponse {
  slots: PublicShowcaseSlot[];
  mysteryDrop: PublicMysteryDrop;
}

export interface AdminShowcaseSlot {
  id?: number;
  slotNumber: number;
  productId?: number | string | null;
  productName?: string | null;
  productCategory?: string | null;
  universe?: string | null;
  productImageUrl?: string | null;
  originalPrice?: number | null;
  promotionalPrice?: number | null;
  discountAmount?: number | null;
  discountPercentage?: number | null;
  badgeLabel?: string | null;
  allowCouponStacking?: boolean;
  isActive?: boolean;
  mysteryTitle?: string | null;
  mysterySubtitle?: string | null;
  mysteryCategory?: string | null;
  mysteryImageUrl?: string | null;
  mysteryWhatsappText?: string | null;
  updatedAt?: string | null;
}

export interface ShowcaseSlotUpdateRequest {
  productId?: number | string | null;
  productName?: string | null;
  productCategory?: string | null;
  productImageUrl?: string | null;
  originalPrice?: number | null;
  promotionalPrice?: number | null;
  discountAmount?: number | null;
  discountPercentage?: number | null;
  badgeLabel?: string | null;
  allowCouponStacking?: boolean;
  isActive?: boolean;
  universe?: string | null;
  mysteryTitle?: string | null;
  mysterySubtitle?: string | null;
  mysteryCategory?: string | null;
  mysteryImageUrl?: string | null;
  mysteryWhatsappText?: string | null;
}

const LOCAL_STORAGE_SHOWCASE_KEY = 'imaginelab_showcase_slots_cache_v2';

/** Retorna vitrine pública montada exclusivamente a partir de produtos reais cadastrados */
export function getDefaultPublicShowcase(catalogProducts?: Product[]): PublicShowcaseResponse {
  const products = catalogProducts && catalogProducts.length > 0 ? catalogProducts : getStoredProducts();
  const activeProducts = products.filter(p => p.active);

  const makeSlot = (num: number, p: Product): PublicShowcaseSlot => {
    const orig = p.basePrice || 75;
    const defaultDiff = orig >= 80 ? 16 : (orig >= 50 ? 10 : 8);
    const promo = p.promoPrice && p.promoPrice > 0 && p.promoPrice < orig 
      ? p.promoPrice 
      : Math.max(15, orig - defaultDiff);
    const diff = orig - promo;
    const pct = Math.round((diff / orig) * 100);

    return {
      slotNumber: num,
      productId: p.id,
      name: p.name,
      category: p.category || 'Chibis / Miniaturas',
      universe: p.universe || 'POP_CULTURE_GEEK',
      primaryType: p.types?.[0] || 'Normal',
      secondaryType: p.types?.[1] || null,
      scale: p.scales?.[0] || '1:10 (~15 cm)',
      imageUrl: p.image,
      originalPrice: orig,
      promotionalPrice: promo,
      discountAmount: diff,
      discountPercentage: pct,
      badgeLabel: '🔥 DESTAQUE IMAGINELAB',
      allowCouponStacking: false,
    };
  };

  const slots: PublicShowcaseSlot[] = [];
  if (activeProducts.length > 0) {
    const maxSlots = Math.min(3, activeProducts.length);
    for (let i = 0; i < maxSlots; i++) {
      slots.push(makeSlot(i + 1, activeProducts[i]));
    }
  }

  const pFirst = activeProducts[0];

  return {
    slots,
    mysteryDrop: {
      slotNumber: 4,
      title: 'Drop Secreto ImagineLab',
      subtitle: 'Próximo lançamento exclusivo em impressão 3D',
      category: 'FIGURE_POKEMON',
      universe: 'ANIME_MANGA',
      imageUrl: pFirst?.image || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop',
      whatsappText: 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!',
    },
  };
}

/** Busca a vitrine pública do Hero da API com persistência segura */
export async function fetchPublicShowcase(catalog?: Product[]): Promise<PublicShowcaseResponse> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_SHOWCASE_KEY);
    let initialFallback: PublicShowcaseResponse;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.slots)) {
          // Higieniza resquícios de testes antigos
          parsed.slots = parsed.slots.filter((s: any) => 
            s && s.name && !s.name.includes('Figure da Semana') && (!s.imageUrl || !s.imageUrl.includes('placehold.co'))
          );
        }
        initialFallback = parsed && parsed.slots && parsed.slots.length > 0 ? parsed : getDefaultPublicShowcase(catalog);
      } catch {
        initialFallback = getDefaultPublicShowcase(catalog);
      }
    } else {
      initialFallback = getDefaultPublicShowcase(catalog);
    }

    try {
      const data = await fetchApi<PublicShowcaseResponse>('/showcase');
      if (data && Array.isArray(data.slots) && data.slots.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_SHOWCASE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (apiErr) {
      console.warn('API /showcase indisponível no momento:', apiErr);
    }

    return initialFallback;
  } catch {
    return getDefaultPublicShowcase(catalog);
  }
}

const ADMIN_SHOWCASE_CACHE_KEY = 'imaginelab_showcase_admin_cache_v1';

/** Busca os dados completos de administração dos slots com persistência real */
export async function fetchAdminShowcase(catalog?: Product[]): Promise<AdminShowcaseSlot[]> {
  // 1. Prioriza SEMPRE o cache local salvo pela administração da ImagineLab
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(ADMIN_SHOWCASE_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      } catch {}
    }
  }

  // 2. Tenta buscar da API remota caso não haja cache local
  try {
    const data = await fetchApi<AdminShowcaseSlot[]>('/admin/showcase');
    if (Array.isArray(data) && data.length > 0) {
      // Rejeita se contiver figures alheias (ex: Pokémon da Forja do Chico)
      const hasForeign = data.some(s => s && s.productName && /zorua|tepig|fennekin|mimikyu|scorbunny|litten|fuecoco/i.test(s.productName));
      if (!hasForeign) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(ADMIN_SHOWCASE_CACHE_KEY, JSON.stringify(data));
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('API /admin/showcase em modo local:', err);
  }

  // 3. Gera slots padrão a partir do catálogo exclusivo da ImagineLab
  const fallback = getDefaultPublicShowcase(catalog);
  const initialSlots: AdminShowcaseSlot[] = [
    ...fallback.slots.map(s => ({
      slotNumber: s.slotNumber,
      productId: s.productId,
      productName: s.name,
      productCategory: s.category,
      productImageUrl: s.imageUrl,
      originalPrice: s.originalPrice,
      promotionalPrice: s.promotionalPrice,
      discountAmount: s.discountAmount,
      discountPercentage: s.discountPercentage,
      badgeLabel: s.badgeLabel || '🔥 DESTAQUE IMAGINELAB',
      allowCouponStacking: s.allowCouponStacking ?? false,
      isActive: true,
    })),
    {
      slotNumber: 4,
      isActive: true,
      badgeLabel: '❓ DROP MISTERIOSO',
      mysteryTitle: fallback.mysteryDrop.title,
      mysterySubtitle: fallback.mysteryDrop.subtitle,
      mysteryCategory: fallback.mysteryDrop.category,
      mysteryImageUrl: fallback.mysteryDrop.imageUrl,
      mysteryWhatsappText: fallback.mysteryDrop.whatsappText,
    },
  ];

  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_SHOWCASE_CACHE_KEY, JSON.stringify(initialSlots));
  }
  return initialSlots;
}

/** Atualiza um slot individual com persistência local imediata e sincronização */
export async function updateShowcaseSlot(
  slotNumber: number,
  request: ShowcaseSlotUpdateRequest
): Promise<AdminShowcaseSlot> {
  let updatedSlot: AdminShowcaseSlot = { slotNumber, ...request };

  // 1. Salva no cache local de administração imediatamente
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(ADMIN_SHOWCASE_CACHE_KEY);
      let slots: AdminShowcaseSlot[] = cached ? JSON.parse(cached) : [];
      if (!Array.isArray(slots) || slots.length === 0) {
        slots = [1, 2, 3, 4].map(num => ({ slotNumber: num, isActive: true }));
      }
      const existingIdx = slots.findIndex(s => s.slotNumber === slotNumber);
      if (existingIdx !== -1) {
        slots[existingIdx] = { ...slots[existingIdx], ...request };
        updatedSlot = slots[existingIdx];
      } else {
        slots.push(updatedSlot);
      }
      localStorage.setItem(ADMIN_SHOWCASE_CACHE_KEY, JSON.stringify(slots));

      // 2. Atualiza em tempo real a vitrine pública (para o Hero da Home)
      const publicCached = localStorage.getItem(LOCAL_STORAGE_SHOWCASE_KEY);
      if (publicCached) {
        try {
          const pub = JSON.parse(publicCached);
          if (pub && Array.isArray(pub.slots)) {
            const pIdx = pub.slots.findIndex((s: any) => s.slotNumber === slotNumber);
            if (pIdx !== -1) {
              if (request.productId === null) {
                pub.slots[pIdx] = {
                  slotNumber,
                  productId: null,
                  name: null,
                  imageUrl: null,
                  originalPrice: null,
                  promotionalPrice: null,
                  discountAmount: 0,
                  discountPercentage: 0,
                  badgeLabel: null,
                };
              } else {
                pub.slots[pIdx] = {
                  ...pub.slots[pIdx],
                  productId: request.productId,
                  name: request.productName !== undefined ? request.productName : pub.slots[pIdx]?.name,
                  category: request.productCategory !== undefined ? request.productCategory : pub.slots[pIdx]?.category,
                  imageUrl: request.productImageUrl !== undefined ? request.productImageUrl : pub.slots[pIdx]?.imageUrl,
                  originalPrice: request.originalPrice !== undefined ? request.originalPrice : pub.slots[pIdx]?.originalPrice,
                  promotionalPrice: request.promotionalPrice !== undefined ? request.promotionalPrice : pub.slots[pIdx]?.promotionalPrice,
                  discountAmount: request.discountAmount !== undefined ? request.discountAmount : pub.slots[pIdx]?.discountAmount,
                  discountPercentage: request.discountPercentage !== undefined ? request.discountPercentage : pub.slots[pIdx]?.discountPercentage,
                  badgeLabel: request.badgeLabel !== undefined ? request.badgeLabel : pub.slots[pIdx]?.badgeLabel,
                  allowCouponStacking: request.allowCouponStacking !== undefined ? request.allowCouponStacking : pub.slots[pIdx]?.allowCouponStacking,
                };
              }
              localStorage.setItem(LOCAL_STORAGE_SHOWCASE_KEY, JSON.stringify(pub));
            }
          }
        } catch {}
      }

      window.dispatchEvent(new Event('imaginelab_showcase_updated'));
    } catch (e) {
      console.error('Erro ao salvar localmente o slot da vitrine:', e);
    }
  }

  // 3. Tenta sincronizar com o backend remoto se houver ID numérico
  if (typeof request.productId === 'number') {
    try {
      const result = await fetchApi<AdminShowcaseSlot>(`/admin/showcase/slot/${slotNumber}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      });
      return result;
    } catch (err) {
      console.warn(`Sync remoto do slot ${slotNumber} mantido localmente:`, err);
    }
  }

  return updatedSlot;
}
