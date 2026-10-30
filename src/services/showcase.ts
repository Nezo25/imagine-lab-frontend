import { fetchApi } from '@/api/client';
import { type Product } from '@/data/products';
import { getStoredProducts } from './storage';

export interface PublicShowcaseSlot {
  slotNumber: number;
  productId?: number | null;
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
  productId?: number | null;
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
  productId?: number | null;
  promotionalPrice?: number | null;
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

const LOCAL_STORAGE_SHOWCASE_KEY = 'forja_showcase_slots_cache_v2';

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
      productId: Number(p.id) || null,
      name: p.name,
      category: p.category || 'FIGURE_POKEMON',
      universe: p.universe || 'POKEMON_TCG',
      primaryType: p.types?.[0] || 'Normal',
      secondaryType: p.types?.[1] || null,
      scale: p.scales?.[0] || '1:10 (~15 cm)',
      imageUrl: p.image,
      originalPrice: orig,
      promotionalPrice: promo,
      discountAmount: diff,
      discountPercentage: pct,
      badgeLabel: '🔥 OFERTA DESTAQUE DA OFICINA',
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

const ADMIN_SHOWCASE_CACHE_KEY = 'forja_showcase_admin_cache_v1';

/** Busca os dados completos de administração dos slots com persistência real */
export async function fetchAdminShowcase(catalog?: Product[]): Promise<AdminShowcaseSlot[]> {
  try {
    const data = await fetchApi<AdminShowcaseSlot[]>('/admin/showcase');
    if (Array.isArray(data) && data.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_SHOWCASE_CACHE_KEY, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn('API /admin/showcase indisponível no momento:', err);
  }

  // Verifica se há dados válidos em cache local
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(ADMIN_SHOWCASE_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
  }

  // Gera slots a partir de produtos reais existentes
  const fallback = getDefaultPublicShowcase(catalog);
  return [
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
      badgeLabel: s.badgeLabel || '🔥 OFERTA DESTAQUE DA OFICINA',
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
}

/** Atualiza um slot individual no backend com persistência local imediata */
export async function updateShowcaseSlot(
  slotNumber: number,
  request: ShowcaseSlotUpdateRequest
): Promise<AdminShowcaseSlot> {
  // Salva no cache local imediatamente para resposta instantânea
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(ADMIN_SHOWCASE_CACHE_KEY);
      if (cached) {
        const slots: AdminShowcaseSlot[] = JSON.parse(cached);
        const updated = slots.map(s => s.slotNumber === slotNumber ? { ...s, ...request } : s);
        localStorage.setItem(ADMIN_SHOWCASE_CACHE_KEY, JSON.stringify(updated));
      }
    } catch {}
  }

  try {
    const result = await fetchApi<AdminShowcaseSlot>(`/admin/showcase/slot/${slotNumber}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('forja_showcase_updated'));
    }
    return result;
  } catch (err) {
    console.warn(`API remota indisponível, alteração do slot ${slotNumber} salva localmente:`, err);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('forja_showcase_updated'));
    }
    return { slotNumber, ...request } as AdminShowcaseSlot;
  }
}
