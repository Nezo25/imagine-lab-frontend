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

const LOCAL_STORAGE_SHOWCASE_KEY = 'imaginelab_showcase_slots_v4';
const ADMIN_SHOWCASE_CACHE_KEY = 'imaginelab_showcase_admin_v4';

export function isForeignChicoItem(item: any): boolean {
  if (!item) return false;
  const str = JSON.stringify(item).toLowerCase();
  return (
    str.includes('chico') ||
    str.includes('berserk') ||
    str.includes('pokébola') ||
    str.includes('pokebola') ||
    str.includes('gengar') ||
    str.includes('zorua') ||
    str.includes('tepig') ||
    str.includes('fennekin') ||
    str.includes('mimikyu') ||
    str.includes('scorbunny') ||
    str.includes('litten') ||
    str.includes('fuecoco') ||
    str.includes('rayquaza') ||
    str.includes('pikachu') ||
    str.includes('charizard') ||
    str.includes('bulbasaur') ||
    str.includes('mewtwo') ||
    str.includes('gyarados') ||
    str.includes('garchomp') ||
    str.includes('dialga') ||
    str.includes('demon slayer') ||
    str.includes('figure da semana')
  );
}

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
      category: 'GEEK_GENERAL',
      universe: 'POP_CULTURE_GEEK',
      imageUrl: activeProducts[3]?.image || pFirst?.image || '/images/products/super-mario-mushroom-lamp.png',
      whatsappText: 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!',
    },
  };
}

/** Busca a vitrine pública do Hero da API com persistência segura e isolamento total */
export async function fetchPublicShowcase(catalog?: Product[]): Promise<PublicShowcaseResponse> {
  // Purga chaves legadas antigas
  if (typeof window !== 'undefined') {
    localStorage.removeItem('imaginelab_showcase_slots_v3');
    localStorage.removeItem('imaginelab_showcase_slots_cache_v2');
  }

  try {
    const cached = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_SHOWCASE_KEY) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.slots) && parsed.slots.length > 0 && !isForeignChicoItem(parsed)) {
          if (parsed.mysteryDrop?.whatsappText?.toLowerCase().includes('chico')) {
            parsed.mysteryDrop.whatsappText = 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!';
          }
          return parsed;
        }
      } catch {}
    }

    const initialFallback = getDefaultPublicShowcase(catalog);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SHOWCASE_KEY, JSON.stringify(initialFallback));
    }
    return initialFallback;
  } catch {
    return getDefaultPublicShowcase(catalog);
  }
}

/** Busca os dados completos de administração dos slots com persistência real */
export async function fetchAdminShowcase(catalog?: Product[]): Promise<AdminShowcaseSlot[]> {
  // Purga chaves legadas antigas
  if (typeof window !== 'undefined') {
    localStorage.removeItem('imaginelab_showcase_admin_v3');
    localStorage.removeItem('imaginelab_showcase_admin_cache_v1');
  }

  // 1. Prioriza SEMPRE o cache local salvo pela administração da ImagineLab
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(ADMIN_SHOWCASE_CACHE_KEY);
    if (cached) {
      try {
        const parsed: AdminShowcaseSlot[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === 4 && !isForeignChicoItem(parsed)) {
          parsed.forEach(s => {
            if (s.mysteryWhatsappText?.toLowerCase().includes('chico')) {
              s.mysteryWhatsappText = 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!';
            }
          });
          return parsed;
        }
      } catch {}
    }
  }

  // 2. Gera slots padrão a partir do catálogo exclusivo da ImagineLab
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
      let pub: PublicShowcaseResponse;
      try {
        const publicCached = localStorage.getItem(LOCAL_STORAGE_SHOWCASE_KEY);
        pub = publicCached ? JSON.parse(publicCached) : getDefaultPublicShowcase();
        if (!pub || !Array.isArray(pub.slots) || pub.slots.length === 0 || isForeignChicoItem(pub)) {
          pub = getDefaultPublicShowcase();
        }
      } catch {
        pub = getDefaultPublicShowcase();
      }

      if (slotNumber >= 1 && slotNumber <= 3) {
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
        }
      } else if (slotNumber === 4 && pub.mysteryDrop) {
        pub.mysteryDrop = {
          ...pub.mysteryDrop,
          title: request.mysteryTitle !== undefined && request.mysteryTitle !== null ? request.mysteryTitle : pub.mysteryDrop.title,
          subtitle: request.mysterySubtitle !== undefined && request.mysterySubtitle !== null ? request.mysterySubtitle : pub.mysteryDrop.subtitle,
          category: request.mysteryCategory !== undefined && request.mysteryCategory !== null ? request.mysteryCategory : pub.mysteryDrop.category,
          imageUrl: request.mysteryImageUrl !== undefined && request.mysteryImageUrl !== null ? request.mysteryImageUrl : pub.mysteryDrop.imageUrl,
          whatsappText: request.mysteryWhatsappText !== undefined && request.mysteryWhatsappText !== null ? request.mysteryWhatsappText : pub.mysteryDrop.whatsappText,
        };
      }

      localStorage.setItem(LOCAL_STORAGE_SHOWCASE_KEY, JSON.stringify(pub));
      window.dispatchEvent(new Event('imaginelab_showcase_updated'));
    } catch (e) {
      console.error('Erro ao salvar localmente o slot da vitrine:', e);
    }
  }

  return updatedSlot;
}
