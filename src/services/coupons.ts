import { fetchApi } from '@/api/client';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_VALUE';

export interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number | null;
  currentUses: number;
  isFirstPurchaseOnly: boolean;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number | null;
  isFirstPurchaseOnly?: boolean;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType: string;
  discountAmount: number;
  finalSubtotal: number;
  message: string;
}

const LOCAL_STORAGE_COUPONS = 'imaginelab_admin_coupons_v3';

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 1,
    code: 'BEMVINDO10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 50,
    maxUses: null,
    currentUses: 0,
    isFirstPurchaseOnly: true,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    code: 'IMAGINE15',
    discountType: 'FIXED_AMOUNT',
    discountValue: 15,
    minOrderValue: 100,
    maxUses: 50,
    currentUses: 0,
    isFirstPurchaseOnly: false,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

function getLocalCoupons(): Coupon[] {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('imaginelab_admin_coupons_cache');
      const raw = localStorage.getItem(LOCAL_STORAGE_COUPONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filtra qualquer cupom vazado da Forja do Chico
          return parsed.filter(c => {
            const str = JSON.stringify(c).toUpperCase();
            return !str.includes('FORJA') && !str.includes('CHICO');
          });
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao ler cupons do localStorage:', e);
  }
  return DEFAULT_COUPONS;
}

function saveLocalCoupons(coupons: Coupon[]) {
  try {
    const clean = coupons.filter(c => {
      const str = JSON.stringify(c).toUpperCase();
      return !str.includes('FORJA') && !str.includes('CHICO');
    });
    localStorage.setItem(LOCAL_STORAGE_COUPONS, JSON.stringify(clean));
  } catch (e) {
    console.warn('Erro ao salvar cupons localmente:', e);
  }
}

export async function fetchAdminCoupons(): Promise<Coupon[]> {
  return getLocalCoupons();
}

export async function createCoupon(couponData: CouponRequest): Promise<Coupon> {
  const cleanCode = couponData.code.trim().toUpperCase();
  if (cleanCode.includes('FORJA') || cleanCode.includes('CHICO')) {
    throw new Error('Código inválido');
  }

  const payload = {
    ...couponData,
    code: cleanCode,
    minOrderValue: couponData.minOrderValue || 0,
    isFirstPurchaseOnly: Boolean(couponData.isFirstPurchaseOnly),
    isActive: couponData.isActive !== false
  };

  const current = getLocalCoupons();
  if (current.some(c => c.code.toUpperCase() === cleanCode)) {
    throw new Error(`Já existe um cupom cadastrado com o código ${cleanCode}`);
  }

  const fallbackCoupon: Coupon = {
    id: Date.now(),
    code: cleanCode,
    discountType: payload.discountType,
    discountValue: Number(payload.discountValue),
    minOrderValue: Number(payload.minOrderValue),
    maxUses: payload.maxUses ? Number(payload.maxUses) : null,
    currentUses: 0,
    isFirstPurchaseOnly: payload.isFirstPurchaseOnly,
    expiresAt: payload.expiresAt || null,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  saveLocalCoupons([fallbackCoupon, ...current]);
  return fallbackCoupon;
}

export async function toggleCouponActive(id: number): Promise<Coupon> {
  const current = getLocalCoupons();
  const match = current.find(c => c.id === id);
  if (!match) throw new Error('Cupom não encontrado');
  match.isActive = !match.isActive;
  saveLocalCoupons([...current]);
  return match;
}

export async function deleteCoupon(id: number): Promise<void> {
  const current = getLocalCoupons().filter(c => c.id !== id);
  saveLocalCoupons(current);
}

export async function validateCoupon(
  code: string,
  subtotal: number,
  customerEmail?: string,
  customerPhone?: string
): Promise<CouponValidationResult> {
  if (!code || !code.trim()) {
    return {
      valid: false,
      code: '',
      discountType: '',
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'Informe o código do cupom.'
    };
  }

  const cleanCode = code.trim().toUpperCase();
  const localList = getLocalCoupons();
  const found = localList.find(c => c.code.toUpperCase() === cleanCode);

  if (!found) {
    return {
      valid: false,
      code: cleanCode,
      discountType: '',
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'Cupom inválido ou não encontrado.'
    };
  }

  if (!found.isActive) {
    return {
      valid: false,
      code: cleanCode,
      discountType: found.discountType,
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'Este cupom está pausado ou inativo.'
    };
  }

  if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
    return {
      valid: false,
      code: cleanCode,
      discountType: found.discountType,
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'Este cupom já expirou.'
    };
  }

  if (found.maxUses && found.currentUses >= found.maxUses) {
    return {
      valid: false,
      code: cleanCode,
      discountType: found.discountType,
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'O limite de utilizações deste cupom foi atingido.'
    };
  }

  const min = found.minOrderValue || 0;
  if (subtotal < min) {
    return {
      valid: false,
      code: cleanCode,
      discountType: found.discountType,
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: `Válido apenas para compras acima de R$ ${min.toFixed(2).replace('.', ',')}.`
    };
  }

  let discount = 0;
  if (found.discountType === 'PERCENTAGE') {
    discount = (subtotal * found.discountValue) / 100;
  } else {
    discount = found.discountValue;
  }
  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    code: found.code,
    discountType: found.discountType,
    discountAmount: Number(discount.toFixed(2)),
    finalSubtotal: Number(Math.max(0, subtotal - discount).toFixed(2)),
    message: 'Cupom aplicado com sucesso!'
  };
}
