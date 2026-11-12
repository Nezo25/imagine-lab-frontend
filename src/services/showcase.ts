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

const LOCAL_STORAGE_SHOWCASE_KEY = 'imaginelab_showcase_slots_v5';
const ADMIN_SHOWCASE_CACHE_KEY = 'imaginelab_showcase_admin_v5';

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

/** Retorna vitrine pública montada a partir dos produtos da ImagineLab */
export function getDefaultPublicShowcase(catalogProducts?: Product[]): PublicShowcaseResponse {
  const products = catalogProducts && catalogProducts.length > 0 ? catalogProducts : getStoredProducts();
  const activeProducts = products.filter(p => p.active && !isForeignChicoItem(p));

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

  const pMushroom = activeProducts.find(p => p.id === 'super-mario-mushroom-lamp') || activeProducts[3];

  return {
    slots,
    mysteryDrop: {
      slotNumber: 4,
      title: 'Drop Secreto ImagineLab',
      subtitle: 'Luminária Pendente Cogumelo em impressão 3D',
      category: 'DIORAMA',
      universe: 'DIORAMA_ACCESSORY',
      imageUrl: pMushroom?.image || '/images/products/super-mario-mushroom-lamp.png',
      whatsappText: 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!',
    },
  };
}

/** Busca a vitrine pública do Hero com persistência segura e isolamento total */
export async function fetchPublicShowcase(catalog?: Product[]): Promise<PublicShowcaseResponse> {
  // Purga chaves legadas
  if (typeof window !== 'undefined') {
    localStorage.removeItem('imaginelab_showcase_slots_v1');
    localStorage.removeItem('imaginelab_showcase_slots_v2');
    localStorage.removeItem('imaginelab_showcase_slots_v3');
    localStorage.removeItem('imaginelab_showcase_slots_v4');
    localStorage.removeItem('imaginelab_showcase_slots_cache_v2');
  }

  try {
    const cached = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_SHOWCASE_KEY) : null;
    if (cached) {
      try {
        const parsed: PublicShowcaseResponse = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.slots)) {
          const cleanSlots = parsed.slots.filter(s => s && s.productId && !isForeignChicoItem(s));
          let wpp = parsed.mysteryDrop?.whatsappText || 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!';
          wpp = wpp.replace(/chico/gi, 'ImagineLab').replace(/forja/gi, 'ImagineLab');
          const cleanMystery: PublicMysteryDrop = {
            slotNumber: 4,
            title: parsed.mysteryDrop?.title || 'Drop Secreto ImagineLab',
            subtitle: parsed.mysteryDrop?.subtitle || 'Próximo lançamento exclusivo em impressão 3D',
            category: parsed.mysteryDrop?.category || 'GEEK_GENERAL',
            imageUrl: parsed.mysteryDrop?.imageUrl || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop',
            whatsappText: wpp,
          };
          return { slots: cleanSlots, mysteryDrop: cleanMystery };
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
    localStorage.removeItem('imaginelab_showcase_admin_v1');
    localStorage.removeItem('imaginelab_showcase_admin_v2');
    localStorage.removeItem('imaginelab_showcase_admin_v3');
    localStorage.removeItem('imaginelab_showcase_admin_v4');
    localStorage.removeItem('imaginelab_showcase_admin_cache_v1');
  }

  // 1. Prioriza SEMPRE o cache local salvo pela administração da ImagineLab
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(ADMIN_SHOWCASE_CACHE_KEY);
    if (cached) {
      try {
        const parsed: AdminShowcaseSlot[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === 4) {
          const cleaned = parsed.map(s => {
            if (s.slotNumber === 4) {
              let wpp = s.mysteryWhatsappText || 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!';
              wpp = wpp.replace(/chico/gi, 'ImagineLab').replace(/forja/gi, 'ImagineLab');
              return {
                ...s,
                mysteryTitle: s.mysteryTitle || 'Drop Secreto ImagineLab',
                mysterySubtitle: s.mysterySubtitle || 'Próximo lançamento exclusivo em impressão 3D',
                mysteryWhatsappText: wpp,
              };
            }
            if (isForeignChicoItem(s)) {
              return {
                slotNumber: s.slotNumber,
                productId: null,
                productName: null,
                productCategory: null,
                productImageUrl: null,
                originalPrice: null,
                promotionalPrice: null,
                discountAmount: 0,
                discountPercentage: 0,
                badgeLabel: '🔥 DESTAQUE IMAGINELAB',
                allowCouponStacking: false,
                isActive: true,
              };
            }
            return s;
          });
          localStorage.setItem(ADMIN_SHOWCASE_CACHE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      } catch {}
    }
  }

  // 2. Slots iniciais prontos e limpos para a ImagineLab
  const fallback = getDefaultPublicShowcase(catalog);
  const initialSlots: AdminShowcaseSlot[] = [1, 2, 3].map(num => {
    const match = fallback.slots.find(s => s.slotNumber === num);
    if (match && !isForeignChicoItem(match)) {
      return {
        slotNumber: match.slotNumber,
        productId: match.productId,
        productName: match.name,
        productCategory: match.category,
        productImageUrl: match.imageUrl,
        originalPrice: match.originalPrice,
        promotionalPrice: match.promotionalPrice,
        discountAmount: match.discountAmount,
        discountPercentage: match.discountPercentage,
        badgeLabel: match.badgeLabel || '🔥 DESTAQUE IMAGINELAB',
        allowCouponStacking: match.allowCouponStacking ?? false,
        isActive: true,
      };
    }
    return {
      slotNumber: num,
      productId: null,
      productName: null,
      productCategory: null,
      productImageUrl: null,
      originalPrice: null,
      promotionalPrice: null,
      discountAmount: 0,
      discountPercentage: 0,
      badgeLabel: '🔥 DESTAQUE IMAGINELAB',
      allowCouponStacking: false,
      isActive: true,
    };
  });

  initialSlots.push({
    slotNumber: 4,
    isActive: true,
    badgeLabel: '❓ DROP MISTERIOSO',
    mysteryTitle: fallback.mysteryDrop.title,
    mysterySubtitle: fallback.mysteryDrop.subtitle,
    mysteryCategory: fallback.mysteryDrop.category,
    mysteryImageUrl: fallback.mysteryDrop.imageUrl,
    mysteryWhatsappText: fallback.mysteryDrop.whatsappText,
  });

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
      let pub: PublicShowcaseResponse = publicCached ? JSON.parse(publicCached) : {
        slots: [],
        mysteryDrop: {
          slotNumber: 4,
          title: 'Drop Secreto ImagineLab',
          subtitle: 'Próximo lançamento exclusivo em impressão 3D',
          category: 'GEEK_GENERAL',
          imageUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop',
          whatsappText: 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!',
        }
      };

      if (!pub.slots) pub.slots = [];

      if (slotNumber >= 1 && slotNumber <= 3) {
        const pIdx = pub.slots.findIndex((s: any) => s.slotNumber === slotNumber);
        if (request.productId === null) {
          if (pIdx !== -1) {
            pub.slots.splice(pIdx, 1);
          }
        } else {
          const newSlotItem: PublicShowcaseSlot = {
            slotNumber,
            productId: request.productId,
            name: request.productName,
            category: request.productCategory,
            imageUrl: request.productImageUrl,
            originalPrice: request.originalPrice,
            promotionalPrice: request.promotionalPrice,
            discountAmount: request.discountAmount,
            discountPercentage: request.discountPercentage,
            badgeLabel: request.badgeLabel || '🔥 DESTAQUE IMAGINELAB',
            allowCouponStacking: request.allowCouponStacking ?? false,
          };
          if (pIdx !== -1) {
            pub.slots[pIdx] = newSlotItem;
          } else {
            pub.slots.push(newSlotItem);
          }
        }
      } else if (slotNumber === 4) {
        let wpp = request.mysteryWhatsappText || pub.mysteryDrop?.whatsappText || 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!';
        wpp = wpp.replace(/chico/gi, 'ImagineLab').replace(/forja/gi, 'ImagineLab');
        pub.mysteryDrop = {
          slotNumber: 4,
          title: request.mysteryTitle || pub.mysteryDrop?.title || 'Drop Secreto ImagineLab',
          subtitle: request.mysterySubtitle || pub.mysteryDrop?.subtitle || 'Próximo lançamento exclusivo em impressão 3D',
          category: request.mysteryCategory || pub.mysteryDrop?.category || 'GEEK_GENERAL',
          imageUrl: request.mysteryImageUrl || pub.mysteryDrop?.imageUrl || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop',
          whatsappText: wpp,
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
